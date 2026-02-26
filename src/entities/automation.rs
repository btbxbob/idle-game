/// Automation configuration for idle game
/// Manages auto-research, auto-build, and auto-worker assignment settings

/// Automation configuration structure
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct AutomationConfig {
    /// Enable automatic research
    pub auto_research_enabled: bool,
    /// Enable automatic building
    pub auto_build_enabled: bool,
    /// Enable automatic worker assignment
    pub auto_worker_assign_enabled: bool,
    /// Queue of technology IDs to research
    pub research_queue: Vec<String>,
    /// Queue of building IDs to construct
    pub build_queue: Vec<String>,
}

impl Default for AutomationConfig {
    fn default() -> Self {
        Self {
            auto_research_enabled: false,
            auto_build_enabled: false,
            auto_worker_assign_enabled: false,
            research_queue: Vec::new(),
            build_queue: Vec::new(),
        }
    }
}
