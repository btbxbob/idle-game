use crate::entities::{Building, Trait, Worker};
use crate::state::{
    EventCategory, EventImpact, EventLogEntry, EventSnapshot, GameStage, GameState, ResourceType,
};
use crate::systems::event_data::{
    catalog_capacity as total_text_capacity, stage_subjects, tech_topics, template_capacity,
    trait_voice_pack_en, trait_voice_pack_zh, EventEffect, ScenarioSeed, TriggerFamily, BASE_DESKS,
    REPORT_VARIANT_COUNT, TECH_DESKS, TEMPLATE_EXPANSION_FACTOR,
};
use crate::systems::technology::TechnologyTree;
use rand::prelude::IndexedRandom;
use rand::rng;
use serde::Serialize;

pub fn catalog_capacity() -> usize {
    total_text_capacity()
}

pub fn template_capacity_total() -> usize {
    template_capacity()
}

fn variant_slot(variant: usize, stride: usize, len: usize) -> usize {
    if len == 0 {
        return 0;
    }
    (variant / stride) % len
}

struct EventContext {
    stage: GameStage,
    food: f64,
    corpses: f64,
    maggots: f64,
    total_workers: usize,
    hungry_workers: usize,
    building_count: usize,
    tech_count: usize,
    human_pressure: f64,
    maggot_influence: f64,
    symbiosis_stability: f64,
    hybrid_population: f64,
    collective_consciousness: f64,
    total_clicks: u32,
}

#[derive(Serialize, Clone)]
pub struct EventLogSummaryView {
    pub event_id: u32,
    pub timestamp: f64,
    pub scenario_id: String,
    pub category: String,
    pub impact: String,
    pub worker_name: Option<String>,
    pub worker_trait: Option<String>,
    pub is_breaking: bool,
}

#[derive(Serialize, Clone)]
pub struct RenderedEventLogEntry {
    pub event_id: u32,
    pub timestamp: f64,
    pub scenario_id: String,
    pub category: String,
    pub impact: String,
    pub headline_zh: String,
    pub headline_en: String,
    pub body_zh: String,
    pub body_en: String,
    pub worker_name: Option<String>,
    pub worker_trait: Option<String>,
    pub opinion_zh: Option<String>,
    pub opinion_en: Option<String>,
    pub is_breaking: bool,
}

fn event_cooldown_ms(stage: GameStage) -> f64 {
    match stage {
        GameStage::Genesis => 48_000.0,
        GameStage::Workers => 42_000.0,
        GameStage::Maggot => 36_000.0,
        GameStage::Hybrid => 36_000.0,
        GameStage::Collective => 34_000.0,
    }
}

fn build_context(
    state: &GameState,
    workers: &[Worker],
    buildings: &[Building],
    tech_tree: &TechnologyTree,
) -> EventContext {
    EventContext {
        stage: state.current_stage,
        food: state.get_resource(ResourceType::Food),
        corpses: state.get_resource(ResourceType::Corpse),
        maggots: state.get_resource(ResourceType::Maggot),
        total_workers: workers.len(),
        hungry_workers: workers.iter().filter(|worker| worker.is_hungry).count(),
        building_count: buildings
            .iter()
            .map(|building| building.count as usize)
            .sum(),
        tech_count: tech_tree
            .technologies
            .values()
            .filter(|technology| technology.purchased)
            .count(),
        human_pressure: state.coexistence.human_pressure,
        maggot_influence: state.coexistence.maggot_influence,
        symbiosis_stability: state.coexistence.symbiosis_stability,
        hybrid_population: state.coexistence.hybrid_population,
        collective_consciousness: state.coexistence.collective_consciousness,
        total_clicks: state.total_clicks,
    }
}

fn build_catalog_for_stage(stage: GameStage) -> Vec<ScenarioSeed> {
    let mut catalog = Vec::with_capacity(360);

    for subject in stage_subjects(stage) {
        for revision in 0..TEMPLATE_EXPANSION_FACTOR {
            for (index, (desk_zh, desk_en)) in BASE_DESKS.iter().enumerate() {
                catalog.push(ScenarioSeed {
                    id: format!("{}_{}_{}_r{}", stage.id(), subject.code, index, revision),
                    category: subject.category,
                    impact: subject.impact,
                    stage,
                    required_technology: None,
                    trigger: subject.trigger,
                    focus_zh: subject.focus_zh,
                    focus_en: subject.focus_en,
                    desk_zh,
                    desk_en,
                    angle_zh: subject.angle_zh,
                    angle_en: subject.angle_en,
                    result_zh: subject.result_zh,
                    result_en: subject.result_en,
                    effect: subject.effect,
                    breaking: subject.breaking || (index == 0 && revision == 0),
                });
            }
        }
    }

    for topic in tech_topics(stage) {
        for revision in 0..TEMPLATE_EXPANSION_FACTOR {
            for (index, (desk_zh, desk_en)) in TECH_DESKS.iter().enumerate() {
                catalog.push(ScenarioSeed {
                    id: format!("{}_{}_tech{}_r{}", stage.id(), topic.code, index, revision),
                    category: topic.category,
                    impact: EventImpact::Flavor,
                    stage,
                    required_technology: Some(topic.technology),
                    trigger: TriggerFamily::Baseline,
                    focus_zh: topic.focus_zh,
                    focus_en: topic.focus_en,
                    desk_zh,
                    desk_en,
                    angle_zh: topic.angle_zh,
                    angle_en: topic.angle_en,
                    result_zh: topic.result_zh,
                    result_en: topic.result_en,
                    effect: EventEffect::None,
                    breaking: topic.breaking || (index == 0 && revision == 0),
                });
            }
        }
    }

    catalog
}

fn trigger_matches(seed: &ScenarioSeed, ctx: &EventContext) -> bool {
    if seed.stage != ctx.stage {
        return false;
    }

    match seed.trigger {
        TriggerFamily::Baseline => ctx.building_count > 0 || ctx.total_clicks >= 10,
        TriggerFamily::FoodStress => {
            (ctx.total_workers > 0 && ctx.food < ctx.total_workers as f64 + 1.0)
                || ctx.hungry_workers > 0
        }
        TriggerFamily::FoodGlutStall => {
            ctx.food >= ctx.total_workers.max(1) as f64 + 12.0 && ctx.corpses < 2.0
        }
        TriggerFamily::DarkSignal => {
            ctx.corpses >= 1.0 || ctx.maggots >= 1.0 || ctx.maggot_influence >= 5.0
        }
        TriggerFamily::HybridFlux => {
            ctx.hybrid_population > 0.0
                || ctx.symbiosis_stability < 60.0
                || ctx.human_pressure > 10.0
        }
        TriggerFamily::CollectiveSignal => {
            ctx.collective_consciousness > 0.0 || ctx.maggot_influence > 20.0
        }
    }
}

