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
    let theme = store
        .get("theme")
        .unwrap_or(serde_json::Value::String("cyberpunk".into()));
    let layout = store
        .get("layout")
        .unwrap_or(serde_json::Value::String("full-panel".into()));
    let position = store
        .get("position")
        .unwrap_or(serde_json::Value::Null);
    let monitor = store
        .get("monitor")
        .unwrap_or(serde_json::Value::Null);

    Ok(serde_json::json!({
        "theme": theme,
        "layout": layout,
        "position": position,
        "monitor": monitor,
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(w) = app.get_webview_window("main") {
                let _ = w.set_focus();
            }
        }))
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
        .invoke_handler(tauri::generate_handler![get_config, save_config, exit_app])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
