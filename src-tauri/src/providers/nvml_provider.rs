use super::{MetricProvider, MetricValue};
use nvml_wrapper::enum_wrappers::device::TemperatureSensor;
use nvml_wrapper::Nvml;
use std::collections::HashMap;
use std::sync::Mutex;

pub struct NvmlProvider {
    nvml: Mutex<Option<Nvml>>,
}

impl NvmlProvider {
    pub fn new() -> Self {
        let nvml = Nvml::init().ok();
        Self {
            nvml: Mutex::new(nvml),
        }
    }
}

impl MetricProvider for NvmlProvider {
    fn name(&self) -> &'static str {
        "gpu"
    }

    fn poll(&self) -> HashMap<String, MetricValue> {
        let mut map = HashMap::new();
        let guard = self.nvml.lock().unwrap();
        let nvml = match guard.as_ref() {
            Some(n) => n,
            None => return map,
        };

        let device = match nvml.device_by_index(0) {
            Ok(d) => d,
            Err(_) => return map,
        };

        if let Ok(name) = device.name() {
            map.insert("gpu.name".into(), MetricValue::Text(name));
        }

        if let Ok(util) = device.utilization_rates() {
            map.insert("gpu.usage".into(), MetricValue::Float(util.gpu as f64));
        }

        if let Ok(temp) = device.temperature(TemperatureSensor::Gpu) {
            map.insert("gpu.temp".into(), MetricValue::Float(temp as f64));
        }

        if let Ok(mem) = device.memory_info() {
            map.insert(
                "gpu.vram".into(),
                MetricValue::Ratio {
                    used: mem.used,
                    total: mem.total,
                },
            );
        }

        if let Ok(clock) = device.clock_info(nvml_wrapper::enum_wrappers::device::Clock::Graphics)
        {
            map.insert("gpu.clock".into(), MetricValue::Integer(clock as i64));
        }

        if let Ok(fan) = device.fan_speed(0) {
            map.insert("gpu.fan".into(), MetricValue::Float(fan as f64));
        }

        if let Ok(power) = device.power_usage() {
            map.insert(
                "gpu.power".into(),
                MetricValue::Float(power as f64 / 1000.0),
            );
        }

        map
    }
}
