use serde::{Deserialize, Serialize};

/// Statistics for each job type
#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct JobStats {
    pub job_type: String,    // 工种名称
    pub worker_count: u32,   // 工人数
    pub avg_efficiency: f64, // 平均效率
    pub total_output: f64,   // 总产出贡献
}

/// Overview of all work statistics
#[derive(Clone, Debug, Serialize, Deserialize)]
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
