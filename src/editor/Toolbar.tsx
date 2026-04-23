interface Props {
  themeName: string;
  themeNames: string[];
  onThemeChange: (name: string) => void;
  onAddWidget: () => void;
  onBackground: () => void;
  onReset: () => void;
  onDone: () => void;
}

export function Toolbar({
  themeName, themeNames,
  onThemeChange, onAddWidget, onBackground, onReset, onDone,
}: Props) {
  return (
    <div className="edit-toolbar">
      <div className="et-left">
        <span className="et-label">EDIT MODE</span>
        <button className="et-btn" onClick={onAddWidget}>+ Widget</button>
        <button className="et-btn" onClick={onBackground}>Background</button>
        <select
          className="et-select"
          value={themeName}
          onChange={(e) => onThemeChange(e.target.value)}
        >
          {themeNames.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>
      <div className="et-right">
        <button className="et-btn et-btn-muted" onClick={onReset}>Reset</button>
        <button className="et-btn et-btn-primary" onClick={onDone}>Done</button>
      </div>
    </div>
  );
}
