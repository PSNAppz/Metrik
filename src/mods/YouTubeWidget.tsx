import type { WidgetProps } from "../types";
import { useIntegration, openUrl } from "../hooks/useIntegration";

function formatCount(n: string): string {
  const num = parseInt(n, 10);
  if (isNaN(num)) return n;
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return num.toString();
}

export function YouTubeWidget({ label, style }: WidgetProps) {
  const { data, loading, configured } = useIntegration("youtube", 120_000);
  const color = style?.color || "var(--color-primary)";
  const showLabel = style?.showLabel !== false;

  if (loading) {
    return (
      <div className="widget youtube-widget">
        {showLabel && <div className="widget-label">{label || "YOUTUBE"}</div>}
        <div className="yt-loading">Loading...</div>
      </div>
    );
  }

  if (!configured) {
    return (
      <div className="widget youtube-widget">
        {showLabel && <div className="widget-label">{label || "YOUTUBE"}</div>}
        <div className="yt-unconfigured">
          Configure in
          <br />
          Integrations panel
        </div>
      </div>
    );
  }

  const channelName = (data.channel_name as string) || "—";
  const subs = formatCount((data.subscriber_count as string) || "0");
  const views = formatCount((data.view_count as string) || "0");
  const videos = formatCount((data.video_count as string) || "0");
  const latestTitle = (data.latest_title as string) || "";
  const channelUrl = (data.channel_url as string) || "";
  const latestVideoId = (data.latest_video_id as string) || "";

  return (
    <div className="widget youtube-widget">
      {showLabel && <div className="widget-label">{label || "YOUTUBE"}</div>}
      <div className="yt-channel" style={{ color }}>{channelName}</div>
      <div className="yt-stats">
        <span>{subs} subs</span>
        <span>{views} views</span>
        <span>{videos} vids</span>
      </div>
      {latestTitle && (
        <div
          className="yt-latest"
          title={latestTitle}
          onClick={(e) => {
            e.stopPropagation();
            if (latestVideoId)
              openUrl(`https://www.youtube.com/watch?v=${latestVideoId}`);
          }}
        >
          {latestTitle}
        </div>
      )}
      {channelUrl && (
        <button
          className="yt-link-btn"
          onClick={(e) => {
            e.stopPropagation();
            openUrl(channelUrl);
          }}
        >
          Open Channel
        </button>
      )}
    </div>
  );
}
