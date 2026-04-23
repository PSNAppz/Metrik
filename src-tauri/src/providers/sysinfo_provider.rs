use super::{MetricProvider, MetricValue};
use std::collections::HashMap;
use std::sync::Mutex;
use sysinfo::{Components, System};

pub struct SysInfoProvider {
    sys: Mutex<System>,
    components: Mutex<Components>,
}

impl SysInfoProvider {
    pub fn new() -> Self {
        let mut sys = System::new();
        sys.refresh_cpu_usage();
        Self {
            sys: Mutex::new(sys),
            components: Mutex::new(Components::new_with_refreshed_list()),
        }
    }
}

impl MetricProvider for SysInfoProvider {
    fn name(&self) -> &'static str {
        "sys"
    }

    fn poll(&self) -> HashMap<String, MetricValue> {
        let mut map = HashMap::new();

        {
            let mut sys = self.sys.lock().unwrap();
            sys.refresh_cpu_usage();
            sys.refresh_memory();

            let cpu_usage = sys.global_cpu_usage();
            map.insert("cpu.usage".into(), MetricValue::Float(cpu_usage as f64));

            map.insert(
                "ram".into(),
                MetricValue::Ratio {
                    used: sys.used_memory(),
                    total: sys.total_memory(),
                },
            );
        }

        {
            let mut components = self.components.lock().unwrap();
            components.refresh(true);
            for component in components.iter() {
                let label = component.label().to_lowercase();
                if label.contains("cpu") || label.contains("core") || label.contains("package") {
                    if let Some(temp) = component.temperature() {
                        map.insert("cpu.temp".into(), MetricValue::Float(temp as f64));
                        break;
                    }
                }
            }
        }

        map
    }
}
