use crate::entities::Worker;
use serde::{Deserialize, Serialize};

/// 人口队列 - 管理等待入住的工人
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PopulationQueue {
    pub waiting_workers: Vec<Worker>,
}

impl PopulationQueue {
    /// 创建新的人口队列
    pub fn new() -> Self {
        PopulationQueue {
            waiting_workers: Vec::new(),
        }
    }

    /// 获取等待队列中的工人数量
    pub fn len(&self) -> usize {
        self.waiting_workers.len()
    }

    /// 检查队列是否为空
    pub fn is_empty(&self) -> bool {
        self.waiting_workers.is_empty()
    }

    /// 将工人添加到队列末尾
    pub fn push_back(&mut self, worker: Worker) {
        self.waiting_workers.push(worker);
    }

    /// 从队列前部移除并返回一个工人
    pub fn pop_front(&mut self) -> Option<Worker> {
        if self.waiting_workers.is_empty() {
            None
        } else {
            Some(self.waiting_workers.remove(0))
        }
    }

    /// 查看队列前部的工人（不移除）
    pub fn front(&self) -> Option<&Worker> {
        self.waiting_workers.first()
    }

    /// 清空队列
    pub fn clear(&mut self) {
        self.waiting_workers.clear();
    }
}

impl Default for PopulationQueue {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::entities::Worker;

    #[test]
    fn test_population_queue_new() {
        let queue = PopulationQueue::new();
        assert_eq!(queue.len(), 0);
        assert!(queue.is_empty());
    }

    #[test]
    fn test_population_queue_push_and_pop() {
        let mut queue = PopulationQueue::new();

        let worker1 = Worker::new("Worker 1", "mining", "Test worker 1", "Any");
        let worker2 = Worker::new("Worker 2", "logging", "Test worker 2", "Any");

        queue.push_back(worker1);
        queue.push_back(worker2);

        assert_eq!(queue.len(), 2);
        assert!(!queue.is_empty());

        // Pop front should return workers in FIFO order
        let popped1 = queue.pop_front();
        assert!(popped1.is_some());
        assert_eq!(popped1.unwrap().name, "Worker 1");

        let popped2 = queue.pop_front();
        assert!(popped2.is_some());
        assert_eq!(popped2.unwrap().name, "Worker 2");

        assert_eq!(queue.len(), 0);
        assert!(queue.is_empty());
    }

    #[test]
    fn test_population_queue_pop_empty() {
        let mut queue = PopulationQueue::new();
        assert!(queue.pop_front().is_none());
    }

    #[test]
    fn test_population_queue_front() {
        let mut queue = PopulationQueue::new();
        let worker = Worker::new("Worker 1", "mining", "Test worker", "Any");

        queue.push_back(worker);

        assert_eq!(queue.front().unwrap().name, "Worker 1");
        assert_eq!(queue.len(), 1); // front() doesn't remove

        queue.pop_front();
        assert!(queue.front().is_none());
    }

    #[test]
    fn test_population_queue_clear() {
        let mut queue = PopulationQueue::new();

        for i in 0..5 {
            queue.push_back(Worker::new(
                &format!("Worker {}", i),
                "mining",
                "Test",
                "Any",
            ));
        }

        assert_eq!(queue.len(), 5);

        queue.clear();

        assert_eq!(queue.len(), 0);
        assert!(queue.is_empty());
    }
}
