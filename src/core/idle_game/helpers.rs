use super::*;

impl IdleGame {
    pub(super) fn worker_summary_view(worker: &Worker, index: usize) -> WorkerSummaryView {
        WorkerSummaryView {
            index,
            name: worker.name.clone(),
            skills: worker.skills.clone(),
            background: worker.background.clone(),
            preferences: worker.preferences.clone(),
            assigned_building: worker.assigned_building.clone(),
            level: worker.level,
            efficiency_multiplier: worker.efficiency_multiplier,
            xp: worker.xp,
            xp_to_next_level: worker.xp_to_next_level,
            gender: format!("{:?}", worker.gender),
            hobbies: worker
                .hobbies
                .iter()
                .map(|hobby| format!("{:?}", hobby))
                .collect(),
            primary_trait: format!("{:?}", worker.primary_trait),
            secondary_traits: worker
                .secondary_traits
                .iter()
                .map(|trait_value| format!("{:?}", trait_value))
                .collect(),
            happiness: worker.happiness,
            hunger: worker.hunger,
            focus: worker.focus,
            fatigue: worker.fatigue,
            stress: worker.stress,
            is_hungry: worker.is_hungry,
            missing_limbs: worker
                .missing_limbs
                .iter()
                .map(|limb| Self::limb_slot_label(*limb).to_string())
                .collect(),
            maggot_limbs: worker
                .maggot_limbs
                .iter()
                .map(|limb| Self::limb_slot_label(*limb).to_string())
                .collect(),
        }
    }

    pub(super) fn worker_detail_view(&self, index: usize) -> Option<WorkerDetailView> {
        let worker = self.workers.get(index)?;
        let assigned_building = worker.assigned_building.as_deref();
        let base_efficiency = 1.0 + (worker.level as f64) * 0.05;
        let total_efficiency = assigned_building
            .map(|building| self.calculate_worker_efficiency_for(worker, building))
            .unwrap_or(base_efficiency);
        let breakdown = self.build_worker_efficiency_breakdown(worker, assigned_building);
        let (can_maggot_surgery, maggot_surgery_cost, maggot_surgery_reason) =
            self.get_maggot_limb_surgery_status(worker);
        let current_stage = self.state.borrow().current_stage;

        let auto_assignment_target = if assigned_building.is_none() {
            self.buildings
                .iter()
                .filter(|building| {
                    building.count > 0
                        && self.has_assignment_capacity(usize::MAX, &building.name)
                        && stage::is_building_revealed(
                            building,
                            current_stage,
                            &self.technology_tree,
                        )
                })
                .max_by(|a, b| {
                    let gain_a = a.production_rate
                        * a.count as f64
                        * (self.calculate_worker_efficiency_for(worker, &a.name) - 1.0);
                    let gain_b = b.production_rate
                        * b.count as f64
                        * (self.calculate_worker_efficiency_for(worker, &b.name) - 1.0);
                    gain_a
                        .partial_cmp(&gain_b)
                        .unwrap_or(std::cmp::Ordering::Equal)
                })
                .map(|building| building.name.clone())
        } else {
            None
        };

        Some(WorkerDetailView {
            index,
            name: worker.name.clone(),
            skills: worker.skills.clone(),
            background: worker.background.clone(),
            preferences: worker.preferences.clone(),
            assigned_building: worker.assigned_building.clone(),
            level: worker.level,
            efficiency_multiplier: worker.efficiency_multiplier,
            base_efficiency,
            total_efficiency,
            efficiency_breakdown: breakdown,
            auto_assignment_target,
            xp: worker.xp,
            xp_to_next_level: worker.xp_to_next_level,
            gender: format!("{:?}", worker.gender),
            hobbies: worker
                .hobbies
                .iter()
                .map(|hobby| format!("{:?}", hobby))
                .collect(),
            primary_trait: format!("{:?}", worker.primary_trait),
            secondary_traits: worker
                .secondary_traits
                .iter()
                .map(|trait_value| format!("{:?}", trait_value))
                .collect(),
            happiness: worker.happiness,
            hunger: worker.hunger,
            focus: worker.focus,
            fatigue: worker.fatigue,
            stress: worker.stress,
            is_hungry: worker.is_hungry,
            missing_limbs: worker
                .missing_limbs
                .iter()
                .map(|limb| Self::limb_slot_label(*limb).to_string())
                .collect(),
            maggot_limbs: worker
                .maggot_limbs
                .iter()
                .map(|limb| Self::limb_slot_label(*limb).to_string())
                .collect(),
            can_maggot_surgery,
            maggot_surgery_cost,
            maggot_surgery_reason,
        })
    }

    pub(super) fn build_filtered_worker_indices(
        &self,
        query: &str,
        filter_by: &str,
        sort_by: &str,
    ) -> Vec<usize> {
        let query = query.trim().to_lowercase();
        let mut indices: Vec<usize> = self
            .workers
            .iter()
            .enumerate()
            .filter(|(_, worker)| {
                let is_assigned = worker.assigned_building.is_some();
                if filter_by == "assigned" && !is_assigned {
                    return false;
                }
                if filter_by == "unassigned" && is_assigned {
                    return false;
                }
                if query.is_empty() {
                    return true;
                }

                Self::worker_matches_query(worker, &query)
            })
            .map(|(index, _)| index)
            .collect();

        indices.sort_unstable_by(|a, b| {
            let worker_a = &self.workers[*a];
            let worker_b = &self.workers[*b];
            match sort_by {
                "level" => worker_b.level.cmp(&worker_a.level),
                "efficiency" => worker_b
                    .efficiency_multiplier
                    .total_cmp(&worker_a.efficiency_multiplier),
                _ => worker_a.name.cmp(&worker_b.name),
            }
        });

        indices
    }

