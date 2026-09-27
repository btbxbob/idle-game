use super::super::*;
use wasm_bindgen::prelude::wasm_bindgen;

#[wasm_bindgen]
impl IdleGame {
    pub fn get_workers(&self) -> js_sys::Array {
        let workers_array = js_sys::Array::new();
        let current_stage = self.state.borrow().current_stage;

        for worker in self.workers.iter() {
            let worker_obj = js_sys::Object::new();
            let assigned_building = worker.assigned_building.as_deref();
            let base_efficiency = 1.0 + (worker.level as f64) * 0.05;
            let total_efficiency = assigned_building
                .map(|building| self.calculate_worker_efficiency_for(worker, building))
                .unwrap_or(base_efficiency);
            let breakdown = self.build_worker_efficiency_breakdown(worker, assigned_building);
            let (can_maggot_surgery, maggot_surgery_cost, maggot_surgery_reason) =
                self.get_maggot_limb_surgery_status(worker);

            let recommended_assignment = if assigned_building.is_none() {
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

            js_sys::Reflect::set(
                &worker_obj,
                &JsValue::from_str("name"),
                &JsValue::from_str(&worker.name),
            )
            .ok();

            js_sys::Reflect::set(
                &worker_obj,
                &JsValue::from_str("skills"),
                &JsValue::from_str(&worker.skills),
            )
            .ok();

            js_sys::Reflect::set(
                &worker_obj,
                &JsValue::from_str("background"),
                &JsValue::from_str(&worker.background),
            )
            .ok();

            js_sys::Reflect::set(
                &worker_obj,
                &JsValue::from_str("preferences"),
                &JsValue::from_str(&worker.preferences),
            )
            .ok();

            js_sys::Reflect::set(
                &worker_obj,
                &JsValue::from_str("assignedBuilding"),
                &match &worker.assigned_building {
                    Some(building) => JsValue::from_str(building),
                    None => JsValue::NULL,
                },
            )
            .ok();

            js_sys::Reflect::set(
                &worker_obj,
                &JsValue::from_str("level"),
                &JsValue::from_f64(worker.level as f64),
            )
            .ok();

            js_sys::Reflect::set(
                &worker_obj,
                &JsValue::from_str("efficiencyMultiplier"),
                &JsValue::from_f64(worker.efficiency_multiplier),
            )
            .ok();

            js_sys::Reflect::set(
                &worker_obj,
                &JsValue::from_str("baseEfficiency"),
                &JsValue::from_f64(base_efficiency),
            )
            .ok();

            js_sys::Reflect::set(
                &worker_obj,
                &JsValue::from_str("totalEfficiency"),
                &JsValue::from_f64(total_efficiency),
            )
            .ok();

            let breakdown_array = js_sys::Array::new();
            for part in breakdown {
                breakdown_array.push(&JsValue::from_str(&part));
            }
            js_sys::Reflect::set(
                &worker_obj,
                &JsValue::from_str("efficiencyBreakdown"),
                &breakdown_array,
            )
            .ok();

            js_sys::Reflect::set(
                &worker_obj,
                &JsValue::from_str("autoAssignmentTarget"),
                &match recommended_assignment {
                    Some(ref building) => JsValue::from_str(building),
                    None => JsValue::NULL,
                },
            )
            .ok();

            js_sys::Reflect::set(
                &worker_obj,
                &JsValue::from_str("xp"),
                &JsValue::from_f64(worker.xp),
            )
            .ok();

            js_sys::Reflect::set(
                &worker_obj,
                &JsValue::from_str("xpToNextLevel"),
                &JsValue::from_f64(worker.xp_to_next_level),
            )
            .ok();

            js_sys::Reflect::set(
                &worker_obj,
                &JsValue::from_str("gender"),
                &JsValue::from_str(&format!("{:?}", worker.gender)),
            )
            .ok();

            let hobbies = js_sys::Array::new();
            for hobby in &worker.hobbies {
                hobbies.push(&JsValue::from_str(&format!("{:?}", hobby)));
            }
            let _ = js_sys::Reflect::set(&worker_obj, &JsValue::from_str("hobbies"), &hobbies);

            js_sys::Reflect::set(
                &worker_obj,
                &JsValue::from_str("primaryTrait"),
                &JsValue::from_str(&format!("{:?}", worker.primary_trait)),
            )
            .ok();

            let secondary_traits = js_sys::Array::new();
            for t in &worker.secondary_traits {
                secondary_traits.push(&JsValue::from_str(&format!("{:?}", t)));
            }
            js_sys::Reflect::set(
                &worker_obj,
                &JsValue::from_str("secondaryTraits"),
                &secondary_traits,
            )
            .ok();

            js_sys::Reflect::set(
                &worker_obj,
                &JsValue::from_str("happiness"),
                &JsValue::from_f64(worker.happiness),
            )
            .ok();

            js_sys::Reflect::set(
                &worker_obj,
                &JsValue::from_str("hunger"),
                &JsValue::from_f64(worker.hunger),
            )
            .ok();

            js_sys::Reflect::set(
                &worker_obj,
                &JsValue::from_str("focus"),
                &JsValue::from_f64(worker.focus),
            )
            .ok();

            js_sys::Reflect::set(
                &worker_obj,
                &JsValue::from_str("fatigue"),
                &JsValue::from_f64(worker.fatigue),
            )
            .ok();

            js_sys::Reflect::set(
                &worker_obj,
                &JsValue::from_str("stress"),
                &JsValue::from_f64(worker.stress),
            )
            .ok();

            let missing_limbs = js_sys::Array::new();
            for limb in &worker.missing_limbs {
                missing_limbs.push(&JsValue::from_str(Self::limb_slot_label(*limb)));
            }
            js_sys::Reflect::set(
                &worker_obj,
                &JsValue::from_str("missingLimbs"),
                &missing_limbs,
            )
            .ok();

            let maggot_limbs = js_sys::Array::new();
            for limb in &worker.maggot_limbs {
                maggot_limbs.push(&JsValue::from_str(Self::limb_slot_label(*limb)));
            }
            js_sys::Reflect::set(
                &worker_obj,
                &JsValue::from_str("maggotLimbs"),
                &maggot_limbs,
            )
            .ok();

            js_sys::Reflect::set(
                &worker_obj,
                &JsValue::from_str("canMaggotSurgery"),
                &JsValue::from_bool(can_maggot_surgery),
            )
            .ok();

            js_sys::Reflect::set(
                &worker_obj,
                &JsValue::from_str("maggotSurgeryCost"),
                &JsValue::from_f64(maggot_surgery_cost),
            )
            .ok();

            js_sys::Reflect::set(
                &worker_obj,
                &JsValue::from_str("maggotSurgeryReason"),
                &match maggot_surgery_reason {
                    Some(ref reason) => JsValue::from_str(reason),
                    None => JsValue::NULL,
                },
            )
            .ok();

            workers_array.push(&worker_obj);
        }

        workers_array
    }

    #[wasm_bindgen]
    pub fn get_buildings(&self) -> JsValue {
        let current_stage = self.state.borrow().current_stage;
        let buildings: Vec<BuildingView> = self
            .buildings
            .iter()
            .enumerate()
            .filter(|(_, building)| {
                stage::is_building_revealed(building, current_stage, &self.technology_tree)
            })
            .map(|(index, building)| BuildingView {
                index,
                name: building.name.clone(),
                cost: building.cost,
                production_rate: building.production_rate,
                output_resource: building.output_resource,
                count: building.count,
            })
            .collect();
        serde_wasm_bindgen::to_value(&buildings).unwrap_or(JsValue::NULL)
    }

    #[wasm_bindgen]
    pub fn get_housing(&self) -> JsValue {
        let housing = js_sys::Array::new();
        for h in &self.housing_buildings {
            let obj = js_sys::Object::new();
            let level = h.count.max(1);
            let _ = js_sys::Reflect::set(
                &obj,
                &JsValue::from_str("name"),
                &JsValue::from_str(&h.name),
            );
            let _ = js_sys::Reflect::set(
                &obj,
                &JsValue::from_str("description"),
                &JsValue::from_str(&h.description),
            );
            let _ = js_sys::Reflect::set(
                &obj,
                &JsValue::from_str("icon"),
                &JsValue::from_str(&h.icon),
            );
            let _ = js_sys::Reflect::set(
                &obj,
                &JsValue::from_str("capacity"),
                &JsValue::from_f64((h.capacity * level) as f64),
            );
            let _ = js_sys::Reflect::set(
                &obj,
                &JsValue::from_str("baseCapacity"),
                &JsValue::from_f64(h.capacity as f64),
            );
            let _ = js_sys::Reflect::set(
                &obj,
                &JsValue::from_str("level"),
                &JsValue::from_f64(level as f64),
            );
            let _ = js_sys::Reflect::set(
                &obj,
                &JsValue::from_str("requiredTechnology"),
                &match &h.required_technology {
                    Some(value) => JsValue::from_str(value),
                    None => JsValue::NULL,
                },
            );
            let _ = js_sys::Reflect::set(
                &obj,
                &JsValue::from_str("upgradeCost"),
                &serde_wasm_bindgen::to_value(&h.get_upgrade_cost()).unwrap_or(JsValue::NULL),
            );
            housing.push(&obj);
        }
        housing.into()
    }

    #[wasm_bindgen]
    pub fn get_population_overview(&self) -> JsValue {
        let list = js_sys::Array::new();
        for (idx, worker) in self.workers.iter().enumerate() {
            let obj = js_sys::Object::new();
            let assigned = worker
                .assigned_building
                .clone()
                .unwrap_or_else(|| "未分配".to_string());
            let status = if worker.is_hungry {
                "饥饿"
            } else if worker.assigned_building.is_some() {
                "工作中"
            } else {
                "空闲"
            };
            let _ = js_sys::Reflect::set(
                &obj,
                &JsValue::from_str("id"),
                &JsValue::from_f64(idx as f64),
            );
            let _ = js_sys::Reflect::set(
                &obj,
                &JsValue::from_str("name"),
                &JsValue::from_str(&worker.name),
            );
            let _ = js_sys::Reflect::set(
                &obj,
                &JsValue::from_str("gender"),
                &JsValue::from_str(&format!("{:?}", worker.gender)),
            );
            let _ = js_sys::Reflect::set(&obj, &JsValue::from_str("age"), &JsValue::from_f64(0.0));
            let _ = js_sys::Reflect::set(
                &obj,
                &JsValue::from_str("skill_level"),
                &JsValue::from_str(&worker.skills),
            );
            let _ = js_sys::Reflect::set(
                &obj,
                &JsValue::from_str("assigned_building"),
                &JsValue::from_str(&assigned),
            );
            let _ = js_sys::Reflect::set(
                &obj,
                &JsValue::from_str("efficiency"),
                &JsValue::from_f64(worker.efficiency_multiplier),
            );
            let _ = js_sys::Reflect::set(
                &obj,
                &JsValue::from_str("mood"),
                &JsValue::from_f64(worker.happiness),
            );
            let _ = js_sys::Reflect::set(
                &obj,
                &JsValue::from_str("health"),
                &JsValue::from_f64(worker.health.clamp(0.0, 100.0)),
            );
            let _ = js_sys::Reflect::set(
                &obj,
                &JsValue::from_str("level"),
                &JsValue::from_f64(worker.level as f64),
            );
            let _ = js_sys::Reflect::set(
                &obj,
                &JsValue::from_str("status"),
                &JsValue::from_str(status),
            );
            let _ = js_sys::Reflect::set(
                &obj,
                &JsValue::from_str("is_hungry"),
                &JsValue::from_bool(worker.is_hungry),
            );
            let _ = js_sys::Reflect::set(
                &obj,
                &JsValue::from_str("focus"),
                &JsValue::from_f64(worker.focus),
            );
            let _ = js_sys::Reflect::set(
                &obj,
                &JsValue::from_str("fatigue"),
                &JsValue::from_f64(worker.fatigue),
            );
            let _ = js_sys::Reflect::set(
                &obj,
                &JsValue::from_str("stress"),
                &JsValue::from_f64(worker.stress),
            );
            list.push(&obj);
        }
        list.into()
    }

    #[wasm_bindgen]
    pub fn get_event_log_count(&self) -> usize {
        self.state.borrow().event_journal.entries.len()
    }

    #[wasm_bindgen]
    pub fn get_event_log_summaries(&self, offset: usize, limit: usize) -> JsValue {
        let state = self.state.borrow();
        let entries = &state.event_journal.entries;
        if entries.is_empty() || limit == 0 {
            return js_sys::Array::new().into();
        }

        let newest_first: Vec<_> = entries
            .iter()
            .rev()
            .skip(offset)
            .take(limit)
            .map(event::summarize_event_entry)
            .collect();
        serde_wasm_bindgen::to_value(&newest_first).unwrap_or(JsValue::NULL)
    }

    #[wasm_bindgen]
    pub fn get_event_log_detail(&self, event_id: u32) -> JsValue {
        let state = self.state.borrow();
        let rendered = state
            .event_journal
            .entries
            .iter()
            .find(|entry| entry.event_id == event_id)
            .and_then(event::render_event_entry);

        serde_wasm_bindgen::to_value(&rendered).unwrap_or(JsValue::NULL)
    }

    #[wasm_bindgen]
    pub fn get_active_event_modifiers(&self) -> JsValue {
        let state = self.state.borrow();
        let now = Date::now();
        let active: Vec<_> = state
            .event_journal
            .active_modifiers
            .iter()
            .filter_map(|modifier| event::render_active_modifier_view(modifier, now))
            .collect();

        serde_wasm_bindgen::to_value(&active).unwrap_or(JsValue::NULL)
    }

    #[wasm_bindgen]
    pub fn get_breaking_event_titles(&self, limit: usize) -> JsValue {
        let items = js_sys::Array::new();
        if limit == 0 {
            return items.into();
        }

        let state = self.state.borrow();
        for entry in state
            .event_journal
            .entries
            .iter()
            .rev()
            .filter(|entry| entry.is_breaking)
            .take(limit)
        {
            if let Some(rendered) = event::render_event_entry(entry) {
                let obj = js_sys::Object::new();
                let _ = js_sys::Reflect::set(
                    &obj,
                    &JsValue::from_str("eventId"),
                    &JsValue::from_f64(rendered.event_id as f64),
                );
                let _ = js_sys::Reflect::set(
                    &obj,
                    &JsValue::from_str("category"),
                    &JsValue::from_str(&rendered.category),
                );
                let _ = js_sys::Reflect::set(
                    &obj,
                    &JsValue::from_str("impact"),
                    &JsValue::from_str(&rendered.impact),
                );
                let _ = js_sys::Reflect::set(
                    &obj,
                    &JsValue::from_str("headlineZh"),
                    &JsValue::from_str(&rendered.headline_zh),
                );
                let _ = js_sys::Reflect::set(
                    &obj,
                    &JsValue::from_str("headlineEn"),
                    &JsValue::from_str(&rendered.headline_en),
                );
                let _ = js_sys::Reflect::set(
                    &obj,
                    &JsValue::from_str("timestamp"),
                    &JsValue::from_f64(rendered.timestamp),
                );
                items.push(&obj);
            }
        }

        items.into()
    }

    #[wasm_bindgen]
    pub fn get_event_catalog_capacity(&self) -> usize {
        event::catalog_capacity()
    }

    #[wasm_bindgen]
    pub fn get_worker_count(&self) -> u32 {
        self.workers.len() as u32
    }

    #[wasm_bindgen]
    pub fn get_worker_summaries(&self) -> JsValue {
        let workers: Vec<WorkerSummaryView> = self
            .workers
            .iter()
            .enumerate()
            .map(|(index, worker)| Self::worker_summary_view(worker, index))
            .collect();

        serde_wasm_bindgen::to_value(&workers).unwrap_or(JsValue::NULL)
    }

    #[wasm_bindgen]
    pub fn get_worker_page(
        &self,
        query: String,
        filter_by: String,
        sort_by: String,
        page: usize,
        page_size: usize,
    ) -> JsValue {
        let filtered_indices = self.build_filtered_worker_indices(&query, &filter_by, &sort_by);
        let total = filtered_indices.len();
        let assigned_count = filtered_indices
            .iter()
            .filter(|index| self.workers[**index].assigned_building.is_some())
            .count();
        let safe_page_size = page_size.max(1);
        let safe_page = page.max(1);
        let start = (safe_page - 1) * safe_page_size;

        let workers = if start >= total {
            Vec::new()
        } else {
            filtered_indices[start..(start + safe_page_size).min(total)]
                .iter()
                .map(|index| Self::worker_summary_view(&self.workers[*index], *index))
                .collect()
        };

        serde_wasm_bindgen::to_value(&WorkerPageView {
            total,
            assigned_count,
            page: safe_page,
            page_size: safe_page_size,
            workers,
        })
        .unwrap_or(JsValue::NULL)
    }

    #[wasm_bindgen]
    pub fn get_building_assignment_counts(&self) -> JsValue {
        let mut counts: HashMap<String, usize> = HashMap::new();
        for worker in &self.workers {
            if let Some(building) = worker.assigned_building.as_ref() {
                *counts.entry(building.clone()).or_insert(0) += 1;
            }
        }

        let mut items: Vec<BuildingAssignmentCountView> = self
            .buildings
            .iter()
            .map(|building| BuildingAssignmentCountView {
                name: building.name.clone(),
                assigned_count: counts.get(&building.name).copied().unwrap_or(0),
            })
            .collect();
        items.sort_unstable_by(|a, b| a.name.cmp(&b.name));

        serde_wasm_bindgen::to_value(&items).unwrap_or(JsValue::NULL)
    }

    #[wasm_bindgen]
    pub fn get_worker_details(&self, index: usize) -> JsValue {
        self.worker_detail_view(index)
            .and_then(|worker| serde_wasm_bindgen::to_value(&worker).ok())
            .unwrap_or(JsValue::NULL)
    }

    #[wasm_bindgen]
    pub fn assign_worker_auto(&mut self) -> u32 {
        let current_stage = self.state.borrow().current_stage;
        let candidate_buildings: Vec<String> = self
            .buildings
            .iter()
            .filter(|building| {
                building.count > 0
                    && stage::is_building_revealed(building, current_stage, &self.technology_tree)
            })
            .map(|building| building.name.clone())
            .collect();

        if candidate_buildings.is_empty() {
            return 0;
        }

        for worker in &mut self.workers {
            worker.assigned_building = None;
            worker.efficiency_multiplier = 1.0;
        }

        let mut assigned_count = 0u32;
        let mut remaining_slots: HashMap<String, usize> = self
            .buildings
            .iter()
            .filter(|building| {
                building.count > 0
                    && stage::is_building_revealed(building, current_stage, &self.technology_tree)
            })
            .map(|building| (building.name.clone(), building.count as usize))
            .collect();

        let mut worker_order: Vec<(usize, f64)> = (0..self.workers.len())
            .map(|idx| {
                let best_gain = self
                    .buildings
                    .iter()
                    .filter(|building| {
                        building.count > 0
                            && stage::is_building_revealed(
                                building,
                                current_stage,
                                &self.technology_tree,
                            )
                    })
                    .map(|building| self.calculate_assignment_gain(idx, building))
                    .fold(0.0, f64::max);
                (idx, best_gain)
            })
            .collect();

        worker_order.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));

