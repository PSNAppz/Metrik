# Metrik Mods

This directory is the convention folder for custom extensions. You can add:

## Custom Widget (React)

1. Create a `.tsx` file in this folder (e.g., `MyWidget.tsx`)
2. Export a component that accepts `WidgetProps`:
   ```tsx
   import type { WidgetProps } from "../types";
   import { useMetricsContext } from "../providers/MetricsContext";

   export function MyWidget({ metricKey, label }: WidgetProps) {
     const metrics = useMetricsContext();
     const val = metricKey ? metrics.current[metricKey] : undefined;
     return <div className="widget">{/* your UI */}</div>;
   }
   ```
3. Register it in `src/widgets/widget-registry.ts`:
   ```ts
   import { MyWidget } from "../mods/MyWidget";
   // Add to WIDGET_REGISTRY:
   mywidget: MyWidget,
   ```
4. Use it in a layout JSON:
   ```json
   { "type": "mywidget", "metricKey": "gpu.usage", "label": "MY THING", "col": 1, "row": 1 }
   ```

## Custom Metric Provider (Rust)

1. Create a file in `src-tauri/src/providers/` (e.g., `my_provider.rs`)
2. Implement the `MetricProvider` trait:
   ```rust
   use super::{MetricProvider, MetricValue};
   use std::collections::HashMap;

   pub struct MyProvider;

   impl MetricProvider for MyProvider {
       fn name(&self) -> &'static str { "my" }
       fn poll(&self) -> HashMap<String, MetricValue> {
           let mut map = HashMap::new();
           map.insert("my.value".into(), MetricValue::Float(42.0));
           map
       }
   }
   ```
3. Add `pub mod my_provider;` to `src-tauri/src/providers/mod.rs`
4. Register in the providers vec in `src-tauri/src/lib.rs`:
   ```rust
   Arc::new(my_provider::MyProvider::new()),
   ```

## Custom Theme

Drop a JSON file in `src/themes/` following this shape:
```json
{
  "name": "My Theme",
  "colors": {
    "primary": "#FF0000",
    "secondary": "#00FF00",
    "accent": "#0000FF",
    "danger": "#FF4757",
    "text": "#FFFFFF",
    "background": "#000000"
  },
  "glow": { "intensity": 20, "enabled": true },
  "background": { "type": "solid", "color": "#000000" }
}
```
Then import it in `App.tsx` and add to the `THEMES` object.

## Custom Layout

Drop a JSON array file in `src/layouts/` and import + register it in `App.tsx` `LAYOUTS`.
