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
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_job_stats_default() {
        let stats = JobStats::default();
        assert_eq!(stats.job_type, String::new());
        assert_eq!(stats.worker_count, 0);
        assert_eq!(stats.avg_efficiency, 0.0);
        assert_eq!(stats.total_output, 0.0);
    }

    #[test]
    fn test_work_overview_default() {
        let overview = WorkOverview::default();
        assert!(overview.jobs.is_empty());
        assert_eq!(overview.unassigned_workers, 0);
        assert_eq!(overview.total_workers, 0);
        assert_eq!(overview.total_efficiency, 0.0);
    }
}