fn stage_name_en(stage: GameStage) -> &'static str {
    match stage {
        GameStage::Genesis => "Genesis Stage",
        GameStage::Workers => "Worker Stage",
        GameStage::Maggot => "Maggot Stage",
        GameStage::Hybrid => "Hybrid Stage",
        GameStage::Collective => "Collective Stage",
    }
}

fn summary_metric_zh(category: EventCategory, ctx: &EventContext) -> String {
    match category {
        EventCategory::SurvivalCrisis => format!(
            "当前食物 {:.0}，饥饿工人 {} 名。",
            ctx.food.max(0.0),
            ctx.hungry_workers
        ),
        EventCategory::DarkConversion => format!(
            "尸体 {:.0}，异常幼体 {:.0}，蛆虫影响 {:.1}。",
            ctx.corpses.max(0.0),
            ctx.maggots.max(0.0),
            ctx.maggot_influence
        ),
        EventCategory::IndustrialProgress => format!(
            "建筑总量 {}，已购科技 {} 项。",
            ctx.building_count, ctx.tech_count
        ),
        EventCategory::SocialMutation => format!(
            "混合人口 {:.1}，共生稳定度 {:.1}。",
            ctx.hybrid_population, ctx.symbiosis_stability
        ),
        EventCategory::EndgameSign => format!(
            "集体意识 {:.1}，总点击 {}。",
            ctx.collective_consciousness, ctx.total_clicks
        ),
    }
}

fn summary_metric_en(category: EventCategory, ctx: &EventContext) -> String {
    match category {
        EventCategory::SurvivalCrisis => format!(
            "Food stands at {:.0} with {} hungry workers flagged.",
            ctx.food.max(0.0),
            ctx.hungry_workers
        ),
        EventCategory::DarkConversion => format!(
            "Bodies are at {:.0}, larval activity at {:.0}, and maggot influence at {:.1}.",
            ctx.corpses.max(0.0),
            ctx.maggots.max(0.0),
            ctx.maggot_influence
        ),
        EventCategory::IndustrialProgress => format!(
            "The settlement fields {} buildings and {} purchased technologies.",
            ctx.building_count, ctx.tech_count
        ),
        EventCategory::SocialMutation => format!(
            "Hybrid population sits at {:.1}, with symbiosis stability at {:.1}.",
            ctx.hybrid_population, ctx.symbiosis_stability
        ),
        EventCategory::EndgameSign => format!(
            "Collective consciousness stands at {:.1}, with {} total clicks already recorded.",
            ctx.collective_consciousness, ctx.total_clicks
        ),
    }
}

fn compose_headline_zh(seed: &ScenarioSeed, variant: usize) -> String {
    match variant_slot(variant, 1, 12) {
        0 => format!("【{}】{}进入监测名单", seed.desk_zh, seed.focus_zh),
        1 => format!(
            "{}：{}，{}再度升温",
            seed.desk_zh,
            seed.focus_zh,
            seed.stage.name()
        ),
        2 => format!("{}特别报道：{}背后的阶段信号", seed.desk_zh, seed.focus_zh),
        3 => format!("《{}》持续追踪：{}", seed.desk_zh, seed.focus_zh),
        4 => format!("{}丨{}成为聚落焦点", seed.desk_zh, seed.focus_zh),
        5 => format!(
            "{}头条：{}牵动{}调度",
            seed.desk_zh,
            seed.focus_zh,
            seed.stage.name()
        ),
        6 => format!("{}快评：{}已不再只是局部异常", seed.desk_zh, seed.focus_zh),
        7 => format!(
            "{}观察：{}正在改写当前生产秩序",
            seed.desk_zh, seed.focus_zh
        ),
        8 => format!("{}夜报：{}的余波仍在扩散", seed.desk_zh, seed.focus_zh),
        9 => format!(
            "{}专栏：{}暴露{}新的薄弱段",
            seed.desk_zh,
            seed.focus_zh,
            seed.stage.name()
        ),
        10 => format!(
            "{}追踪：{}让聚落再次回看主线压力",
            seed.desk_zh, seed.focus_zh
        ),
        _ => format!(
            "{}专题丨{}把{}推向新节点",
            seed.desk_zh,
            seed.focus_zh,
            seed.stage.name()
        ),
    }
}

fn compose_headline_en(seed: &ScenarioSeed, variant: usize) -> String {
    match variant_slot(variant, 1, 12) {
        0 => format!("{}: {} enters active watch", seed.desk_en, seed.focus_en),
        1 => format!(
            "{} | {} grows hotter inside the {}",
            seed.desk_en,
            seed.focus_en,
            stage_name_en(seed.stage)
        ),
        2 => format!(
            "{} Special Report: {} as a stage signal",
            seed.desk_en, seed.focus_en
        ),
        3 => format!("{} continues coverage of {}", seed.desk_en, seed.focus_en),
        4 => format!(
            "{}: {} becomes the settlement focus",
            seed.desk_en, seed.focus_en
        ),
        5 => format!(
            "{} Headline: {} shakes {} dispatch",
            seed.desk_en,
            seed.focus_en,
            stage_name_en(seed.stage)
        ),
        6 => format!(
            "{} Analysis: {} is no longer a local anomaly",
            seed.desk_en, seed.focus_en
        ),
        7 => format!(
            "{} Watch: {} is rewriting production order",
            seed.desk_en, seed.focus_en
        ),
        8 => format!(
            "{} Night Desk: aftershocks of {} keep spreading",
            seed.desk_en, seed.focus_en
        ),
        9 => format!(
            "{} Column: {} exposes a fresh weak segment in the {}",
            seed.desk_en,
            seed.focus_en,
            stage_name_en(seed.stage)
        ),
        10 => format!(
            "{} Tracking: {} forces the settlement to revisit its pressure ladder",
            seed.desk_en, seed.focus_en
        ),
        _ => format!(
            "{} Feature | {} pushes the {} toward a new threshold",
            seed.desk_en,
            seed.focus_en,
            stage_name_en(seed.stage)
        ),
    }
}

