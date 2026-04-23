pub mod nvml_provider;
pub mod sysinfo_provider;

use serde::Serialize;
use std::collections::HashMap;

#[derive(Serialize, Clone, Debug)]
#[serde(tag = "type", content = "value")]
pub enum MetricValue {
    Float(f64),
    Integer(i64),
    Ratio { used: u64, total: u64 },
    Text(String),
}

pub trait MetricProvider: Send + Sync {
    fn name(&self) -> &'static str;
    fn poll(&self) -> HashMap<String, MetricValue>;
}
