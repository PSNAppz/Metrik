import type { WidgetProps } from "../types";
import { useIntegration, openUrl } from "../hooks/useIntegration";

export function SteamWidget({ label, style }: WidgetProps) {
  const { data, loading, configured } = useIntegration("steam", 120_000);
  const color = style?.color || "var(--color-primary)";
  const showLabel = style?.showLabel !== false;

  if (loading) {
    return (
      <div className="widget steam-widget">
        {showLabel && <div className="widget-label">{label || "STEAM"}</div>}
        <div className="int-loading">Loading...</div>
      </div>
    );
  }

  if (!configured) {
    return (
      <div className="widget steam-widget">
        {showLabel && <div className="widget-label">{label || "STEAM"}</div>}
        <div className="int-unconfigured">
          Configure in
          <br />
          Integrations panel
        </div>
      </div>
    );
  }

  const personaName = (data.persona_name as string) || "—";
  const status = (data.status as string) || "Unknown";
  const currentGame = (data.current_game as string) || "";
  const recentHours = (data.recent_playtime_hours as string) || "0.0";
  const profileUrl = (data.profile_url as string) || "";
  const storeUrl = (data.current_game_store_url as string) || "";

  return (
    <div className="widget steam-widget">
      {showLabel && <div className="widget-label">{label || "STEAM"}</div>}
      <div className="int-name" style={{ color }}>{personaName}</div>
      <div className="steam-status">{status}</div>
      {currentGame && (
        <div
          className="steam-game"
          onClick={(e) => {
            e.stopPropagation();
            if (storeUrl) openUrl(storeUrl);
          }}
          style={{ cursor: storeUrl ? "pointer" : "default" }}
        >
          Playing: {currentGame}
        </div>
      )}
      <div className="steam-playtime">{recentHours}h (2 weeks)</div>
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
            openUrl("steam://open/friends");
          }}
        >
          Open Steam
        </button>
      </div>
    </div>
  );
}