fn witness_line_zh(worker_name: Option<&str>, variant: usize) -> String {
    if let Some(name) = worker_name {
        match variant_slot(variant, 12, 12) {
            0 => format!(
                "受访工人 {} 表示，班组已经能明显感到这不是一次孤立波动。",
                name
            ),
            1 => format!(
                "{} 在采访中称，班组对这类变化早有预感，只是没有人愿意先把话说满。",
                name
            ),
            2 => format!(
                "一线工人 {} 说，真正让人不安的不是事件本身，而是它出现得越来越频繁。",
                name
            ),
            3 => format!(
                "{} 对记者说，工位上的细节往往比正式通报更早透露问题方向。",
                name
            ),
            4 => format!(
                "{} 认为，眼前的变化说明聚落已经跨过某条肉眼看不见的阈值。",
                name
            ),
            5 => format!(
                "被采访的 {} 直言，班组现在最怕的不是事故，而是把异常当成日常。",
                name
            ),
            6 => format!(
                "{} 告诉本报记者，最先察觉变化的人往往不是管理层，而是一直盯着工位的值班工人。",
                name
            ),
            7 => format!(
                "{} 说，大家真正担心的是同类信号会不会在下一轮排班里继续放大。",
                name
            ),
            8 => format!(
                "在镜头前，{} 强调这类现象已经不是单次坏运气可以解释的。",
                name
            ),
            9 => format!(
                "{} 受访时表示，班组现在更相信现场读数，而不是任何过于平静的口径。",
                name
            ),
            10 => format!(
                "{} 对采访者说，最可怕的不是出事，而是所有人开始习惯出事。",
                name
            ),
            _ => format!(
                "{} 说，班组私下里早就把这视为阶段变化的前兆，只是今天终于被写进了新闻。",
                name
            ),
        }
    } else {
        match variant_slot(variant, 12, 8) {
            0 => "值班人员表示，眼前的变化已经超出了偶发噪音的范围。".to_string(),
            1 => "现场记录显示，异常并非单点出现，而是在多个环节同时抬头。".to_string(),
            2 => "轮值观察员称，这类迹象一旦成形，通常不会自己安静退场。".to_string(),
            3 => "内部值班表明，多个班次都在报告相近现象，只是强度不同。".to_string(),
            4 => "监测岗位认为，聚落正在把某种过去被忽视的后果正式推回台面。".to_string(),
            5 => "一份未署名的班组记录写道，最先变化的从来不是口径，而是气味、速度和沉默。"
                .to_string(),
            6 => "多名观察员交叉比对后认为，这类波动已经具有明显的系统性而非偶发性。".to_string(),
            _ => "夜间值守记录提到，多个岗位在没有互相沟通的前提下给出了几乎一致的异常描述。"
                .to_string(),
        }
    }
}

fn witness_line_en(worker_name: Option<&str>, variant: usize) -> String {
    if let Some(name) = worker_name {
        match variant_slot(variant, 12, 12) {
            0 => format!("Interviewed worker {} said the floor can already feel that this is not an isolated fluctuation.", name),
            1 => format!("{} told reporters that crews had expected a change like this long before anyone chose to say it aloud.", name),
            2 => format!("Front-line worker {} said the real unease comes less from the event itself than from how often it now appears.", name),
            3 => format!("{} said details on the station usually reveal the direction of trouble before the bulletin does.", name),
            4 => format!("{} argued that the settlement has crossed a threshold that was invisible right up until it stopped being theoretical.", name),
            5 => format!("The interviewed worker, {}, said the crew now fears normalization of anomalies more than the accident headline itself.", name),
            6 => format!("{} said the first people to notice a shift are rarely managers and almost always the workers watching the stations directly.", name),
            7 => format!("{} told the press that crews are now asking whether the same signal will amplify again in the next scheduling cycle.", name),
            8 => format!("On camera, {} stressed that what happened can no longer be dismissed as ordinary bad luck.", name),
            9 => format!("{} said the floor now trusts field readings more than any line that sounds too calm.", name),
            10 => format!("{} told interviewers that the most dangerous part is not the incident itself but the possibility of everyone getting used to it.", name),
            _ => format!("{} said crews had privately treated this as a stage-change omen for some time, and today was simply the first time it made the newswire.", name),
        }
    } else {
        match variant_slot(variant, 12, 8) {
            0 => "Shift staff said the latest change clearly exceeds ordinary background noise.".to_string(),
            1 => "Field notes suggest the anomaly is not isolated to one corner of the settlement but rising across multiple links at once.".to_string(),
            2 => "Duty observers warned that once a signal like this forms, it rarely exits quietly on its own.".to_string(),
            3 => "Internal shifts are reporting the same pattern across multiple windows, differing mostly in intensity.".to_string(),
            4 => "Monitoring posts argue that the settlement is dragging a once-ignored consequence back into official view.".to_string(),
            5 => "An unsigned crew memo noted that smell, silence, and pacing usually shift before official language does.".to_string(),
            6 => "Cross-checking by several observers suggests the disturbance now looks systemic rather than incidental.".to_string(),
            _ => "Night-watch notes report that multiple stations described nearly identical anomalies without coordinating with one another first.".to_string(),
        }
    }
}

