use std::ops::Div;

pub fn bytes_to_gb(bytes: u64) -> f64 {
  (bytes as f64).div(1_000_000_000.0)
}
