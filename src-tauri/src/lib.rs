mod providers;

use providers::nvml_provider::NvmlProvider;
use providers::sysinfo_provider::SysInfoProvider;
use providers::game_provider::GameProvider;
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

mod integrations;

fn start_metric_loop(app_handle: tauri::AppHandle) {
    let providers: Vec<Arc<dyn MetricProvider>> = vec![
        Arc::new(NvmlProvider::new()),
        Arc::new(SysInfoProvider::new()),
        Arc::new(GameProvider::new()),
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
    let theme = store.get("theme").unwrap_or(serde_json::Value::String("amber".into()));
    let position = store.get("position").unwrap_or(serde_json::Value::Null);
    let widgets = store.get("widgets").unwrap_or(serde_json::Value::Null);
    let custom_background = store.get("custom_background").unwrap_or(serde_json::Value::Null);
    let custom_overlay = store.get("custom_overlay").unwrap_or(serde_json::Value::Null);
    let layout_version = store.get("layout_version").unwrap_or(serde_json::Value::Null);

    let style_preset_0 = store.get("style_preset_0").unwrap_or(serde_json::Value::Null);
    let style_preset_1 = store.get("style_preset_1").unwrap_or(serde_json::Value::Null);
    let style_preset_2 = store.get("style_preset_2").unwrap_or(serde_json::Value::Null);

    Ok(serde_json::json!({
        "theme": theme,
        "position": position,
        "widgets": widgets,
        "custom_background": custom_background,
        "custom_overlay": custom_overlay,
        "layout_version": layout_version,
        "style_preset_0": style_preset_0,
        "style_preset_1": style_preset_1,
        "style_preset_2": style_preset_2,
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

#[tauri::command]
fn get_autostart_enabled(app: tauri::AppHandle) -> Result<bool, String> {
    use tauri_plugin_autostart::ManagerExt;
    app.autolaunch()
        .is_enabled()
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn open_url(url: String) -> Result<(), String> {
    open::that(&url).map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_integration_data(
    app: tauri::AppHandle,
    provider: String,
) -> Result<serde_json::Value, String> {
    let store = app.store("config.json").map_err(|e| e.to_string())?;
    let config = store
        .get(&format!("integrations.{}", provider))
        .unwrap_or(serde_json::Value::Null);
    integrations::fetch_provider_data(&provider, &config).await
}

#[tauri::command]
fn save_integration_config(
    app: tauri::AppHandle,
    provider: String,
    config: serde_json::Value,
) -> Result<(), String> {
    let store = app.store("config.json").map_err(|e| e.to_string())?;
    store.set(&format!("integrations.{}", provider), config);
    Ok(())
}

#[tauri::command]
fn get_integration_config(
    app: tauri::AppHandle,
    provider: String,
) -> Result<serde_json::Value, String> {
    let store = app.store("config.json").map_err(|e| e.to_string())?;
    Ok(store
        .get(&format!("integrations.{}", provider))
        .unwrap_or(serde_json::Value::Null))
}

#[tauri::command]
fn set_autostart_enabled(app: tauri::AppHandle, enabled: bool) -> Result<(), String> {
    use tauri_plugin_autostart::ManagerExt;
    let autolaunch = app.autolaunch();
    if enabled {
        autolaunch.enable().map_err(|e| e.to_string())
    } else {
        autolaunch.disable().map_err(|e| e.to_string())
    }
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

            // Build tray menu
            use tauri::menu::{MenuBuilder, MenuItemBuilder};
            use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};

            let show_item = MenuItemBuilder::with_id("show", "Show Metrik").build(app)?;
            let exit_item = MenuItemBuilder::with_id("exit", "Exit").build(app)?;
            let menu = MenuBuilder::new(app)
                .items(&[&show_item, &exit_item])
                .build()?;

            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .tooltip("Metrik")
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(w) = app.get_webview_window("main") {
                            let _ = w.show();
                            let _ = w.set_focus();
                        }
                    }
                })
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(w) = app.get_webview_window("main") {
                            let _ = w.show();
                            let _ = w.set_focus();
                        }
                    }
                    "exit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .build(app)?;

            providers::fps_tracer::start();
            start_metric_loop(app.handle().clone());
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_config,
            save_config,
            exit_app,
            copy_background_file,
            get_app_data_dir,
            get_autostart_enabled,
            set_autostart_enabled,
            open_url,
            get_integration_data,
            save_integration_config,
            get_integration_config
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