fn closing_line_zh(stage: GameStage, variant: usize) -> String {
    match variant_slot(variant, 96, 12) {
        0 => format!("当前阶段仍为 {}。", stage.name()),
        1 => format!("这一信号说明 {} 的内部节拍正在继续收紧。", stage.name()),
        2 => format!(
            "管理层尚未宣布额外措施，但 {} 显然已经进入更敏感区间。",
            stage.name()
        ),
        3 => format!(
            "从现有读数看，这不会是 {} 的最后一次同类新闻。",
            stage.name()
        ),
        4 => format!("如果趋势延续，{} 的主线压力将被重新排序。", stage.name()),
        5 => format!(
            "报道认为，这种变化正在把 {} 推向更深一层的系统逻辑。",
            stage.name()
        ),
        6 => format!(
            "至少在眼下，{} 已经无法再把这类信号当作边角现象。",
            stage.name()
        ),
        7 => format!(
            "多名观察者判断，{} 接下来会更频繁地面对类似后果。",
            stage.name()
        ),
        8 => format!(
            "新闻流由此推断，{} 的稳定外观正在被连续性事件逐步掏空。",
            stage.name()
        ),
        9 => format!(
            "如果没有新的缓冲措施，{} 的资源与社会链条都将承受更高压强。",
            stage.name()
        ),
        10 => format!(
            "这篇报道把它视作 {} 走向下一层复杂度之前的又一次预演。",
            stage.name()
        ),
        _ => format!(
            "无论管理方如何定性，{} 都已很难回到此前那种单线叙事。",
            stage.name()
        ),
    }
}

fn closing_line_en(stage: GameStage, variant: usize) -> String {
    match variant_slot(variant, 96, 12) {
        0 => format!("The current stage remains the {}.", stage_name_en(stage)),
        1 => format!("The signal suggests the internal rhythm of the {} is tightening further.", stage_name_en(stage)),
        2 => format!("Management has announced no new intervention yet, but the {} has clearly entered a more sensitive interval.", stage_name_en(stage)),
        3 => format!("On present readings, this is unlikely to be the last report of its kind in the {}.", stage_name_en(stage)),
        4 => format!("If the trend continues, the main pressure ladder inside the {} will have to be reordered.", stage_name_en(stage)),
        5 => format!("The report concludes that this shift is pushing the {} toward a deeper system logic.", stage_name_en(stage)),
        6 => format!("For now at least, the {} can no longer treat this signal as a side-channel phenomenon.", stage_name_en(stage)),
        7 => format!("Several observers now expect the {} to confront this class of consequence more frequently.", stage_name_en(stage)),
        8 => format!("The newswire reads this as another sign that the stable surface of the {} is being hollowed out by repeated events.", stage_name_en(stage)),
        9 => format!("Without a new buffer response, both the resource and social chains inside the {} are likely to take higher pressure.", stage_name_en(stage)),
        10 => format!("This article frames the event as another rehearsal before the {} steps into a more complex layer.", stage_name_en(stage)),
        _ => format!("Whatever management chooses to call it, the {} is unlikely to return to a single-track narrative now.", stage_name_en(stage)),
    }
}

fn field_line_zh(category: EventCategory, variant: usize) -> &'static str {
    match category {
        EventCategory::SurvivalCrisis => match variant_slot(variant, 24, 6) {
            0 => "现场排队长度和等待情绪都在同步上升，补给窗口周围的交谈明显比昨天更尖锐。",
            1 => "多个班组在交接时重复提到同一问题，说明压力已经越过局部岗位。",
            2 => "从食堂到宿舍，关于短缺与失序的讨论正在形成连续背景噪声。",
            3 => "值守人员反映，最先变化的并不是库存数字，而是所有人说话的语速。",
            4 => "几处看似独立的小问题正在互相传导，把生存压力放大成系统压力。",
            _ => "一线反馈显示，原本可被忍受的波动已经开始改变班组的基本判断。",
        },
        EventCategory::DarkConversion => match variant_slot(variant, 24, 6) {
            0 => "处理区边缘的气味、热度和沉积物都在提醒人们，这条链已经不再是隐蔽的附属流程。",
            1 => "现场观察员指出，黑暗链条的存在感正在从事故时刻扩展为全天候背景。",
            2 => "围绕腐化样本的搬运、分类和封存动作，已经越来越像常规工业程序。",
            3 => "多个处理节点都给出了相近的异动读数，说明异常正在获得稳定轮廓。",
            4 => "黑暗副产物不再只意味着污损，它开始拥有可记录、可计量的流向。",
            _ => "处理线周边的秩序感并未消失，只是被改写成了更冷静、更危险的形式。",
        },
        EventCategory::IndustrialProgress => match variant_slot(variant, 24, 6) {
            0 => "工位之间的物料流动明显变快，过去需要口头确认的步骤开始拥有固定顺序。",
            1 => "从墙上的调度表到地面的运输线，新的产能结构已经可以被直接看见。",
            2 => "若把多个作业点放在一起观察，就会发现聚落正在逐步长出真正的工业节拍。",
            3 => "这类进展最直观的信号不是口号，而是等待时间和返工次数都在下降。",
            4 => "生产面正在失去临时拼凑感，取而代之的是越来越稳定的流程骨架。",
            _ => "多条原本松散的资源线开始合并成可预测的扩张通道。",
        },
        EventCategory::SocialMutation => match variant_slot(variant, 24, 6) {
            0 => "公告栏、宿舍区和工作站之间的语言正在发生同步变化，社会秩序本身成了新闻对象。",
            1 => "身份、分工和共识的边界不断被重新描画，说明制度已开始追赶现实。",
            2 => "这类变化很少以巨响出现，更多时候它通过新规则和新眼神慢慢扩散。",
            3 => "原本只存在于私下讨论里的紧张感，已经被正式写入公共叙事。",
            4 => "从谁能发言到谁能决定，社会结构正在经历比产能更慢但更深的改写。",
            _ => "共生社会的真正变化并不只发生在身体层面，也发生在制度和称呼层面。",
        },
        EventCategory::EndgameSign => match variant_slot(variant, 24, 6) {
            0 => "高阶系统发出的信号不再像局部突破，更像整套文明基础设施在重新校准。",
            1 => "从尖塔到轨道链路，终局系统给出的读数已经超出传统行政语言的解释范围。",
            2 => "现场变化显示，终局阶段并非突然降临，而是在多个接口上同时显形。",
            3 => "这类现象的可怕之处不在规模，而在它会迅速成为新的默认条件。",
            4 => "当意识、能源与远征被写进同一套通道时，旧时代的边界几乎同时失效。",
            _ => "报道所见并不是某一台设备的跃迁，而是整张文明地图的坐标漂移。",
        },
    }
}

