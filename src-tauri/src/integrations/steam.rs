use serde_json::Value;

const STEAM_API_BASE: &str = "https://api.steampowered.com";

pub async fn fetch(config: &Value) -> Result<Value, String> {
    let api_key = config
        .get("api_key")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    let steam_id = config
        .get("steam_id")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();

    if api_key.is_empty() || steam_id.is_empty() {
        return Ok(serde_json::json!({
            "error": "Steam API key and Steam ID are required",
            "configured": false,
        }));
    }

    let client = reqwest::Client::new();

    let summary_url = format!(
        "{}/ISteamUser/GetPlayerSummaries/v2/?key={}&steamids={}",
        STEAM_API_BASE, api_key, steam_id
    );

    let summary_resp = client
        .get(&summary_url)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !summary_resp.status().is_success() {
        let status = summary_resp.status().as_u16();
        return Ok(serde_json::json!({
            "error": format!("Steam API returned status {}", status),
            "configured": true,
        }));
    }

    let summary_data: Value = summary_resp.json().await.map_err(|e| e.to_string())?;

    let player = summary_data
        .pointer("/response/players")
        .and_then(|p| p.get(0));

    let (persona_name, profile_url, avatar, persona_state, game_name, game_id) = match player {
        Some(p) => {
            let name = p
                .get("personaname")
                .and_then(|v| v.as_str())
                .unwrap_or("Unknown")
                .to_string();
            let url = p
                .get("profileurl")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();
            let av = p
                .get("avatarmedium")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();
            let state = p
                .get("personastate")
                .and_then(|v| v.as_u64())
                .unwrap_or(0);
            let game = p
                .get("gameextrainfo")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();
            let gid = p
                .get("gameid")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();
            (name, url, av, state, game, gid)
        }
        None => {
            return Ok(serde_json::json!({
                "error": "Player not found",
                "configured": true,
            }));
        }
    };

    let status_text = match persona_state {
        0 => "Offline",
        1 => "Online",
        2 => "Busy",
        3 => "Away",
        4 => "Snooze",
        5 => "Looking to trade",
        6 => "Looking to play",
        _ => "Unknown",
    };

    let mut recent_playtime_hours = 0.0_f64;
    let recent_url = format!(
        "{}/IPlayerService/GetRecentlyPlayedGames/v1/?key={}&steamid={}&count=5",
        STEAM_API_BASE, api_key, steam_id
    );
    if let Ok(resp) = client.get(&recent_url).send().await {
        if let Ok(data) = resp.json::<Value>().await {
            if let Some(games) = data.pointer("/response/games").and_then(|g| g.as_array()) {
                for g in games {
                    if let Some(mins) = g.get("playtime_2weeks").and_then(|v| v.as_f64()) {
                        recent_playtime_hours += mins / 60.0;
                    }
                }
            }
        }
    }

    let store_url = if !game_id.is_empty() {
        format!("https://store.steampowered.com/app/{}", game_id)
    } else {
        String::new()
    };

    Ok(serde_json::json!({
        "configured": true,
        "persona_name": persona_name,
        "profile_url": profile_url,
        "avatar_url": avatar,
        "status": status_text,
        "current_game": game_name,
        "current_game_id": game_id,
        "current_game_store_url": store_url,
        "recent_playtime_hours": format!("{:.1}", recent_playtime_hours),
    }))
}
