use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct JobStats {
    pub job_type: String,
    pub worker_count: u32,
    pub avg_efficiency: f64,
    pub total_output: f64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct WorkOverview {
    pub jobs: Vec<JobStats>,
    pub unassigned_workers: u32,
    pub total_workers: u32,
    pub total_efficiency: f64,
}

impl Default for WorkOverview {
    fn default() -> Self {
        WorkOverview {
            jobs: Vec::new(),
            unassigned_workers: 0,
            total_workers: 0,
            total_efficiency: 0.0,
        }
    }
}