fn management_line_zh(category: EventCategory, variant: usize) -> &'static str {
    match category {
        EventCategory::SurvivalCrisis => match variant_slot(variant, 48, 6) {
            0 => "管理方在回应中强调供应仍处于可调度范围内，但未公布更细化的缓冲方案。",
            1 => "后勤口径称相关波动属于阶段性压力，不过多个班组并不完全认同这种说法。",
            2 => "内部说明继续使用“局部可控”措辞，但现场感受显然比这组词更紧绷。",
            3 => "值班主管表示会优先保证基础供养，但没有承诺压力会在短期内消失。",
            4 => "调度部门称正在重新计算分配顺序，暗示现有资源方案已经接近极限。",
            _ => "公开通报维持平稳口吻，然而字里行间已经透露出明显的收缩信号。",
        },
        EventCategory::DarkConversion => match variant_slot(variant, 48, 6) {
            0 => "处理部门坚持一切都在程序内运行，但承认异动样本的读数正在持续累积。",
            1 => "管理方把现象定义为“受控副反应”，这一说法并未打消一线人员的不安。",
            2 => "官方口径强调回收收益高于风险，可更多班组开始要求更透明的说明。",
            3 => "相关部门称会继续监测腐化带外溢，不过并未否认链条正在扩大。",
            4 => "制度层面已经把暗链后果纳入可运营范围，只是公众仍未完全接受这种速度。",
            _ => "管理者表示黑暗链条仍在掌控内，但也承认掌控本身正在变成更复杂的工作。",
        },
        EventCategory::IndustrialProgress => match variant_slot(variant, 48, 6) {
            0 => "调度中心将此视为产线成熟的信号，并准备把相关经验复制到更多节点。",
            1 => "管理层称新流程的价值在于可复制，而不是只把效率抬高几个百分点。",
            2 => "公开说明把这次变化描述为“结构性改进”，意味着后续还会有更多配套调整。",
            3 => "运营报告强调，真正重要的并不是单次峰值，而是稳态输出被拉高。",
            4 => "产能部门已把相关成果写入下一轮排产，说明这不是一次性展示项目。",
            _ => "管理口径把它定义为基础设施升级，而非孤立成就，这比数字本身更关键。",
        },
        EventCategory::SocialMutation => match variant_slot(variant, 48, 6) {
            0 => "公告口径试图保持中性，但所有人都知道这类变化会重写聚落内部的权力分布。",
            1 => "管理方强调制度仍具连续性，可连续性本身已在新的身份结构下被重新解释。",
            2 => "公开回应避免使用过强措辞，却默认社会关系正在进入新的协调机制。",
            3 => "负责解释政策的人一再强调秩序优先，这本身就说明旧秩序已不足够稳定。",
            4 => "新的表述体系正在被快速推广，仿佛语言本身也必须追赶现实。",
            _ => "制度回应看似克制，实际已承认社会边界正在被重新协商。",
        },
        EventCategory::EndgameSign => match variant_slot(variant, 48, 6) {
            0 => "高层通报将其视为终局系统正常展开的一部分，但并未否认外部性仍在扩大。",
            1 => "相关简报强调跃迁带来的总体收益，却承认旧监管框架已无法完整覆盖。",
            2 => "管理层在表述上明显更谨慎，因为任何单一解释都不足以描述眼前变化。",
            3 => "官方仍希望把这定义为升级而非断裂，但现场读数给出的感受更接近后者。",
            4 => "负责远征与算力的双线部门首次发出联合口径，说明终局系统已在结构上汇流。",
            _ => "集体系统的回应仍保持冷静，可这种冷静本身已属于新文明条件的一部分。",
        },
    }
}

fn field_line_en(category: EventCategory, variant: usize) -> &'static str {
    match category {
        EventCategory::SurvivalCrisis => match variant_slot(variant, 24, 6) {
            0 => "Queue lengths and waiting-room mood are climbing together, and talk around the supply window is sharper than yesterday.",
            1 => "Multiple crews are repeating the same concern at handoff, suggesting pressure has moved beyond a local station.",
            2 => "From the canteen to the dorm rows, shortages and disorder are becoming a continuous background conversation.",
            3 => "Watch staff report that the first thing to change was not the stock number but the pace of everybody's voice.",
            4 => "Several problems that looked independent are now transmitting into one another and enlarging basic survival pressure into system pressure.",
            _ => "Front-line feedback suggests a fluctuation that once felt tolerable is now changing crew judgment at a basic level.",
        },
        EventCategory::DarkConversion => match variant_slot(variant, 24, 6) {
            0 => "Smell, heat, and residue around the treatment edge are all reminding crews that this chain is no longer a hidden side process.",
            1 => "Field observers note that the presence of the dark chain is spreading from accident moments into an all-day background condition.",
            2 => "Transport, sorting, and sealing of corrupted samples are increasingly resembling ordinary industrial procedure.",
            3 => "Several treatment nodes are returning similar disturbance readings, which gives the anomaly a stable outline.",
            4 => "Dark byproducts no longer signify contamination alone; they now have measurable flow and accounting value.",
            _ => "Order around the treatment line has not vanished, but it has been rewritten into a calmer and more dangerous form.",
        },
        EventCategory::IndustrialProgress => match variant_slot(variant, 24, 6) {
            0 => "Material movement between stations is visibly faster, and steps that once required verbal confirmation now have fixed sequence.",
            1 => "From wall dispatch charts to lanes on the ground, the new output structure can now be seen directly.",
            2 => "Viewed together, multiple work points suggest the settlement is gradually growing a genuine industrial rhythm.",
            3 => "The clearest sign of progress is not rhetoric but the fact that waiting time and rework are both falling.",
            4 => "The production face of the settlement is losing its improvised feel and gaining a more stable process skeleton.",
            _ => "Several resource lines that once drifted separately are beginning to merge into a predictable expansion corridor.",
        },
        EventCategory::SocialMutation => match variant_slot(variant, 24, 6) {
            0 => "Language across notice boards, dormitory blocks, and workstations is shifting together, turning social order itself into a news object.",
            1 => "The boundaries of identity, division of labor, and consent are being redrawn again and again, which suggests institutions are chasing reality.",
            2 => "Changes like this rarely arrive with a bang; more often they spread through new rules and unfamiliar looks.",
            3 => "Tension once confined to private conversation is now being written into public narrative.",
            4 => "From who may speak to who may decide, social structure is undergoing a slower but deeper rewrite than production alone.",
            _ => "The true change inside symbiotic society is not only physical; it also unfolds in institutions and naming.",
        },
        EventCategory::EndgameSign => match variant_slot(variant, 24, 6) {
            0 => "Signals from the higher-order system read less like local breakthroughs and more like a civilizational infrastructure recalibrating itself.",
            1 => "From spires to orbital lanes, the current readings extend beyond the explanatory range of older administrative language.",
            2 => "Field changes suggest the endgame does not arrive all at once but appears simultaneously across multiple interfaces.",
            3 => "What makes this class of event dangerous is not scale alone, but how quickly it can become the new default condition.",
            4 => "Once consciousness, energy, and expedition share the same channel, boundaries inherited from the old order fail almost together.",
            _ => "What reporters are seeing is not a single machine leaping forward, but the coordinates of the whole settlement map starting to drift.",
        },
    }
}

