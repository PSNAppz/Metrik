import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { notifyIntegrationRefresh } from "../hooks/useIntegration";

interface Field {
  key: string;
  label: string;
  placeholder?: string;
  secret?: boolean;
}

interface Props {
  provider: string;
  title: string;
  fields: Field[];
  onClose: () => void;
}

export function IntegrationPanel({ provider, title, fields, onClose }: Props) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    invoke<Record<string, unknown>>("get_integration_config", { provider })
      .then((cfg) => {
        if (cfg && typeof cfg === "object") {
          const v: Record<string, string> = {};
          for (const f of fields) {
            const raw = cfg[f.key];
            if (typeof raw === "string") v[f.key] = raw;
          }
          setValues(v);
        }
      })
      .catch(() => {});
  }, [provider]);

  function handleSave() {
    invoke("save_integration_config", { provider, config: values })
      .then(() => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        setTimeout(() => notifyIntegrationRefresh(provider), 300);
      })
      .catch(() => {});
  }

  return (
    <div className="property-panel" onClick={(e) => e.stopPropagation()}>
      <div className="pp-header">
        <span>{title}</span>
        <button className="pp-close" onClick={onClose}>X</button>
      </div>

      {fields.map((f) => (
        <div className="pp-section" key={f.key}>
          <label>{f.label}</label>
          <input
            type={f.secret ? "password" : "text"}
            value={values[f.key] || ""}
            placeholder={f.placeholder}
            onChange={(e) =>
              setValues((prev) => ({ ...prev, [f.key]: e.target.value }))
            }
          />
        </div>
      ))}

      <div className="pp-section">
        <button
          className="et-btn et-btn-primary"
          style={{ width: "100%" }}
          onClick={handleSave}
        >
          {saved ? "Saved!" : "Save Config"}
        </button>
      </div>
    </div>
  );
}