    pub(super) fn worker_matches_query(worker: &Worker, query: &str) -> bool {
        Self::field_matches_query(&worker.name, query)
            || Self::field_matches_query(&worker.skills, query)
            || Self::field_matches_query(&worker.preferences, query)
            || worker
                .assigned_building
                .as_deref()
                .is_some_and(|building| Self::field_matches_query(building, query))
    }

    pub(super) fn field_matches_query(value: &str, query: &str) -> bool {
        value.to_lowercase().contains(query)
    }

    pub(super) fn limb_slot_label(slot: LimbSlot) -> &'static str {
        match slot {
            LimbSlot::LeftArm => "左手",
            LimbSlot::RightArm => "右手",
            LimbSlot::LeftLeg => "左腿",
            LimbSlot::RightLeg => "右腿",
        }
    }

    pub(super) fn maggot_limb_surgery_cost(worker: &Worker) -> f64 {
        worker.missing_limbs.len() as f64 * 15.0
    }

    pub(super) fn has_maggot_limb_surgery_unlock(&self) -> bool {
        self.state.borrow().current_stage >= GameStage::Maggot
    }

    pub(super) fn get_maggot_limb_surgery_status(&self, worker: &Worker) -> (bool, f64, Option<String>) {
        let cost = Self::maggot_limb_surgery_cost(worker);
        if worker.missing_limbs.is_empty() {
            return (false, cost, Some("当前没有残缺肢体".to_string()));
        }

        if !self.has_maggot_limb_surgery_unlock() {
            return (false, cost, Some("蛆虫阶段尚未解锁肢体置换".to_string()));
        }

        let available_maggots = self.state.borrow().get_resource(ResourceType::Maggot);
        if available_maggots + 1e-10 < cost {
            return (
                false,
                cost,
                Some(format!("蛆虫不足：需要 {:.0}", cost.ceil())),
            );
        }

        (true, cost, None)
    }

    pub(super) fn worker_job_profile(building_id: &str) -> WorkerJobProfile {
        match building_id {
            "金币矿山" | "伐木场" | "采石场" | "铁矿场" | "铜矿场" | "铝矿场" | "煤矿场"
            | "石油井" | "水晶矿" => WorkerJobProfile {
                labor: 1.0,
                precision: 0.2,
                cognitive: 0.1,
                organic: 0.0,
                social: 0.1,
            },
            "农场" | "腐食育蛆槽" | "蛆虫工厂" | "腐肉育池" | "共生培育舱" => {
                WorkerJobProfile {
                    labor: 0.4,
                    precision: 0.3,
                    cognitive: 0.2,
                    organic: 1.0,
                    social: 0.5,
                }
            }
            "铁锭冶炼厂" | "铜锭冶炼厂" | "钢铁厂" | "玻璃厂" | "塑料厂" | "齿轮厂" | "电池厂"
            | "发电机厂" | "机器人工厂" => WorkerJobProfile {
                labor: 0.8,
                precision: 0.55,
                cognitive: 0.35,
                organic: 0.0,
                social: 0.1,
            },
            "化学品厂"
            | "电路板厂"
            | "马达厂"
            | "传感器厂"
            | "芯片制造厂"
            | "量子计算中心"
            | "纳米机器人工厂"
            | "反物质反应堆"
            | "时间水晶合成器"
            | "神经尖塔"
            | "深空孵化港" => WorkerJobProfile {
                labor: 0.25,
                precision: 0.95,
                cognitive: 1.0,
                organic: 0.0,
                social: 0.25,
            },
            _ => WorkerJobProfile {
                labor: 0.35,
                precision: 0.35,
                cognitive: 0.35,
                organic: 0.1,
                social: 0.2,
            },
        }
    }

    pub(super) fn count_workers_assigned_to_building(
        &self,
        building_id: &str,
        excluding_worker: Option<usize>,
    ) -> usize {
        self.workers
            .iter()
            .enumerate()
            .filter(|(index, worker)| {
                excluding_worker != Some(*index)
                    && worker.assigned_building.as_deref() == Some(building_id)
            })
            .count()
    }

    pub(super) fn building_assignment_capacity(&self, building_id: &str) -> usize {
        self.buildings
            .iter()
            .find(|building| building.name == building_id)
            .map(|building| building.count as usize)
            .unwrap_or(0)
    }

    pub(super) fn has_assignment_capacity(&self, worker_index: usize, building_id: &str) -> bool {
        self.count_workers_assigned_to_building(building_id, Some(worker_index))
            < self.building_assignment_capacity(building_id)
    }

    pub(super) fn worker_limb_modifier(&self, worker: &Worker, profile: WorkerJobProfile) -> f64 {
        let mut modifier = 0.0;

        for limb in &worker.missing_limbs {
            modifier -= match limb {
                LimbSlot::LeftArm | LimbSlot::RightArm => {
                    0.06 + (profile.labor * 0.10) + (profile.precision * 0.16)
                }
                LimbSlot::LeftLeg | LimbSlot::RightLeg => {
                    0.05 + (profile.labor * 0.12)
                        + (profile.organic * 0.05)
                        + (profile.social * 0.03)
                }
            };
        }

        for limb in &worker.maggot_limbs {
            modifier += match limb {
                LimbSlot::LeftArm | LimbSlot::RightArm => {
                    (profile.organic * 0.10) + (profile.social * 0.03) - (profile.precision * 0.04)
                }
                LimbSlot::LeftLeg | LimbSlot::RightLeg => {
                    (profile.organic * 0.08) + (profile.labor * 0.03) - (profile.cognitive * 0.02)
                }
            };
        }

        modifier
    }

    pub(super) fn worker_job_fit_bonus(
        &self,
        worker: &Worker,
        building_id: &str,
        profile: WorkerJobProfile,
    ) -> f64 {
        let skill = worker.skills.to_lowercase();
        let background = worker.background.to_lowercase();
        let mut bonus = 0.0;

        if worker.preferences == building_id {
            bonus += 0.35;
        }

        if (skill.contains("min") || skill.contains("石") || skill.contains("矿"))
            && profile.labor >= 0.8
        {
            bonus += 0.14;
        }
        if (skill.contains("farm") || skill.contains("food") || skill.contains("survival"))
            && profile.organic >= 0.8
        {
            bonus += 0.14;
        }
        if (skill.contains("factory") || skill.contains("craft") || skill.contains("engin"))
            && profile.precision >= 0.5
        {
            bonus += 0.12;
        }
        if (skill.contains("research") || skill.contains("tech") || skill.contains("comput"))
            && profile.cognitive >= 0.8
        {
            bonus += 0.14;
        }

        if (background.contains("工匠")
            || background.contains("车间")
            || background.contains("实验"))
            && profile.precision >= 0.5
        {
            bonus += 0.08;
        }
        if (background.contains("农") || background.contains("生存") || background.contains("照料"))
            && profile.organic >= 0.8
        {
            bonus += 0.08;
        }

        for hobby in &worker.hobbies {
            bonus += match hobby {
                Hobby::Gardening | Hobby::Cooking if profile.organic >= 0.8 => 0.08,
                Hobby::Reading | Hobby::Gaming | Hobby::Photography if profile.cognitive >= 0.8 => {
                    0.07
                }
                Hobby::Sports | Hobby::Fishing if profile.labor >= 0.8 => 0.06,
                Hobby::Music | Hobby::Art if profile.social >= 0.4 || profile.organic >= 0.8 => {
                    0.05
                }
                _ => 0.0,
            };
        }

        bonus += match worker.primary_trait {
            Trait::Careful if profile.precision >= 0.8 => 0.08,
            Trait::Creative if profile.cognitive >= 0.8 || profile.organic >= 0.8 => 0.08,
            Trait::Diligent | Trait::Persevering if profile.labor >= 0.8 => 0.08,
            Trait::Social | Trait::Charismatic if profile.social >= 0.4 => 0.07,
            Trait::Loner if profile.social >= 0.4 => -0.05,
            Trait::Clumsy | Trait::Careless if profile.precision >= 0.8 => -0.08,
            Trait::NightOwl if profile.cognitive >= 0.8 => 0.05,
            Trait::EarlyBird if profile.organic >= 0.8 || profile.labor >= 0.8 => 0.05,
            _ => 0.0,
        };

        bonus
    }

    pub(super) fn worker_state_bonus(&self, worker: &Worker, profile: WorkerJobProfile) -> f64 {
        let happiness_bonus = ((worker.happiness - 50.0) / 50.0)
            * (0.08 + profile.social * 0.07 + profile.organic * 0.05);
        let focus_bonus = ((worker.focus - 50.0) / 50.0)
            * (0.04 + profile.precision * 0.08 + profile.cognitive * 0.1);
        let fatigue_penalty =
            (worker.fatigue / 100.0) * (0.05 + profile.labor * 0.18 + profile.precision * 0.05);
        let stress_penalty =
            (worker.stress / 100.0) * (0.04 + profile.cognitive * 0.12 + profile.social * 0.08);
        let hunger_penalty = if worker.is_hungry || worker.hunger >= 75.0 {
            0.22
        } else if worker.hunger >= 40.0 {
            0.11
        } else {
            0.0
        };

        happiness_bonus + focus_bonus - fatigue_penalty - stress_penalty - hunger_penalty
    }

    pub(super) fn refresh_worker_state(&mut self, elapsed: f64) {
        if elapsed <= 0.0 {
            return;
        }

        for worker in &mut self.workers {
            let assigned = worker.assigned_building.clone();
            if let Some(building_id) = assigned.as_deref() {
                let profile = Self::worker_job_profile(building_id);
                let preference_drive = if worker.preferences == building_id {
                    -0.25
                } else {
                    0.2
                };

                worker.fatigue = (worker.fatigue
                    + ((0.5 + profile.labor * 1.8 + profile.cognitive * 0.4 + preference_drive)
                        * elapsed))
                    .clamp(0.0, 100.0);
                worker.stress = (worker.stress
                    + ((0.35 + profile.precision * 0.8 + profile.cognitive * 1.0
                        - worker.happiness * 0.004)
                        * elapsed))
                    .clamp(0.0, 100.0);
                worker.focus = (worker.focus
                    + ((0.2 + profile.cognitive * 0.8 + profile.precision * 0.6
                        - worker.stress * 0.01
                        - worker.hunger * 0.004)
                        * elapsed))
                    .clamp(0.0, 100.0);
            } else {
                worker.fatigue = (worker.fatigue - (1.4 * elapsed)).clamp(0.0, 100.0);
                worker.stress = (worker.stress - (1.1 * elapsed)).clamp(0.0, 100.0);
                worker.focus = (worker.focus + (0.8 * elapsed)).clamp(0.0, 100.0);
            }
        }
    }

    pub(super) fn mark_objective_step_completed(&mut self, step_id: &str) {
        let mut state = self.state.borrow_mut();
        if !state
            .objective_chain
            .completed_steps
            .iter()
            .any(|completed| completed == step_id)
        {
            state
                .objective_chain
                .completed_steps
                .push(step_id.to_string());
        }
    }

    pub(super) fn try_grant_stage_reward(&mut self, stage: GameStage) {
        if stage != GameStage::Workers {
            return;
        }

        let reward_id = "stage_workers";
        let mut state = self.state.borrow_mut();
        if state
            .objective_chain
            .granted_stage_rewards
            .iter()
            .any(|granted| granted == reward_id)
        {
            return;
        }

        state.add_resource(ResourceType::Food, 10.0);
        state.add_resource(ResourceType::Gold, 30.0);
        state
            .objective_chain
            .granted_stage_rewards
            .push(reward_id.to_string());
    }

    pub(super) fn sync_objective_progress(&mut self) {
        let current_stage = self.state.borrow().current_stage;
        if current_stage < GameStage::Workers {
            return;
        }

        let farm_count = self
            .buildings
            .iter()
            .find(|building| building.name == "农场")
            .map(|building| building.count)
            .unwrap_or(0);
        let food_ready = self.state.borrow().get_resource(ResourceType::Food) >= 1.0;
        let assigned_workers = self
            .workers
            .iter()
            .filter(|worker| worker.assigned_building.is_some())
            .count();
        let purchased_technologies = self
            .technology_tree
            .technologies
            .values()
            .filter(|technology| technology.purchased)
            .count();

        if farm_count >= 1 {
            self.mark_objective_step_completed("build_farm");
        }
        if food_ready {
            self.mark_objective_step_completed("gain_food");
        }
        if assigned_workers >= 1 {
            self.mark_objective_step_completed("assign_worker");
        }
        if purchased_technologies >= 1 {
            self.mark_objective_step_completed("research_first_tech");
        }

        if current_stage >= GameStage::Maggot {
            let maggots_ready = self.state.borrow().get_resource(ResourceType::Maggot) >= 1.0;
            let maggot_factory_count = self
                .buildings
                .iter()
                .find(|building| building.name == "蛆虫工厂")
                .map(|building| building.count)
                .unwrap_or(0);
            let has_maggot_breeding = self
                .technology_tree
                .is_unlocked(crate::entities::technology::TechnologyId::MaggotBreeding);
            let has_necrotic_recycling = self
                .technology_tree
                .is_unlocked(crate::entities::technology::TechnologyId::NecroticRecycling);

            if maggots_ready {
                self.mark_objective_step_completed("gain_maggot");
            }
            if has_maggot_breeding || has_necrotic_recycling {
                self.mark_objective_step_completed("research_maggot_tech");
            }
            if maggot_factory_count >= 1 {
                self.mark_objective_step_completed("build_maggot_facility");
            }
        }

        if current_stage >= GameStage::Hybrid {
            let (hybrid_population, symbiosis_stability) = {
                let state = self.state.borrow();
                (
                    state.coexistence.hybrid_population,
                    state.coexistence.symbiosis_stability,
                )
            };
            let symbiosis_chambers = self
                .buildings
                .iter()
                .find(|building| building.name == "共生培育舱")
                .map(|building| building.count)
                .unwrap_or(0);
            let has_hive_mind = self
                .technology_tree
                .is_unlocked(crate::entities::technology::TechnologyId::HiveMindProtocol);

            if hybrid_population >= 1.0 {
                self.mark_objective_step_completed("gain_hybrid_population");
            }
            if symbiosis_chambers >= 1 {
                self.mark_objective_step_completed("build_symbiosis_chamber");
            }
            if symbiosis_stability >= 55.0 {
                self.mark_objective_step_completed("stabilize_symbiosis");
            }
            if has_hive_mind {
                self.mark_objective_step_completed("research_hive_mind");
            }
        }

        if current_stage >= GameStage::Collective {
            let dark_matter_ready =
                self.state.borrow().get_resource(ResourceType::DarkMatter) >= 1.0;
            let spaceships_ready = self.state.borrow().get_resource(ResourceType::Spaceship) >= 1.0;
            let has_collective_awakening = self
                .technology_tree
                .is_unlocked(crate::entities::technology::TechnologyId::CollectiveAwakening);
            let has_consciousness_upload = self
                .technology_tree
                .is_unlocked(crate::entities::technology::TechnologyId::ConsciousnessUpload);

            if has_collective_awakening {
                self.mark_objective_step_completed("awaken_collective");
            }
            if dark_matter_ready {
                self.mark_objective_step_completed("produce_dark_matter");
            }
            if has_consciousness_upload {
                self.mark_objective_step_completed("upload_consciousness");
            }
            if spaceships_ready {
                self.mark_objective_step_completed("launch_first_ship");
            }
        }
    }

    pub(super) fn refresh_progression_state(&mut self) {
        let inferred_stage = {
            let state = self.state.borrow();
            stage::infer_stage_from_state(&state, &self.workers, &self.technology_tree)
        };

        let current_stage = {
            let mut state = self.state.borrow_mut();
            if state.current_stage < inferred_stage {
                state.current_stage = inferred_stage;
            }
            state.current_stage
        };

        self.try_grant_stage_reward(current_stage);
        self.sync_objective_progress();
    }

    pub(super) fn get_worker_objective_chain_view(&self) -> ObjectiveChainView {
        let state = self.state.borrow();
        if state.current_stage < GameStage::Workers {
            return ObjectiveChainView {
                active: false,
                stage_id: state.current_stage.id().to_string(),
                current_objective_id: None,
                steps: Vec::new(),
            };
        }

        if state.current_stage >= GameStage::Collective {
            let dark_matter = state.get_resource(ResourceType::DarkMatter);
            let spaceships = state.get_resource(ResourceType::Spaceship);
            let completed = &state.objective_chain.completed_steps;
            let is_completed = |step_id: &str| completed.iter().any(|value| value == step_id);
            let has_collective_awakening = self
                .technology_tree
                .is_unlocked(crate::entities::technology::TechnologyId::CollectiveAwakening);
            let has_consciousness_upload = self
                .technology_tree
                .is_unlocked(crate::entities::technology::TechnologyId::ConsciousnessUpload);

            let steps = vec![
                ObjectiveStepView {
                    id: "awaken_collective".to_string(),
                    title: "完成统一意识觉醒".to_string(),
                    description: "让共生体真正进入统一意识，终局扩张才会开启。".to_string(),
                    current: if is_completed("awaken_collective") || has_collective_awakening {
                        1.0
                    } else {
                        0.0
                    },
                    required: 1.0,
                    completed: is_completed("awaken_collective") || has_collective_awakening,
                    reward: "终局网络已激活".to_string(),
                    recommended_tab: "technology".to_string(),
                },
                ObjectiveStepView {
                    id: "produce_dark_matter".to_string(),
                    title: "产出第一批暗物质".to_string(),
                    description: "让黑暗链条真正并入终局资源网络。".to_string(),
                    current: if is_completed("produce_dark_matter") {
                        1.0
                    } else {
                        dark_matter.min(1.0)
                    },
                    required: 1.0,
                    completed: is_completed("produce_dark_matter"),
                    reward: "终局资源网络建立".to_string(),
                    recommended_tab: "resources".to_string(),
                },
                ObjectiveStepView {
                    id: "upload_consciousness".to_string(),
                    title: "研究意识上传".to_string(),
                    description: "把个体生产彻底并入统一调度体系。".to_string(),
                    current: if is_completed("upload_consciousness") || has_consciousness_upload {
                        1.0
                    } else {
                        0.0
                    },
                    required: 1.0,
                    completed: is_completed("upload_consciousness") || has_consciousness_upload,
                    reward: "文明级效率跃迁".to_string(),
                    recommended_tab: "technology".to_string(),
                },
                ObjectiveStepView {
                    id: "launch_first_ship".to_string(),
                    title: "建造第一艘太空船".to_string(),
                    description: "把统一意识投射到文明尺度的远征网络。".to_string(),
                    current: if is_completed("launch_first_ship") {
                        1.0
                    } else {
                        spaceships.min(1.0)
                    },
                    required: 1.0,
                    completed: is_completed("launch_first_ship"),
                    reward: "星际扩张开始".to_string(),
                    recommended_tab: "buildings".to_string(),
                },
            ];

            let current_objective_id = steps
                .iter()
                .find(|step| !step.completed)
                .map(|step| step.id.clone());

            return ObjectiveChainView {
                active: true,
                stage_id: state.current_stage.id().to_string(),
                current_objective_id,
                steps,
            };
        }

        if state.current_stage >= GameStage::Hybrid {
            let hybrid_population = state.coexistence.hybrid_population;
            let symbiosis_stability = state.coexistence.symbiosis_stability;
            let completed = &state.objective_chain.completed_steps;
            let is_completed = |step_id: &str| completed.iter().any(|value| value == step_id);
            let symbiosis_chambers = self
                .buildings
                .iter()
                .find(|building| building.name == "共生培育舱")
                .map(|building| building.count as f64)
                .unwrap_or(0.0);
            let has_hive_mind = self
                .technology_tree
                .is_unlocked(crate::entities::technology::TechnologyId::HiveMindProtocol);

            let steps = vec![
                ObjectiveStepView {
                    id: "gain_hybrid_population".to_string(),
                    title: "获得第一批混合人口".to_string(),
                    description: "让共生不再只是状态，而成为可用劳动力。".to_string(),
                    current: if is_completed("gain_hybrid_population") {
                        1.0
                    } else {
                        hybrid_population.min(1.0)
                    },
                    required: 1.0,
                    completed: is_completed("gain_hybrid_population"),
                    reward: "共生劳动力可用".to_string(),
                    recommended_tab: "lifecycle".to_string(),
                },
                ObjectiveStepView {
                    id: "build_symbiosis_chamber".to_string(),
                    title: "建造第一座共生培育舱".to_string(),
                    description: "为混合人口提供稳定扩张的物理载体。".to_string(),
                    current: if is_completed("build_symbiosis_chamber") {
                        1.0
                    } else {
                        symbiosis_chambers.min(1.0)
                    },
                    required: 1.0,
                    completed: is_completed("build_symbiosis_chamber"),
                    reward: "共生体系扩张".to_string(),
                    recommended_tab: "buildings".to_string(),
                },
                ObjectiveStepView {
                    id: "stabilize_symbiosis".to_string(),
                    title: "维持共生稳定度".to_string(),
                    description: "把社会风险控制在可运转范围内。".to_string(),
                    current: if is_completed("stabilize_symbiosis") {
                        55.0
                    } else {
                        symbiosis_stability.min(55.0)
                    },
                    required: 55.0,
                    completed: is_completed("stabilize_symbiosis"),
                    reward: "秩序暂时稳定".to_string(),
                    recommended_tab: "lifecycle".to_string(),
                },
                ObjectiveStepView {
                    id: "research_hive_mind".to_string(),
                    title: "研究蜂巢协议".to_string(),
                    description: "让共生个体进入共享思维网络，准备终局跃迁。".to_string(),
                    current: if is_completed("research_hive_mind") || has_hive_mind {
                        1.0
                    } else {
                        0.0
                    },
                    required: 1.0,
                    completed: is_completed("research_hive_mind") || has_hive_mind,
                    reward: "集体意识入口已出现".to_string(),
                    recommended_tab: "technology".to_string(),
                },
            ];

            let current_objective_id = steps
                .iter()
                .find(|step| !step.completed)
                .map(|step| step.id.clone());

            return ObjectiveChainView {
                active: true,
                stage_id: state.current_stage.id().to_string(),
                current_objective_id,
                steps,
            };
        }

        if state.current_stage >= GameStage::Maggot {
            let maggots = state.get_resource(ResourceType::Maggot);
            let completed = &state.objective_chain.completed_steps;
            let is_completed = |step_id: &str| completed.iter().any(|value| value == step_id);
            let maggot_factory = self
                .buildings
                .iter()
                .find(|building| building.name == "蛆虫工厂")
                .map(|building| building.count as f64)
                .unwrap_or(0.0);
            let has_maggot_breeding = self
                .technology_tree
                .is_unlocked(crate::entities::technology::TechnologyId::MaggotBreeding);
            let has_necrotic_recycling = self
                .technology_tree
                .is_unlocked(crate::entities::technology::TechnologyId::NecroticRecycling);
            let dark_conversion_completed = state.objective_chain.dark_conversion_completed
                || state
                    .objective_chain
                    .completed_steps
                    .iter()
                    .any(|value| value == "complete_dark_conversion");

            let steps = vec![
                ObjectiveStepView {
                    id: "inspect_decay".to_string(),
                    title: "查看生命周期异常".to_string(),
                    description: "先理解聚落正在发生什么，黑暗分支才有意义。".to_string(),
                    current: 1.0,
                    required: 1.0,
                    completed: true,
                    reward: "异常记录已更新".to_string(),
                    recommended_tab: "lifecycle".to_string(),
                },
                ObjectiveStepView {
                    id: "gain_maggot".to_string(),
                    title: "获得第一批蛆虫".to_string(),
                    description: "让死亡后果第一次转化为可利用的资源。".to_string(),
                    current: if is_completed("gain_maggot") {
                        1.0
                    } else {
                        maggots.min(1.0)
                    },
                    required: 1.0,
                    completed: is_completed("gain_maggot"),
                    reward: "黑暗资源链出现".to_string(),
                    recommended_tab: "resources".to_string(),
                },
                ObjectiveStepView {
                    id: "research_maggot_tech".to_string(),
                    title: "研究首项黑暗科技".to_string(),
                    description: "用科技把黑暗链条从偶然转向可控扩张。".to_string(),
                    current: if is_completed("research_maggot_tech")
                        || has_maggot_breeding
                        || has_necrotic_recycling
                    {
                        1.0
                    } else {
                        0.0
                    },
                    required: 1.0,
                    completed: is_completed("research_maggot_tech")
                        || has_maggot_breeding
                        || has_necrotic_recycling,
                    reward: "共生过渡路线出现".to_string(),
                    recommended_tab: "technology".to_string(),
                },
                ObjectiveStepView {
                    id: "build_maggot_facility".to_string(),
                    title: "建造第一座蛆虫工厂".to_string(),
                    description: "用黑暗科技把偶发尸腐转成稳定生产线。".to_string(),
                    current: if is_completed("build_maggot_facility") {
                        1.0
                    } else {
                        maggot_factory.min(1.0)
                    },
                    required: 1.0,
                    completed: is_completed("build_maggot_facility"),
                    reward: "黑暗加工已开启".to_string(),
                    recommended_tab: "buildings".to_string(),
                },
                ObjectiveStepView {
                    id: "complete_dark_conversion".to_string(),
                    title: "完成第一次黑暗转化".to_string(),
                    description: "让蛆虫第一次被加工成可用产出，完成首轮黑暗闭环。".to_string(),
                    current: if dark_conversion_completed { 1.0 } else { 0.0 },
                    required: 1.0,
                    completed: dark_conversion_completed,
                    reward: "黑暗闭环成立".to_string(),
                    recommended_tab: "work".to_string(),
                },
            ];

            let current_objective_id = steps
                .iter()
                .find(|step| !step.completed)
                .map(|step| step.id.clone());

            return ObjectiveChainView {
                active: true,
                stage_id: state.current_stage.id().to_string(),
                current_objective_id,
                steps,
            };
        }

        let farm_count = self
            .buildings
            .iter()
            .find(|building| building.name == "农场")
            .map(|building| building.count as f64)
            .unwrap_or(0.0);
        let food_amount = state.get_resource(ResourceType::Food);
        let assigned_workers = self
            .workers
            .iter()
            .filter(|worker| worker.assigned_building.is_some())
            .count() as f64;
        let purchased_technologies = self
            .technology_tree
            .technologies
            .values()
            .filter(|technology| technology.purchased)
            .count() as f64;
        let completed = &state.objective_chain.completed_steps;
        let is_completed = |step_id: &str| completed.iter().any(|value| value == step_id);

        let steps = vec![
            ObjectiveStepView {
                id: "build_farm".to_string(),
                title: "建造第一座农场".to_string(),
                description: "先建立稳定的食物来源，工人阶段才能真正运转。".to_string(),
                current: if is_completed("build_farm") {
                    1.0
                } else {
                    farm_count.min(1.0)
                },
                required: 1.0,
                completed: is_completed("build_farm"),
                reward: "食物补给 +5".to_string(),
                recommended_tab: "buildings".to_string(),
            },
            ObjectiveStepView {
                id: "gain_food".to_string(),
                title: "获得第一份食物".to_string(),
                description: "让聚落先吃上第一口饭，供养系统才算启动。".to_string(),
                current: if is_completed("gain_food") {
                    1.0
                } else {
                    food_amount.min(1.0)
                },
                required: 1.0,
                completed: is_completed("gain_food"),
                reward: "金币补给 +15".to_string(),
                recommended_tab: "resources".to_string(),
            },
            ObjectiveStepView {
                id: "assign_worker".to_string(),
                title: "分配第一名工人".to_string(),
                description: "让第一位工人进入岗位，开始真正的人口驱动产能。".to_string(),
                current: if is_completed("assign_worker") {
                    1.0
                } else {
                    assigned_workers.min(1.0)
                },
                required: 1.0,
                completed: is_completed("assign_worker"),
                reward: "效率观察已解锁".to_string(),
                recommended_tab: "workers".to_string(),
            },
            ObjectiveStepView {
                id: "research_first_tech".to_string(),
                title: "研究第一项科技".to_string(),
                description: "用第一项科技把聚落从生存模式推向系统化扩张。".to_string(),
                current: if is_completed("research_first_tech") {
                    1.0
                } else {
                    purchased_technologies.min(1.0)
                },
                required: 1.0,
                completed: is_completed("research_first_tech"),
                reward: "新生产线即将展开".to_string(),
                recommended_tab: "technology".to_string(),
            },
        ];

        let current_objective_id = steps
            .iter()
            .find(|step| !step.completed)
            .map(|step| step.id.clone());

        ObjectiveChainView {
            active: true,
            stage_id: state.current_stage.id().to_string(),
            current_objective_id,
            steps,
        }
    }

    pub(super) fn calculate_worker_efficiency_multiplier(
        &self,
        worker_index: usize,
        building_id: &str,
    ) -> f64 {
        if worker_index >= self.workers.len() {
            return 1.0;
        }

        let worker = &self.workers[worker_index];
        self.calculate_worker_efficiency_for(worker, building_id)
    }

    pub(super) fn calculate_worker_efficiency_for(&self, worker: &Worker, building_id: &str) -> f64 {
        let profile = Self::worker_job_profile(building_id);
        let mut efficiency = 1.0;
        efficiency += self.worker_job_fit_bonus(worker, building_id, profile);
        efficiency += (worker.level as f64) * 0.04;
        efficiency += worker.primary_trait.get_effect().efficiency_bonus;
        efficiency += worker
            .secondary_traits
            .iter()
            .map(|trait_value| trait_value.get_effect().efficiency_bonus * 0.5)
            .sum::<f64>();
        efficiency += self.worker_state_bonus(worker, profile);
        efficiency += self.worker_limb_modifier(worker, profile);
        efficiency.max(0.25)
    }

    pub(super) fn build_worker_efficiency_breakdown(
        &self,
        worker: &Worker,
        building_id: Option<&str>,
    ) -> Vec<String> {
        let mut parts = vec!["基础 100%".to_string()];

        if let Some(target_building) = building_id {
            let profile = Self::worker_job_profile(target_building);
            if worker.preferences == target_building {
                parts.push("偏好岗位 +35%".to_string());
            }
            let fit_bonus = self.worker_job_fit_bonus(worker, target_building, profile);
            if fit_bonus.abs() > 0.001 {
                parts.push(format!("岗位契合 {:+.0}%", fit_bonus * 100.0));
            }
            let state_bonus = self.worker_state_bonus(worker, profile);
            if state_bonus.abs() > 0.001 {
                parts.push(format!("状态修正 {:+.0}%", state_bonus * 100.0));
            }
            let limb_bonus = self.worker_limb_modifier(worker, profile);
            if limb_bonus.abs() > 0.001 {
                parts.push(format!("肢体修正 {:+.0}%", limb_bonus * 100.0));
            }
        }

        let level_bonus = (worker.level as f64) * 4.0;
        if level_bonus > 0.0 {
            parts.push(format!("等级加成 +{:.0}%", level_bonus));
        }

        let primary_bonus = worker.primary_trait.get_effect().efficiency_bonus;
        if primary_bonus.abs() > f64::EPSILON {
            parts.push(format!("主特质 {:+.0}%", primary_bonus * 100.0));
        }

        let secondary_bonus = worker
            .secondary_traits
            .iter()
            .map(|trait_value| trait_value.get_effect().efficiency_bonus * 0.5)
            .sum::<f64>();
        if secondary_bonus.abs() > f64::EPSILON {
            parts.push(format!("副特质 {:+.0}%", secondary_bonus * 100.0));
        }

        parts.push(format!("专注 {:.0}", worker.focus));
        parts.push(format!("疲劳 {:.0}", worker.fatigue));
        parts.push(format!("压力 {:.0}", worker.stress));

        parts
    }

    pub(super) fn lifecycle_anomaly_state(&self) -> (&'static str, &'static str) {
        let hungry_workers = self
            .workers
            .iter()
            .filter(|worker| worker.is_hungry)
            .count();
        let corpses = self.state.borrow().get_resource(ResourceType::Corpse);
        let food = self.state.borrow().get_resource(ResourceType::Food);

        if corpses >= 1.0 || hungry_workers >= 2 {
            return (
                "breach",
                "尸体开始出现不正常的异动，聚落里已经没人愿意靠近储藏区。",
            );
        }

        if hungry_workers >= 1 || food <= 0.0 {
            return (
                "decay",
                "饥饿和死亡的气味正在扩散，秩序已经出现肉眼可见的裂缝。",
            );
        }

        if food < self.workers.len() as f64 + 1.0 {
            return (
                "warning",
                "空气里开始弥漫紧张和腐败的味道，补给似乎撑不了太久。",
            );
        }

        (
            "stable",
            "聚落暂时维持住了秩序，但所有人都知道这种平衡并不牢靠。",
        )
    }

    pub(super) fn calculate_assignment_gain(&self, worker_index: usize, building: &Building) -> f64 {
        if building.count == 0 {
            return 0.0;
        }

        let efficiency = self.calculate_worker_efficiency_multiplier(worker_index, &building.name);
        let base_output = building.production_rate * building.count as f64;
        (base_output * (efficiency - 1.0)).max(0.0)
    }

    /// Serialize entire game state to SavedGame structure
    pub fn save_game(&self) -> SavedGame {
        SavedGame {
            state: self.state.borrow().clone(),
            statistics: self.statistics.borrow().clone(),
            buildings: self.buildings.clone(),
            housing_buildings: self.housing_buildings.clone(),
            workers: self.workers.clone(),
            population_queue: self.population_queue.clone(),
            achievements: self.achievements.clone(),
            legacy_crafting_recipes: vec![],
            unlocked_features: self.unlocked_features.clone(),
            technology_tree: self.technology_tree.clone(),
            last_food_consumption_time: self.last_food_consumption_time,
            last_worker_spawn_time: self.last_worker_spawn_time,
            save_timestamp: Date::now(),
            version: crate::state::game_state::SAVE_VERSION.to_string(),
        }
    }

    /// Load game state from SavedGame structure
    pub fn load_game(&mut self, saved: SavedGame) {
        let now = Date::now();
        const MAX_RESUME_AGE_MS: f64 = 3_600_000.0;

        {
            let mut state = self.state.borrow_mut();
            *state = saved.state;
            state.last_update_time =
                clamp_loaded_timestamp(state.last_update_time, now, MAX_RESUME_AGE_MS);
        }

        {
            let mut stats = self.statistics.borrow_mut();
            *stats = saved.statistics;
        }

        self.buildings = saved.buildings;
        for building in &mut self.buildings {
            building.name = normalize_building_name(&building.name);
            let inferred = infer_output_resource_from_building_name(&building.name);
            if building.output_resource == ResourceType::Gold && inferred != ResourceType::Gold {
                building.output_resource = inferred;
            }
        }
        self.housing_buildings = merge_loaded_housing_catalog(saved.housing_buildings);
        self.workers = saved.workers;
        normalize_worker_building_references(&mut self.workers);
        self.population_queue = saved.population_queue;
        self.achievements = saved.achievements;
        self.unlocked_features = saved.unlocked_features;
        self.technology_tree = saved.technology_tree;
        {
            let inferred_stage = {
                let state = self.state.borrow();
                stage::infer_stage_from_state(&state, &self.workers, &self.technology_tree)
            };
            let mut state = self.state.borrow_mut();
            if state.current_stage < inferred_stage {
                state.current_stage = inferred_stage;
            }
        }
        self.last_food_consumption_time =
            clamp_loaded_timestamp(saved.last_food_consumption_time, now, MAX_RESUME_AGE_MS);
        self.last_worker_spawn_time =
            clamp_loaded_timestamp(saved.last_worker_spawn_time, now, MAX_RESUME_AGE_MS);

        {
            let mut state = self.state.borrow_mut();
            state.coins_per_click = calculate_click_power_from_buildings(&self.buildings);
        }

        self.update_production();

        // Ensure default workers exist if save is empty (backwards compatibility)
        if self.workers.is_empty() && self.state.borrow().current_stage >= GameStage::Workers {
            self.workers = vec![
                Worker::new("矿工", "mining", "擅长挖矿的工人", "金币矿山"),
                Worker::new("伐木工", "logging", "擅长伐木的工人", "伐木场"),
                Worker::new("石匠", "masonry", "擅长采石的工人", "采石场"),
                Worker::new("工厂工人", "factory", "擅长工厂生产的工人", "金币矿山"),
                Worker::new("高级工匠", "crafting", "擅长高级制作的工匠", "采石场"),
            ];
        }

        // Ensure default housing exists if save is empty (backwards compatibility)
        if self.housing_buildings.is_empty() {
            self.housing_buildings = default_housing_catalog();
        }

        self.refresh_progression_state();
    }
}