fn management_line_en(category: EventCategory, variant: usize) -> &'static str {
    match category {
        EventCategory::SurvivalCrisis => match variant_slot(variant, 48, 6) {
            0 => "Management insists supply remains within dispatchable range, though no more detailed buffer plan has been published.",
            1 => "The logistics line calls the fluctuation temporary, but several crews clearly do not share that confidence.",
            2 => "Internal language continues to use the phrase 'locally manageable,' even as the floor feels tighter than the wording suggests.",
            3 => "Duty supervisors say basic sustenance will be prioritized, but they have not promised the pressure will disappear quickly.",
            4 => "Dispatch offices say allocation order is being recalculated, implying the existing plan is near its ceiling.",
            _ => "The public note keeps a calm tone, yet it carries unmistakable signs of contraction between the lines.",
        },
        EventCategory::DarkConversion => match variant_slot(variant, 48, 6) {
            0 => "Treatment authorities maintain that everything remains inside procedure, while admitting anomalous sample readings are continuing to accumulate.",
            1 => "Management describes the phenomenon as a 'contained side reaction,' language that has done little to calm front-line personnel.",
            2 => "The official line stresses that recovery yield still exceeds risk, even as more crews demand clearer explanation.",
            3 => "Responsible offices say they will continue monitoring dark-chain spillover but do not deny that the chain is expanding.",
            4 => "At the institutional level, dark-chain consequences are already being treated as operable conditions, even if the public has not fully accepted the pace.",
            _ => "Administrators say the dark chain remains under control, while also admitting control itself is becoming more complex labor.",
        },
        EventCategory::IndustrialProgress => match variant_slot(variant, 48, 6) {
            0 => "Dispatch centers are treating the shift as a sign of line maturity and preparing to copy the method elsewhere.",
            1 => "Management says the real value of the new process lies in repeatability rather than a one-off efficiency spike.",
            2 => "Public notes describe the change as a structural improvement, implying a broader set of adjustments will follow.",
            3 => "Operations reports stress that the important achievement is not peak output but a higher steady state.",
            4 => "Capacity planners have already written the result into the next scheduling round, which suggests it is not a demonstration project.",
            _ => "The official line defines the event as infrastructure maturation rather than isolated success, and that distinction matters more than the raw number.",
        },
        EventCategory::SocialMutation => match variant_slot(variant, 48, 6) {
            0 => "Public language tries to remain neutral, but everyone understands that changes like this redistribute power inside the settlement.",
            1 => "Management emphasizes institutional continuity, even as continuity itself is being reinterpreted under a new identity structure.",
            2 => "Official responses avoid dramatic wording while quietly accepting that social coordination is entering a different mechanism.",
            3 => "The people tasked with explaining policy keep repeating 'order first,' which is itself evidence that the old order is no longer sufficient.",
            4 => "A new vocabulary is being circulated rapidly, as though language itself must catch up with reality.",
            _ => "The response sounds restrained, but it effectively concedes that social boundaries are being renegotiated in public.",
        },
        EventCategory::EndgameSign => match variant_slot(variant, 48, 6) {
            0 => "Upper-level briefings frame the development as part of normal endgame unfolding, without denying that the externalities are widening.",
            1 => "Relevant memos stress the aggregate gains of transition while admitting older oversight frames no longer cover the full system.",
            2 => "Management language is notably more careful here, because no single explanation can comfortably contain what is happening.",
            3 => "Officials still prefer to call this an upgrade rather than a rupture, but the field readings feel closer to the latter.",
            4 => "The expedition and compute directorates have issued a joint line for the first time, showing structural convergence inside the endgame system.",
            _ => "The collective system responds in a calm voice, yet that calmness itself belongs to a new civilizational condition.",
        },
    }
}

fn compose_body_zh(
    seed: &ScenarioSeed,
    ctx: &EventContext,
    worker_name: Option<&str>,
    variant: usize,
) -> String {
    let opener = match variant_slot(variant, 144, 12) {
        0 => "【本台讯】",
        1 => "【深度报道】",
        2 => "【现场连线】",
        3 => "【晚间公报】",
        4 => "【观察稿】",
        5 => "【聚落晨报】",
        6 => "【工务追踪】",
        7 => "【管理口径】",
        8 => "【街区耳语】",
        _ => "【值班记录】",
    };
    let field = field_line_zh(seed.category, variant);
    let management = management_line_zh(seed.category, variant);
    let witness = witness_line_zh(worker_name, variant);
    let closer = closing_line_zh(seed.stage, variant);
    format!(
        "{}{}。{} {} {} {} {} {}",
        opener,
        seed.angle_zh,
        field,
        summary_metric_zh(seed.category, ctx),
        management,
        witness,
        seed.result_zh,
        closer
    )
}

fn compose_body_en(
    seed: &ScenarioSeed,
    ctx: &EventContext,
    worker_name: Option<&str>,
    variant: usize,
) -> String {
    let opener = match variant_slot(variant, 144, 12) {
        0 => "Breaking Desk:",
        1 => "Feature Report:",
        2 => "Field Dispatch:",
        3 => "Evening Bulletin:",
        4 => "Observation Note:",
        5 => "Morning Ledger:",
        6 => "Operations Follow-Up:",
        7 => "Management Line:",
        8 => "District Whisper:",
        _ => "Shift Record:",
    };
    let field = field_line_en(seed.category, variant);
    let management = management_line_en(seed.category, variant);
    let witness = witness_line_en(worker_name, variant);
    let closer = closing_line_en(seed.stage, variant);
    format!(
        "{} {} {} {} {} {} {} {}",
        opener,
        seed.angle_en,
        field,
        summary_metric_en(seed.category, ctx),
        management,
        witness,
        seed.result_en,
        closer
    )
}

