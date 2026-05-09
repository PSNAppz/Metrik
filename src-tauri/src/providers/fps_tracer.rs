use std::collections::HashMap;
use std::sync::Mutex;
use std::time::Instant;

static COUNTERS: Mutex<Option<HashMap<u32, PidCounter>>> = Mutex::new(None);
static SESSION_ACTIVE: Mutex<bool> = Mutex::new(false);

struct PidCounter {
    total: u64,
    last_count: u64,
    last_time: Instant,
    fps: f64,
}

const SESSION_NAME: &str = "MetrikFPSTrace\0";

// Microsoft-Windows-DXGI {CA11C036-0102-4A2D-A6AD-F03CFED5D3C9}
const DXGI_GUID: windows_sys::core::GUID = windows_sys::core::GUID {
    data1: 0xCA11C036,
    data2: 0x0102,
    data3: 0x4A2D,
    data4: [0xA6, 0xAD, 0xF0, 0x3C, 0xFE, 0xD5, 0xD3, 0xC9],
};

const WNODE_FLAG_TRACED_GUID: u32 = 0x00020000;
const EVENT_TRACE_REAL_TIME_MODE: u32 = 0x00000100;
const PROCESS_TRACE_MODE_REAL_TIME: u32 = 0x00000100;
const PROCESS_TRACE_MODE_EVENT_RECORD: u32 = 0x10000000;
const EVENT_TRACE_CONTROL_STOP: u32 = 1;
const EVENT_CONTROL_CODE_ENABLE_PROVIDER: u32 = 1;
const TRACE_LEVEL_INFORMATION: u8 = 4;

use windows_sys::Win32::System::Diagnostics::Etw::{
    CloseTrace, ControlTraceW, EnableTraceEx2, OpenTraceW, ProcessTrace, StartTraceW,
    CONTROLTRACE_HANDLE, EVENT_TRACE_LOGFILEW, EVENT_TRACE_PROPERTIES, EVENT_RECORD,
};

fn guid_eq(a: &windows_sys::core::GUID, b: &windows_sys::core::GUID) -> bool {
    a.data1 == b.data1 && a.data2 == b.data2 && a.data3 == b.data3 && a.data4 == b.data4
}

unsafe extern "system" fn event_callback(event: *mut EVENT_RECORD) {
    if event.is_null() {
        return;
    }
    let ev = &*event;
    if !guid_eq(&ev.EventHeader.ProviderId, &DXGI_GUID) {
        return;
    }
    // Event ID 42 = PresentStart (DXGI Present call)
    if ev.EventHeader.EventDescriptor.Id != 42 {
        return;
    }
    let pid = ev.EventHeader.ProcessId;
    if let Ok(mut guard) = COUNTERS.lock() {
        if let Some(map) = guard.as_mut() {
            let entry = map.entry(pid).or_insert(PidCounter {
                total: 0,
                last_count: 0,
                last_time: Instant::now(),
                fps: 0.0,
            });
            entry.total += 1;
        }
    }
}

pub fn start() {
    {
        let mut guard = COUNTERS.lock().unwrap();
        *guard = Some(HashMap::new());
    }
    std::thread::spawn(|| {
        if let Err(e) = run_trace() {
            log::warn!("FPS tracing not available: {}", e);
            let mut guard = COUNTERS.lock().unwrap();
            *guard = None;
        }
    });
}

fn session_name_wide() -> Vec<u16> {
    SESSION_NAME.encode_utf16().collect()
}

fn run_trace() -> Result<(), String> {
    unsafe {
        let name = session_name_wide();
        let props_alloc = std::mem::size_of::<EVENT_TRACE_PROPERTIES>() + 256;
        let mut buf = vec![0u8; props_alloc];
        let props = buf.as_mut_ptr() as *mut EVENT_TRACE_PROPERTIES;

        let zero_handle = CONTROLTRACE_HANDLE { Value: 0 };

        // Stop any stale session from a prior crash
        (*props).Wnode.BufferSize = props_alloc as u32;
        let _ = ControlTraceW(zero_handle, name.as_ptr(), props, EVENT_TRACE_CONTROL_STOP);

        // Configure a fresh session
        buf.iter_mut().for_each(|b| *b = 0);
        (*props).Wnode.BufferSize = props_alloc as u32;
        (*props).Wnode.Flags = WNODE_FLAG_TRACED_GUID;
        (*props).Wnode.ClientContext = 1; // QPC clock
        (*props).LogFileMode = EVENT_TRACE_REAL_TIME_MODE;
        (*props).LoggerNameOffset = std::mem::size_of::<EVENT_TRACE_PROPERTIES>() as u32;

        let mut session_handle = CONTROLTRACE_HANDLE { Value: 0 };
        let err = StartTraceW(
            &mut session_handle,
            name.as_ptr(),
            props,
        );
        if err != 0 {
            return Err(format!(
                "StartTraceW failed (error {}). Run as Administrator for FPS tracking.",
                err
            ));
        }

        {
            let mut active = SESSION_ACTIVE.lock().unwrap();
            *active = true;
        }

        let err = EnableTraceEx2(
            session_handle,
            &DXGI_GUID,
            EVENT_CONTROL_CODE_ENABLE_PROVIDER,
            TRACE_LEVEL_INFORMATION,
            0,
            0,
            0,
            std::ptr::null(),
        );
        if err != 0 {
            let _ = ControlTraceW(session_handle, name.as_ptr(), props, EVENT_TRACE_CONTROL_STOP);
                return Err(format!("EnableTraceEx2 failed (error {})", err));
        }

        let mut logfile: EVENT_TRACE_LOGFILEW = std::mem::zeroed();
        logfile.LoggerName = name.as_ptr() as *mut u16;
        logfile.Anonymous1.ProcessTraceMode =
            PROCESS_TRACE_MODE_REAL_TIME | PROCESS_TRACE_MODE_EVENT_RECORD;
        logfile.Anonymous2.EventRecordCallback = Some(event_callback);

        let trace = OpenTraceW(&mut logfile);
        if trace.Value == u64::MAX {
            let _ = ControlTraceW(session_handle, name.as_ptr(), props, EVENT_TRACE_CONTROL_STOP);
            return Err("OpenTraceW failed".into());
        }

        let mut handles = [trace];
        // Blocks until the session is stopped
        ProcessTrace(handles.as_mut_ptr(), 1, std::ptr::null(), std::ptr::null());
        CloseTrace(trace);
        Ok(())
    }
}

pub fn get_fps(pid: u32) -> Option<f64> {
    let mut guard = COUNTERS.lock().ok()?;
    let map = guard.as_mut()?;
    let entry = map.get_mut(&pid)?;

    let now = Instant::now();
    let elapsed = now.duration_since(entry.last_time).as_secs_f64();
    if elapsed >= 0.8 {
        let delta = entry.total.saturating_sub(entry.last_count);
        entry.fps = delta as f64 / elapsed;
        entry.last_count = entry.total;
        entry.last_time = now;
    }

    if entry.total > 0 {
        Some(entry.fps)
    } else {
        None
    }
}

pub fn is_active() -> bool {
    SESSION_ACTIVE.lock().map(|g| *g).unwrap_or(false)
}
