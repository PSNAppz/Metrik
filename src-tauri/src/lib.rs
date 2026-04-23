mod providers;

use providers::nvml_provider::NvmlProvider;
use providers::sysinfo_provider::SysInfoProvider;
use providers::{MetricProvider, MetricValue};
use serde::Serialize;
use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;
use tauri::Emitter;
use tauri::Manager;
use tauri_plugin_autostart::MacosLauncher;
use tauri_plugin_store::StoreExt;

#[derive(Serialize, Clone, Debug)]
pub struct MetricSnapshot {
    pub ts: u64,
    pub values: HashMap<String, MetricValue>,
}

fn start_metric_loop(app_handle: tauri::AppHandle) {
    let providers: Vec<Arc<dyn MetricProvider>> = vec![
        Arc::new(NvmlProvider::new()),
        Arc::new(SysInfoProvider::new()),
    ];

    std::thread::spawn(move || loop {
        let mut values = HashMap::new();
        for provider in &providers {
            values.extend(provider.poll());
        }

        let snapshot = MetricSnapshot {
            ts: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_millis() as u64,
            values,
        };

        let _ = app_handle.emit("metrics", &snapshot);
        std::thread::sleep(Duration::from_secs(1));
    });
}

#[tauri::command]
fn get_config(app: tauri::AppHandle) -> Result<serde_json::Value, String> {
    let store = app
        .store("config.json")
        .map_err(|e| e.to_string())?;
    let theme = store.get("theme").unwrap_or(serde_json::Value::String("cyberpunk".into()));
    let position = store.get("position").unwrap_or(serde_json::Value::Null);
    let widgets = store.get("widgets").unwrap_or(serde_json::Value::Null);
    let custom_background = store.get("custom_background").unwrap_or(serde_json::Value::Null);
    let custom_overlay = store.get("custom_overlay").unwrap_or(serde_json::Value::Null);

    Ok(serde_json::json!({
        "theme": theme,
        "position": position,
        "widgets": widgets,
        "custom_background": custom_background,
        "custom_overlay": custom_overlay,
    }))
}

#[tauri::command]
fn save_config(app: tauri::AppHandle, key: String, value: serde_json::Value) -> Result<(), String> {
    let store = app
        .store("config.json")
        .map_err(|e| e.to_string())?;
    store.set(&key, value);
    Ok(())
}

#[tauri::command]
fn exit_app(app: tauri::AppHandle) {
    app.exit(0);
}

#[tauri::command]
fn copy_background_file(app: tauri::AppHandle, source_path: String) -> Result<String, String> {
    let source = std::path::Path::new(&source_path);
    if !source.exists() {
        return Err("File not found".into());
    }

    let app_data = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    let bg_dir = app_data.join("backgrounds");
    std::fs::create_dir_all(&bg_dir).map_err(|e| e.to_string())?;

    let filename = source
        .file_name()
        .ok_or("Invalid filename")?
        .to_string_lossy()
        .to_string();

    let ts = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis();
    let dest_name = format!("{}_{}", ts, filename);
    let dest = bg_dir.join(&dest_name);

    std::fs::copy(source, &dest).map_err(|e| e.to_string())?;

    Ok(dest.to_string_lossy().to_string())
}

#[tauri::command]
fn get_app_data_dir(app: tauri::AppHandle) -> Result<String, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    Ok(dir.to_string_lossy().to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(w) = app.get_webview_window("main") {
                let _ = w.set_focus();
            }
        }))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec![]),
        ))
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Enable autostart
            use tauri_plugin_autostart::ManagerExt;
            let autostart = app.autolaunch();
            let _ = autostart.enable();

            start_metric_loop(app.handle().clone());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_config, save_config, exit_app, copy_background_file, get_app_data_dir])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