fn compose_worker_opinion_zh(worker: &Worker, scenario_id: &str) -> String {
    let (a, b, c) = trait_voice_pack_zh(worker.primary_trait);
    let idx = worker.name.len() + scenario_id.len();
    format!(
        "{}说：“{}，{}。{}”",
        worker.name,
        a[idx % a.len()],
        b[(idx / 2) % b.len()],
        c[(idx / 3) % c.len()]
    )
}

fn compose_worker_opinion_en(worker: &Worker, scenario_id: &str) -> String {
    let (a, b, c) = trait_voice_pack_en(worker.primary_trait);
    let idx = worker.name.len() + scenario_id.len();
    format!(
        "{} said, \"{}, {}. {}\"",
        worker.name,
        a[idx % a.len()],
        b[(idx / 2) % b.len()],
        c[(idx / 3) % c.len()]
    )
}

fn find_scenario(stage: GameStage, scenario_id: &str) -> Option<ScenarioSeed> {
    build_catalog_for_stage(stage)
        .into_iter()
        .find(|seed| seed.id == scenario_id)
}

fn snapshot_from_context(ctx: &EventContext) -> EventSnapshot {
    EventSnapshot {
        food: ctx.food,
        hungry_workers: ctx.hungry_workers,
        corpses: ctx.corpses,
        maggots: ctx.maggots,
        building_count: ctx.building_count,
        tech_count: ctx.tech_count,
        hybrid_population: ctx.hybrid_population,
        symbiosis_stability: ctx.symbiosis_stability,
        collective_consciousness: ctx.collective_consciousness,
        total_clicks: ctx.total_clicks,
        maggot_influence: ctx.maggot_influence,
    }
}

fn context_from_entry(entry: &EventLogEntry) -> EventContext {
    let stage = match entry.stage_id.as_str() {
        "stage_workers" => GameStage::Workers,
        "stage_maggot" => GameStage::Maggot,
        "stage_hybrid" => GameStage::Hybrid,
        "stage_collective" => GameStage::Collective,
        _ => GameStage::Genesis,
    };

    EventContext {
        stage,
        food: entry.snapshot.food,
        corpses: entry.snapshot.corpses,
        maggots: entry.snapshot.maggots,
        total_workers: 0,
        hungry_workers: entry.snapshot.hungry_workers,
        building_count: entry.snapshot.building_count,
        tech_count: entry.snapshot.tech_count,
        human_pressure: 0.0,
        maggot_influence: entry.snapshot.maggot_influence,
        symbiosis_stability: entry.snapshot.symbiosis_stability,
        hybrid_population: entry.snapshot.hybrid_population,
        collective_consciousness: entry.snapshot.collective_consciousness,
        total_clicks: entry.snapshot.total_clicks,
    }
}

pub fn summarize_event_entry(entry: &EventLogEntry) -> EventLogSummaryView {
    EventLogSummaryView {
        event_id: entry.event_id,
        timestamp: entry.timestamp,
        scenario_id: entry.scenario_id.clone(),
        category: entry.category.id().to_string(),
        impact: entry.impact.id().to_string(),
        worker_name: entry.worker_name.clone(),
        worker_trait: entry.worker_trait.clone(),
        is_breaking: entry.is_breaking,
    }
}

pub fn render_event_entry(entry: &EventLogEntry) -> Option<RenderedEventLogEntry> {
    let stage = match entry.stage_id.as_str() {
        "stage_workers" => GameStage::Workers,
        "stage_maggot" => GameStage::Maggot,
        "stage_hybrid" => GameStage::Hybrid,
        "stage_collective" => GameStage::Collective,
        _ => GameStage::Genesis,
    };
    let seed = find_scenario(stage, &entry.scenario_id)?;
    let ctx = context_from_entry(entry);
    let worker_stub = match (&entry.worker_name, &entry.worker_trait) {
        (Some(name), Some(trait_name)) => Some(Worker {
            name: name.clone(),
            skills: String::new(),
            background: String::new(),
            preferences: String::new(),
            assigned_building: None,
            level: 1,
            efficiency_multiplier: 1.0,
            xp: 0.0,
            xp_to_next_level: 100.0,
            gender: crate::entities::Gender::Other,
            hobbies: vec![],
            primary_trait: match trait_name.as_str() {
                "Diligent" => Trait::Diligent,
                "Hardworking" => Trait::Hardworking,
                "Lazy" => Trait::Lazy,
                "Efficient" => Trait::Efficient,
                "Slow" => Trait::Slow,
                "Intelligent" => Trait::Intelligent,
                "FastLearner" => Trait::FastLearner,
                "Genius" => Trait::Genius,
                "SlowLearner" => Trait::SlowLearner,
                "Social" => Trait::Social,
                "Loner" => Trait::Loner,
                "Charismatic" => Trait::Charismatic,
                "Shy" => Trait::Shy,
                "NightOwl" => Trait::NightOwl,
                "EarlyBird" => Trait::EarlyBird,
                "Clumsy" => Trait::Clumsy,
                "Forgetful" => Trait::Forgetful,
                "Careless" => Trait::Careless,
                "Careful" => Trait::Careful,
                "Creative" => Trait::Creative,
                "Persevering" => Trait::Persevering,
                "Optimistic" => Trait::Optimistic,
                _ => Trait::Careful,
            },
            secondary_traits: vec![],
            happiness: 50.0,
            hunger: 0.0,
            focus: 50.0,
            fatigue: 0.0,
            stress: 0.0,
            is_hungry: false,
            missing_limbs: vec![],
            maggot_limbs: vec![],
            starvation_start_time: 0.0,
        }),
        _ => None,
    };

    Some(RenderedEventLogEntry {
        event_id: entry.event_id,
        timestamp: entry.timestamp,
        scenario_id: entry.scenario_id.clone(),
        category: entry.category.id().to_string(),
        impact: entry.impact.id().to_string(),
        headline_zh: compose_headline_zh(&seed, entry.variant_index),
        headline_en: compose_headline_en(&seed, entry.variant_index),
        body_zh: compose_body_zh(
            &seed,
            &ctx,
            entry.worker_name.as_deref(),
            entry.variant_index,
        ),
        body_en: compose_body_en(
            &seed,
            &ctx,
            entry.worker_name.as_deref(),
            entry.variant_index,
        ),
        worker_name: entry.worker_name.clone(),
        worker_trait: entry.worker_trait.clone(),
        opinion_zh: worker_stub
            .as_ref()
            .map(|worker| compose_worker_opinion_zh(worker, &entry.scenario_id)),
        opinion_en: worker_stub
            .as_ref()
            .map(|worker| compose_worker_opinion_en(worker, &entry.scenario_id)),
        is_breaking: entry.is_breaking,
    })
}

