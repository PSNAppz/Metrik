// Dev-only harness: open http://localhost:5173/src/dev/harness.html under `npm run dev` to render widgets against a fake metrics stream in a plain browser.
import { createRoot } from "react-dom/client";
import { useEffect, useState } from "react";
import { MetricsContext } from "../providers/MetricsContext";
import type { MetricsState } from "../hooks/useMetrics";
import { SparklineWidget } from "../widgets/SparklineWidget";
import { CardWidget } from "../widgets/CardWidget";
import { GaugeWidget } from "../widgets/GaugeWidget";
import "@fontsource/unbounded/800.css";
import "@fontsource/space-mono/700.css";
import "../styles/global.css";

function Fake() {
  const [state, setState] = useState<MetricsState>({ current: {}, history: {} });
  useEffect(() => {
    let v = 20;
    const id = setInterval(() => {
      v = Math.max(0, Math.min(100, v + (Math.random() - 0.5) * 30));
      setState((p) => ({
        current: { ...p.current, "gpu.usage": { type: "Float", value: v } },
        history: { ...p.history, "gpu.usage": [...(p.history["gpu.usage"] || []).slice(-59), v] },
      }));
    }, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <MetricsContext.Provider value={state}>
      <div style={{ display: "flex", gap: 12, padding: 12, background: "#050505", width: 800 }}>
        <div style={{ width: 776, height: 108 }}><SparklineWidget metricKey="gpu.usage" label="GPU" /></div>
        <div style={{ width: 182, height: 104 }}><CardWidget metricKey="gpu.usage" label="GPU" w={182} h={104} /></div>
        <div style={{ width: 170, height: 220 }}><GaugeWidget metricKey="gpu.usage" label="GPU" /></div>
      </div>
    </MetricsContext.Provider>
  );
}
createRoot(document.getElementById("root")!).render(<Fake />);
