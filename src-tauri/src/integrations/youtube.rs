use serde_json::Value;

const YOUTUBE_API_BASE: &str = "https://www.googleapis.com/youtube/v3";

pub async fn fetch(config: &Value) -> Result<Value, String> {
    let api_key = config
        .get("api_key")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    let channel_id = config
        .get("channel_id")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();

    if api_key.is_empty() || channel_id.is_empty() {
        return Ok(serde_json::json!({
            "error": "YouTube API key and channel ID are required",
            "configured": false,
        }));
    }

    let client = reqwest::Client::new();

    let channel_url = format!(
        "{}/channels?part=snippet,statistics&id={}&key={}",
        YOUTUBE_API_BASE, channel_id, api_key
    );

    let channel_resp = client
        .get(&channel_url)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !channel_resp.status().is_success() {
        let status = channel_resp.status().as_u16();
        return Ok(serde_json::json!({
            "error": format!("YouTube API returned status {}", status),
            "configured": true,
        }));
    }

    let channel_data: Value = channel_resp.json().await.map_err(|e| e.to_string())?;

    let item = channel_data
        .get("items")
        .and_then(|items| items.get(0));

    let (channel_name, subscriber_count, view_count, video_count) = match item {
        Some(item) => {
            let name = item
                .pointer("/snippet/title")
                .and_then(|v| v.as_str())
                .unwrap_or("Unknown")
                .to_string();
            let subs = item
                .pointer("/statistics/subscriberCount")
                .and_then(|v| v.as_str())
                .unwrap_or("0")
                .to_string();
            let views = item
                .pointer("/statistics/viewCount")
                .and_then(|v| v.as_str())
                .unwrap_or("0")
                .to_string();
            let videos = item
                .pointer("/statistics/videoCount")
                .and_then(|v| v.as_str())
                .unwrap_or("0")
                .to_string();
            (name, subs, views, videos)
        }
        None => {
            return Ok(serde_json::json!({
                "error": "Channel not found",
                "configured": true,
            }));
        }
    };

    let search_url = format!(
        "{}/search?part=snippet&channelId={}&order=date&maxResults=1&type=video&key={}",
        YOUTUBE_API_BASE, channel_id, api_key
    );

    let mut latest_title = String::new();
    let mut latest_video_id = String::new();
    let mut latest_published = String::new();

    if let Ok(resp) = client.get(&search_url).send().await {
        if let Ok(data) = resp.json::<Value>().await {
            if let Some(item) = data.get("items").and_then(|i| i.get(0)) {
                latest_title = item
                    .pointer("/snippet/title")
                    .and_then(|v| v.as_str())
                    .unwrap_or("")
                    .to_string();
                latest_video_id = item
                    .pointer("/id/videoId")
                    .and_then(|v| v.as_str())
                    .unwrap_or("")
                    .to_string();
                latest_published = item
                    .pointer("/snippet/publishedAt")
                    .and_then(|v| v.as_str())
                    .unwrap_or("")
                    .to_string();
            }
        }
    }

    Ok(serde_json::json!({
        "configured": true,
        "channel_name": channel_name,
        "subscriber_count": subscriber_count,
        "view_count": view_count,
        "video_count": video_count,
        "latest_title": latest_title,
        "latest_video_id": latest_video_id,
        "latest_published": latest_published,
        "channel_url": format!("https://www.youtube.com/channel/{}", channel_id),
    }))
}