fn apply_effect(effect: EventEffect, state: &mut GameState) {
    match effect {
        EventEffect::None => {}
        EventEffect::AddCorpse(amount) => state.add_resource(ResourceType::Corpse, amount),
        EventEffect::AddMaggot(amount) => state.add_resource(ResourceType::Maggot, amount),
        EventEffect::AddCorpseAndMaggot { corpse, maggot } => {
            state.add_resource(ResourceType::Corpse, corpse);
            state.add_resource(ResourceType::Maggot, maggot);
        }
        EventEffect::ReduceFoodAndAddCorpse { food, corpse } => {
            let current_food = state.get_resource(ResourceType::Food);
            state.set_resource(ResourceType::Food, (current_food - food).max(0.0));
            state.add_resource(ResourceType::Corpse, corpse);
        }
    }
}

fn eligible_scenarios(
    state: &GameState,
    tech_tree: &TechnologyTree,
    ctx: &EventContext,
) -> Vec<ScenarioSeed> {
    build_catalog_for_stage(ctx.stage)
        .into_iter()
        .filter(|seed| {
            seed.required_technology
                .map(|technology| tech_tree.is_unlocked(technology))
                .unwrap_or(true)
                && trigger_matches(seed, ctx)
                && seed.stage == state.current_stage
        })
        .collect()
}

fn select_scenario(
    state: &GameState,
    tech_tree: &TechnologyTree,
    ctx: &EventContext,
) -> Option<ScenarioSeed> {
    let candidates = eligible_scenarios(state, tech_tree, ctx);
    if candidates.is_empty() {
        return None;
    }

    let flavor: Vec<ScenarioSeed> = candidates
        .iter()
        .filter(|seed| seed.impact == EventImpact::Flavor)
        .cloned()
        .collect();
    let effective: Vec<ScenarioSeed> = candidates
        .iter()
        .filter(|seed| seed.impact == EventImpact::Effective)
        .cloned()
        .collect();
    let wants_effective = (state.event_journal.total_events_generated + 1) % 5 == 0;
    let pool = if wants_effective && !effective.is_empty() {
        effective
    } else if !flavor.is_empty() {
        flavor
    } else {
        effective
    };
    let mut local_rng = rng();
    pool.choose(&mut local_rng).cloned()
}

pub fn maybe_generate_event(
    state: &mut GameState,
    workers: &[Worker],
    buildings: &[Building],
    tech_tree: &TechnologyTree,
    now: f64,
) -> Option<EventLogEntry> {
    if now - state.event_journal.last_event_time < event_cooldown_ms(state.current_stage) {
        return None;
    }

    let ctx = build_context(state, workers, buildings, tech_tree);
    let seed = select_scenario(state, tech_tree, &ctx)?;
    let variant = (state.event_journal.total_events_generated as usize + seed.id.len())
        % REPORT_VARIANT_COUNT;
    let worker = {
        let mut local_rng = rng();
        workers.choose(&mut local_rng)
    };

    apply_effect(seed.effect, state);

    let entry = EventLogEntry {
        event_id: state.event_journal.total_events_generated + 1,
        timestamp: now,
        scenario_id: seed.id.clone(),
        category: seed.category,
        impact: seed.impact,
        stage_id: seed.stage.id().to_string(),
        variant_index: variant,
        worker_name: worker.map(|value| value.name.clone()),
        worker_trait: worker.map(|value| format!("{:?}", value.primary_trait)),
        is_breaking: seed.breaking || seed.impact == EventImpact::Effective,
        snapshot: snapshot_from_context(&ctx),
    };

    state.event_journal.last_event_time = now;
    state.event_journal.total_events_generated += 1;
    state.event_journal.push_entry(entry.clone());
    Some(entry)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::entities::{Gender, Hobby};

    fn sample_worker() -> Worker {
        Worker {
            name: "James Smith".to_string(),
            skills: "farming".to_string(),
            background: "Dock".to_string(),
            preferences: "农场".to_string(),
            assigned_building: None,
            level: 1,
            efficiency_multiplier: 1.0,
            xp: 0.0,
            xp_to_next_level: 100.0,
            gender: Gender::Male,
            hobbies: vec![Hobby::Fishing],
            primary_trait: Trait::Diligent,
            secondary_traits: vec![],
            happiness: 50.0,
            hunger: 0.0,
            focus: 50.0,
            fatigue: 0.0,
            stress: 0.0,
            is_hungry: false,
            missing_limbs: vec![],
            maggot_limbs: vec![],
            starvation_start_time: 0.0,
        }
    }

    #[test]
    fn event_catalog_capacity_tracks_total_text_variants() {
        assert_eq!(template_capacity_total(), 1800);
        assert_eq!(catalog_capacity(), 1_800_000);
        assert_eq!(build_catalog_for_stage(GameStage::Genesis).len(), 360);
    }

    #[test]
    fn every_fifth_event_prefers_effective_when_available() {
        let mut state = GameState::default();
        state.current_stage = GameStage::Workers;
        state.set_resource(ResourceType::Food, 40.0);
        state.event_journal.total_events_generated = 4;
        let workers = vec![sample_worker()];

        let event = maybe_generate_event(
            &mut state,
            &workers,
            &[],
            &TechnologyTree::default(),
            60_000.0,
        )
        .expect("event should be generated");

        assert_eq!(event.impact, EventImpact::Effective);
        assert!(
            state.get_resource(ResourceType::Corpse) >= 1.0
                || state.get_resource(ResourceType::Maggot) >= 1.0
        );
    }
}
