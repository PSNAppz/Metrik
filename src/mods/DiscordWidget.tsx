import type { WidgetProps } from "../types";
import { useIntegration, openUrl } from "../hooks/useIntegration";

export function DiscordWidget({ label, style }: WidgetProps) {
  const { data, loading, configured } = useIntegration("discord", 60_000);
  const color = style?.color || "var(--color-primary)";
  const showLabel = style?.showLabel !== false;

  if (loading) {
    return (
      <div className="widget discord-widget">
        {showLabel && <div className="widget-label">{label || "DISCORD"}</div>}
        <div className="int-loading">Loading...</div>
      </div>
    );
  }

  if (!configured) {
    return (
      <div className="widget discord-widget">
        {showLabel && <div className="widget-label">{label || "DISCORD"}</div>}
        <div className="int-unconfigured">
          Configure in
          <br />
          Integrations panel
        </div>
      </div>
    );
  }

  const globalName = (data.global_name as string) || (data.username as string) || "—";
  const profileUrl = (data.profile_url as string) || "";

  return (
    <div className="widget discord-widget">
      {showLabel && <div className="widget-label">{label || "DISCORD"}</div>}
      <div className="int-name" style={{ color }}>{globalName}</div>
      <div className="int-actions">
        {profileUrl && (
          <button
            className="int-link-btn"
            onClick={(e) => {
              e.stopPropagation();
              openUrl(profileUrl);
            }}
          >
            Profile
          </button>
        )}
        <button
          className="int-link-btn"
          onClick={(e) => {
            e.stopPropagation();
            openUrl("discord://");
          }}
        >
          Open App
        </button>
      </div>
    </div>
  );
}