        for (idx, _) in worker_order {
            let mut ranked_buildings: Vec<(String, f64)> = self
                .buildings
                .iter()
                .filter(|building| {
                    remaining_slots.get(&building.name).copied().unwrap_or(0) > 0
                        && stage::is_building_revealed(
                            building,
                            current_stage,
                            &self.technology_tree,
                        )
                })
                .map(|building| {
                    (
                        building.name.clone(),
                        self.calculate_assignment_gain(idx, building),
                    )
                })
                .collect();

            ranked_buildings.sort_by(|(name_a, gain_a), (name_b, gain_b)| {
                gain_b
                    .partial_cmp(gain_a)
                    .unwrap_or(std::cmp::Ordering::Equal)
                    .then_with(|| name_a.cmp(name_b))
            });

            if let Some((best_building, _)) = ranked_buildings.first() {
                if self.assign_worker(idx, best_building) {
                    if let Some(slots) = remaining_slots.get_mut(best_building) {
                        *slots = slots.saturating_sub(1);
                    }
                    assigned_count += 1;
                }
            }
        }

        assigned_count
    }

    #[wasm_bindgen]
    pub fn assign_worker_to_building(&mut self, worker_index: usize, building_id: &str) -> bool {
        if worker_index >= self.workers.len() {
            return false;
        }

        let building_exists = self.buildings.iter().any(|b| b.name == building_id);
        if !building_exists {
            return false;
        }

        if !self.has_assignment_capacity(worker_index, building_id) {
            return false;
        }

        self.workers[worker_index].assigned_building = Some(building_id.to_string());

        let efficiency = self.calculate_worker_efficiency_multiplier(worker_index, building_id);
        self.workers[worker_index].efficiency_multiplier = efficiency;

        self.update_production();

        true
    }

}
