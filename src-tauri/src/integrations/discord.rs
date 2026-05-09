use serde_json::Value;

pub async fn fetch(config: &Value) -> Result<Value, String> {
    let user_id = config
        .get("user_id")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    let bot_token = config
        .get("bot_token")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();

    if user_id.is_empty() {
        return Ok(serde_json::json!({
            "error": "Discord user ID is required",
            "configured": false,
        }));
    }

    if bot_token.is_empty() {
        return Ok(serde_json::json!({
            "configured": true,
            "user_id": user_id,
            "username": user_id,
            "global_name": format!("User {}", &user_id[..user_id.len().min(8)]),
            "profile_url": format!("https://discord.com/users/{}", user_id),
        }));
    }

    let client = reqwest::Client::new();

    let user_url = format!("https://discord.com/api/v10/users/{}", user_id);
    let user_resp = client
        .get(&user_url)
        .header("Authorization", format!("Bot {}", bot_token))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !user_resp.status().is_success() {
        let status = user_resp.status().as_u16();
        return Ok(serde_json::json!({
            "error": format!("Discord API returned status {}", status),
            "configured": true,
            "profile_url": format!("https://discord.com/users/{}", user_id),
        }));
    }

    let user_data: Value = user_resp.json().await.map_err(|e| e.to_string())?;

    let username = user_data
        .get("username")
        .and_then(|v| v.as_str())
        .unwrap_or("Unknown")
        .to_string();
    let discriminator = user_data
        .get("discriminator")
        .and_then(|v| v.as_str())
        .unwrap_or("0")
        .to_string();
    let avatar = user_data
        .get("avatar")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    let global_name = user_data
        .get("global_name")
        .and_then(|v| v.as_str())
        .unwrap_or(&username)
        .to_string();

    let avatar_url = if !avatar.is_empty() {
        format!(
            "https://cdn.discordapp.com/avatars/{}/{}.png?size=128",
            user_id, avatar
        )
    } else {
        String::new()
    };

    Ok(serde_json::json!({
        "configured": true,
        "username": username,
        "discriminator": discriminator,
        "global_name": global_name,
        "avatar_url": avatar_url,
        "profile_url": format!("https://discord.com/users/{}", user_id),
    }))
}
