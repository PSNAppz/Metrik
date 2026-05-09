pub mod youtube;
pub mod discord;
pub mod steam;

use serde_json::Value;

pub async fn fetch_provider_data(provider: &str, config: &Value) -> Result<Value, String> {
    match provider {
        "youtube" => youtube::fetch(config).await,
        "discord" => discord::fetch(config).await,
        "steam" => steam::fetch(config).await,
        _ => Err(format!("Unknown integration provider: {}", provider)),
    }
}
