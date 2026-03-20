use crate::entities::{Building, LimbSlot, Trait, Worker};
use crate::state::{
    EventCategory, EventImpact, EventLogEntry, EventSnapshot, GameStage, GameState, ResourceType,
};
use crate::systems::event_data::{
    catalog_capacity as total_text_capacity, stage_subjects, tech_topics, template_capacity,
    trait_voice_pack_en, trait_voice_pack_zh, EventEffect, ScenarioSeed, TriggerFamily, BASE_DESKS,
    CULTURE_DESKS, REPORT_VARIANT_COUNT, RUMOR_DESKS, TECH_DESKS, TEMPLATE_EXPANSION_FACTOR,
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
        let desks = desks_for_style(detect_news_style(&ScenarioSeed {
            id: String::new(),
            category: subject.category,
            impact: subject.impact,
            stage,
            required_technology: None,
            trigger: subject.trigger,
            focus_zh: subject.focus_zh,
            focus_en: subject.focus_en,
            desk_zh: "",
            desk_en: "",
            angle_zh: subject.angle_zh,
            angle_en: subject.angle_en,
            result_zh: subject.result_zh,
            result_en: subject.result_en,
            effect: subject.effect,
            breaking: subject.breaking,
        }));
        for revision in 0..TEMPLATE_EXPANSION_FACTOR {
            for (index, (desk_zh, desk_en)) in desks.iter().enumerate() {
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

#[derive(Clone, Copy, PartialEq, Eq)]
enum NewsStyle {
    Default,
    Accident,
    Labor,
    Festival,
    Rumor,
}

fn detect_news_style(seed: &ScenarioSeed) -> NewsStyle {
    let focus = seed.focus_zh;
    if focus.contains("事故") || focus.contains("死伤") || focus.contains("坍塌") {
        NewsStyle::Accident
    } else if focus.contains("停工") || focus.contains("罢工") {
        NewsStyle::Labor
    } else if focus.contains("节")
        || focus.contains("市集")
        || focus.contains("巡游")
        || focus.contains("艺术")
    {
        NewsStyle::Festival
    } else if focus.contains("传闻")
        || focus.contains("怪声")
        || focus.contains("外星人")
        || focus.contains("尸体会动")
    {
        NewsStyle::Rumor
    } else {
        NewsStyle::Default
    }
}

fn desks_for_style(style: NewsStyle) -> &'static [(&'static str, &'static str)] {
    match style {
        NewsStyle::Festival => &CULTURE_DESKS,
        NewsStyle::Rumor => &RUMOR_DESKS,
        _ => &BASE_DESKS,
    }
}

fn compose_headline_zh(seed: &ScenarioSeed, variant: usize) -> String {
    match detect_news_style(seed) {
        NewsStyle::Accident => {
            return match variant_slot(variant, 1, 8) {
                0 => format!("{}突发：{}", seed.desk_zh, seed.focus_zh),
                1 => format!(
                    "{}快讯丨{}震动{}",
                    seed.desk_zh,
                    seed.focus_zh,
                    seed.stage.name()
                ),
                2 => format!("{}现场：{}引发聚落震荡", seed.desk_zh, seed.focus_zh),
                3 => format!("{}头条：{}后续仍在扩大", seed.desk_zh, seed.focus_zh),
                4 => format!("{}特别报道：{}暴露高压代价", seed.desk_zh, seed.focus_zh),
                5 => format!("{}丨{}之后，多个岗位停摆", seed.desk_zh, seed.focus_zh),
                6 => format!(
                    "{}追踪：{}撕开{}安全假象",
                    seed.desk_zh,
                    seed.focus_zh,
                    seed.stage.name()
                ),
                _ => format!("{}：{}造成的余震仍在扩散", seed.desk_zh, seed.focus_zh),
            }
        }
        NewsStyle::Labor => {
            return match variant_slot(variant, 1, 8) {
                0 => format!("{}快讯：{}", seed.desk_zh, seed.focus_zh),
                1 => format!("{}丨{}冲上聚落头条", seed.desk_zh, seed.focus_zh),
                2 => format!("{}特别稿：{}背后的加班怒火", seed.desk_zh, seed.focus_zh),
                3 => format!("{}现场：{}让排产骤停", seed.desk_zh, seed.focus_zh),
                4 => format!("{}观察：{}正在改写劳动秩序", seed.desk_zh, seed.focus_zh),
                5 => format!("{}追踪：{}不再只是抱怨", seed.desk_zh, seed.focus_zh),
                6 => format!(
                    "{}头条：{}逼问{}承压极限",
                    seed.desk_zh,
                    seed.focus_zh,
                    seed.stage.name()
                ),
                _ => format!("{}：{}把情绪推向公开对抗", seed.desk_zh, seed.focus_zh),
            }
        }
        NewsStyle::Festival => {
            return match variant_slot(variant, 1, 8) {
                0 => format!("{}文化版：{}", seed.desk_zh, seed.focus_zh),
                1 => format!("{}现场直击：{}意外爆红", seed.desk_zh, seed.focus_zh),
                2 => format!("{}丨{}挤满整片街区", seed.desk_zh, seed.focus_zh),
                3 => format!("{}特写：{}为何突然受欢迎", seed.desk_zh, seed.focus_zh),
                4 => format!("{}夜报：{}成了新的公共娱乐", seed.desk_zh, seed.focus_zh),
                5 => format!(
                    "{}周末刊：{}让聚落短暂忘记焦虑",
                    seed.desk_zh, seed.focus_zh
                ),
                6 => format!("{}热榜：{}收获罕见欢呼", seed.desk_zh, seed.focus_zh),
                _ => format!("{}观察：{}正在改变聚落气氛", seed.desk_zh, seed.focus_zh),
            }
        }
        NewsStyle::Rumor => {
            return match variant_slot(variant, 1, 8) {
                0 => format!("{}传闻录：{}", seed.desk_zh, seed.focus_zh),
                1 => format!("{}夜话：{}搅动整片宿舍区", seed.desk_zh, seed.focus_zh),
                2 => format!("{}怪谈专栏：{}", seed.desk_zh, seed.focus_zh),
                3 => format!("{}追踪：{}究竟是真是假", seed.desk_zh, seed.focus_zh),
                4 => format!("{}丨{}让夜班再难安睡", seed.desk_zh, seed.focus_zh),
                5 => format!("{}特别稿：{}正在疯传", seed.desk_zh, seed.focus_zh),
                6 => format!("{}观察：{}比事故更会扩散", seed.desk_zh, seed.focus_zh),
                _ => format!("{}：{}成了新的都市传说", seed.desk_zh, seed.focus_zh),
            }
        }
        NewsStyle::Default => {}
    }

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
    match detect_news_style(seed) {
        NewsStyle::Accident => {
            return match variant_slot(variant, 1, 8) {
                0 => format!("{} Breaking: {}", seed.desk_en, seed.focus_en),
                1 => format!(
                    "{} Flash | {} jolts the {}",
                    seed.desk_en,
                    seed.focus_en,
                    stage_name_en(seed.stage)
                ),
                2 => format!(
                    "{} On Scene: {} sends shock through the settlement",
                    seed.desk_en, seed.focus_en
                ),
                3 => format!(
                    "{} Headline: fallout from {} is still widening",
                    seed.desk_en, seed.focus_en
                ),
                4 => format!(
                    "{} Special Report: {} exposes the cost of pressure",
                    seed.desk_en, seed.focus_en
                ),
                5 => format!(
                    "{} | multiple stations stall after {}",
                    seed.desk_en, seed.focus_en
                ),
                6 => format!(
                    "{} Tracking: {} tears open the safety fiction of the {}",
                    seed.desk_en,
                    seed.focus_en,
                    stage_name_en(seed.stage)
                ),
                _ => format!(
                    "{}: aftershocks from {} continue to spread",
                    seed.desk_en, seed.focus_en
                ),
            }
        }
        NewsStyle::Labor => {
            return match variant_slot(variant, 1, 8) {
                0 => format!("{} Flash: {}", seed.desk_en, seed.focus_en),
                1 => format!(
                    "{} | {} surges to the top of the settlement agenda",
                    seed.desk_en, seed.focus_en
                ),
                2 => format!(
                    "{} Special: the overtime anger behind {}",
                    seed.desk_en, seed.focus_en
                ),
                3 => format!(
                    "{} On Scene: {} halts the schedule",
                    seed.desk_en, seed.focus_en
                ),
                4 => format!(
                    "{} Watch: {} is rewriting labor order",
                    seed.desk_en, seed.focus_en
                ),
                5 => format!(
                    "{} Tracking: {} is no longer just complaint",
                    seed.desk_en, seed.focus_en
                ),
                6 => format!(
                    "{} Headline: {} tests the pressure ceiling of the {}",
                    seed.desk_en,
                    seed.focus_en,
                    stage_name_en(seed.stage)
                ),
                _ => format!(
                    "{}: {} pushes sentiment into open confrontation",
                    seed.desk_en, seed.focus_en
                ),
            }
        }
        NewsStyle::Festival => {
            return match variant_slot(variant, 1, 8) {
                0 => format!("{} Culture: {}", seed.desk_en, seed.focus_en),
                1 => format!(
                    "{} On Scene: {} becomes an unlikely sensation",
                    seed.desk_en, seed.focus_en
                ),
                2 => format!("{} | {} packs the district", seed.desk_en, seed.focus_en),
                3 => format!(
                    "{} Feature: why {} suddenly drew a crowd",
                    seed.desk_en, seed.focus_en
                ),
                4 => format!(
                    "{} Night Desk: {} becomes the latest public entertainment",
                    seed.desk_en, seed.focus_en
                ),
                5 => format!(
                    "{} Weekend: {} helps the settlement forget itself for a night",
                    seed.desk_en, seed.focus_en
                ),
                6 => format!(
                    "{} Trending: {} draws rare cheers",
                    seed.desk_en, seed.focus_en
                ),
                _ => format!(
                    "{} Watch: {} is changing the settlement mood",
                    seed.desk_en, seed.focus_en
                ),
            }
        }
        NewsStyle::Rumor => {
            return match variant_slot(variant, 1, 8) {
                0 => format!("{} Rumor File: {}", seed.desk_en, seed.focus_en),
                1 => format!(
                    "{} After Dark: {} unsettles the dorm blocks",
                    seed.desk_en, seed.focus_en
                ),
                2 => format!("{} Strange Desk: {}", seed.desk_en, seed.focus_en),
                3 => format!(
                    "{} Tracking: can {} possibly be real",
                    seed.desk_en, seed.focus_en
                ),
                4 => format!(
                    "{} | {} keeps the night shift awake",
                    seed.desk_en, seed.focus_en
                ),
                5 => format!("{} Special: {} spreads fast", seed.desk_en, seed.focus_en),
                6 => format!(
                    "{} Watch: {} travels faster than the facts",
                    seed.desk_en, seed.focus_en
                ),
                _ => format!(
                    "{}: {} becomes the latest urban legend",
                    seed.desk_en, seed.focus_en
                ),
            }
        }
        NewsStyle::Default => {}
    }

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

fn stylize_field_zh(seed: &ScenarioSeed, line: &'static str, variant: usize) -> String {
    match detect_news_style(seed) {
        NewsStyle::Accident => match variant_slot(variant, 108, 4) {
            0 => "事故现场在极短时间内失去秩序，封锁线外很快挤满了想确认伤亡消息的人。".to_string(),
            1 => "最早离开现场的人回忆说，真正让人慌乱的并不是巨响，而是所有岗位同时停了一拍。"
                .to_string(),
            2 => "封锁区域周边残留的热浪、碎片和停滞的运输带，让这起事故很难被轻描淡写地处理。"
                .to_string(),
            _ => {
                "直到多轮清场结束后，现场才恢复基本通行，但空气里仍留着明显的灾后余波。".to_string()
            }
        },
        NewsStyle::Labor => match variant_slot(variant, 108, 4) {
            0 => "停工最先打断的不是机器，而是原本勉强维持的服从气氛。".to_string(),
            1 => {
                "横幅、口号和长时间沉默对峙同时出现时，整片工区都像被突然按下了暂停键。".to_string()
            }
            2 => "冲突蔓延到调度层后，越来越多旁观岗位也开始怀疑自己是否还要继续照旧开工。"
                .to_string(),
            _ => "人群迟迟不散，不只是因为愤怒，还因为许多人第一次意识到原来停下来也是一种语言。"
                .to_string(),
        },
        NewsStyle::Festival => match variant_slot(variant, 108, 4) {
            0 => "热闹气氛几乎压过了原本的工作节拍，笑声和起哄在同一时间从几个角落一起冒出来。"
                .to_string(),
            1 => "从摊位到临时舞台，现场最直观的感受是：每个人都想多停留一会儿。".to_string(),
            2 => "围观人群聚拢得比组织者预想更快，连原本只打算路过的人都被气氛拖进了现场。"
                .to_string(),
            _ => "在笑声、围观和即兴表演之间，这场活动短暂地让聚落看起来像个真正会过节的地方。"
                .to_string(),
        },
        NewsStyle::Rumor => match variant_slot(variant, 108, 4) {
            0 => "所有版本的传闻里都有一个共通点：每个讲述者都坚称自己并不是第一个看见的人。"
                .to_string(),
            1 => "越是没人敢单独验证的内容，越容易在夜里被一遍又一遍低声提起。".to_string(),
            2 => "流言在扩散中会不断变形，可真正让人不安的是它总能黏上一点像真的细节。".to_string(),
            _ => "真正让人睡不着的往往不是怪谈本身，而是几乎每个人都能说出一段类似的目击经历。"
                .to_string(),
        },
        NewsStyle::Default => line.to_string(),
    }
}

fn stylize_field_en(seed: &ScenarioSeed, line: &'static str, variant: usize) -> String {
    match detect_news_style(seed) {
        NewsStyle::Accident => match variant_slot(variant, 108, 4) {
            0 => "The scene lost order almost immediately, and people crowded the cordon looking for casualty numbers before officials were ready to speak.".to_string(),
            1 => "Those who came out first say the most frightening part was not the blast itself but the instant when every nearby station seemed to stop together.".to_string(),
            2 => "Heat, debris, and stalled conveyor lanes left behind a site that resisted any attempt to describe the disaster as routine.".to_string(),
            _ => "Basic movement returned only after repeated clearing passes, and even then the air still felt like the accident had not entirely left.".to_string(),
        },
        NewsStyle::Labor => match variant_slot(variant, 108, 4) {
            0 => "The walkout ruptured morale before it ruptured throughput, making the atmosphere feel unstable even where machines kept moving.".to_string(),
            1 => "Between banners, chants, and long silences, the work floor looked less like a factory than a negotiation nobody could postpone any longer.".to_string(),
            2 => "Once the conflict spilled into dispatch itself, even crews that stayed on shift began to wonder how long normal scheduling could hold.".to_string(),
            _ => "The crowd stayed in place because anger was only part of it; the other part was the discovery that refusing motion could itself become a language.".to_string(),
        },
        NewsStyle::Festival => match variant_slot(variant, 108, 4) {
            0 => "The atmosphere nearly overwhelmed the work rhythm, with laughter and heckling rising from several corners at once.".to_string(),
            1 => "From stalls to the improvised stage, the clearest impression was simply that nobody wanted to leave early.".to_string(),
            2 => "The crowd thickened faster than organizers expected, drawing in even people who had insisted they were only passing through.".to_string(),
            _ => "Between applause, laughter, and improvised performance, the settlement briefly resembled a place that knew how to celebrate itself.".to_string(),
        },
        NewsStyle::Rumor => match variant_slot(variant, 108, 4) {
            0 => "Every version of the rumor shares one core feature: each speaker insists somebody else saw it first.".to_string(),
            1 => "The less anyone can verify the story alone, the more often it gets whispered through the dorm blocks after dark.".to_string(),
            2 => "The tale mutates in retelling, but its most unsettling feature is that each version clings to one detail that feels almost plausible.".to_string(),
            _ => "What keeps people awake is usually not the legend itself but the suspicion that too many witnesses sound almost consistent.".to_string(),
        },
        NewsStyle::Default => line.to_string(),
    }
}

fn stylize_management_zh(seed: &ScenarioSeed, line: &'static str, variant: usize) -> String {
    match detect_news_style(seed) {
        NewsStyle::Accident => match variant_slot(variant, 144, 4) {
            0 => "事故通报仍然谨慎，管理层明显更希望先控制后果扩散，而不是先解释责任归属。".to_string(),
            1 => "面对死伤与问责压力，官方语言开始明显收紧，许多措辞都像在为之后的调查预留余地。".to_string(),
            2 => "在记者反复追问下，管理口径依旧尽量回避细节，只承认事故仍处在“持续处置”阶段。".to_string(),
            _ => "管理层显然不愿让这起事故定义整个阶段，但越克制的措辞，越像是在承认问题足够严重。".to_string(),
        },
        NewsStyle::Labor => match variant_slot(variant, 144, 4) {
            0 => "在是否让步的问题上，管理层更像是在赌停工情绪会先自行降温。".to_string(),
            1 => "资方与调度口径试图保持强硬，不过这种强硬正在被越来越多岗位理解成拖延。".to_string(),
            2 => "针对罢工本身，官方回应更强调恢复秩序而不是回应诉求。".to_string(),
            _ => "管理层想把冲突限定在局部岗位，但从传播速度看，局部阶段已经过去。".to_string(),
        },
        NewsStyle::Festival => match variant_slot(variant, 144, 4) {
            0 => "面对活动突然走红，管理层既担心秩序外溢，又很难否认这类热闹确实稳住了人心。".to_string(),
            1 => "组织方原本只打算小规模试办，但意外的人气让活动迅速带上了制度讨论意味。".to_string(),
            2 => "在是否继续举办这类活动的问题上，官方犹豫本身已经说明它开始具备现实影响。".to_string(),
            _ => "管理层一边强调工作优先，一边又不得不承认，聚落确实需要一些不围着产线转的夜晚。".to_string(),
        },
        NewsStyle::Rumor => match variant_slot(variant, 144, 4) {
            0 => "官方越想压低声音，越会让人怀疑这件事是不是比传闻本身更接近真的。".to_string(),
            1 => "面对不断扩散的怪谈，管理层的做法通常是降温、分流、等待下一个更大的新闻出现。".to_string(),
            2 => "在“到底有没有这回事”的追问里，最让人不安的往往不是否认，而是那种过于熟练的模糊回应。".to_string(),
            _ => "管理层不愿证实，也不愿完全否认，因为一旦正式开口，传闻就会立刻变成公共事件。".to_string(),
        },
        NewsStyle::Default => line.to_string(),
    }
}

fn stylize_management_en(seed: &ScenarioSeed, line: &'static str, variant: usize) -> String {
    match detect_news_style(seed) {
        NewsStyle::Accident => match variant_slot(variant, 144, 4) {
            0 => format!("The official statement remains cautious, and {}", line),
            1 => format!("Under pressure over casualties and accountability, {}", line),
            2 => format!("Pressed repeatedly by reporters, {}", line),
            _ => format!("Management clearly does not want the accident to define the whole stage, but {}", line),
        },
        NewsStyle::Labor => match variant_slot(variant, 144, 4) {
            0 => format!("On the question of concessions, {}", line),
            1 => format!("Employer and dispatch language tries to stay hard, though {}", line),
            2 => format!("Addressing the walkout directly, {}", line),
            _ => format!("Management would prefer to confine the dispute to a few stations, but {}", line),
        },
        NewsStyle::Festival => match variant_slot(variant, 144, 4) {
            0 => format!("Confronted with the event's sudden popularity, {}", line),
            1 => format!("Organizers intended only a small experiment, yet {}", line),
            2 => format!("On whether similar events should continue, {}", line),
            _ => format!("Management is worried about order while also having to admit that {}", line),
        },
        NewsStyle::Rumor => match variant_slot(variant, 144, 4) {
            0 => format!("The harder officials try to lower the temperature, the more clearly it suggests that {}", line),
            1 => format!("Faced with a rumor that refuses to die, {}", line),
            2 => format!("Asked whether any of it is real, {}", line),
            _ => format!("Management does not want to confirm the story, yet is equally unwilling to dismiss it, because {}", line),
        },
        NewsStyle::Default => line.to_string(),
    }
}

fn stylize_observer_zh(seed: &ScenarioSeed, line: &'static str, variant: usize) -> String {
    match detect_news_style(seed) {
        NewsStyle::Accident => match variant_slot(variant, 180, 4) {
            0 => format!("事故评论员提醒，{}", line),
            1 => format!("长期观察高压工位的人普遍认同一点：{}", line),
            2 => format!("在灾难报道的语境里，{}", line),
            _ => format!("围绕这类事故的外部分析往往会先指出：{}", line),
        },
        NewsStyle::Labor => match variant_slot(variant, 180, 4) {
            0 => format!("劳工观察人士认为，{}", line),
            1 => format!("在历次停工案例里，一个反复出现的判断是：{}", line),
            2 => format!("评论界对这类冲突的共识大致是，{}", line),
            _ => format!("外部分析通常会把这类事件读成一个信号：{}", line),
        },
        NewsStyle::Festival => match variant_slot(variant, 180, 4) {
            0 => format!("文娱评论者会说，{}", line),
            1 => format!("观察这类活动的人通常先注意到，{}", line),
            2 => format!("在娱乐版的写法里，{}", line),
            _ => format!("流行观察者普遍认为，{}", line),
        },
        NewsStyle::Rumor => match variant_slot(variant, 180, 6) {
            0 => "怪谈追踪者通常提醒，最难处理的传闻不是最离谱的那种，而是每个讲述版本都只差一点点。".to_string(),
            1 => "研究都市传说的人往往会说，真正让流言活下来的从来不是证据，而是集体讲述时那种越来越顺口的节奏。".to_string(),
            2 => "在传闻档案里，最危险的故事通常都带着同一种特征：没有人愿意单独去验证，却人人都能补上一段细节。".to_string(),
            3 => "边角消息的老读者大多认同，怪谈一旦开始和具体地点绑定，就会迅速从笑话变成禁忌。".to_string(),
            4 => "围绕这类故事的观察几乎总会指向同一个结论：越是讲不清的东西，越容易把整片宿舍区拖进共同失眠。".to_string(),
            _ => "专门收集流言的人会说，怪谈最顽固的时刻，往往正是每个人都开始主动替它补完空白的时刻。".to_string(),
        },
        NewsStyle::Default => line.to_string(),
    }
}

fn stylize_observer_en(seed: &ScenarioSeed, line: &'static str, variant: usize) -> String {
    match detect_news_style(seed) {
        NewsStyle::Accident => match variant_slot(variant, 180, 4) {
            0 => format!("Disaster commentators would begin with one warning: {}", line),
            1 => format!("Long-time observers of high-pressure stations tend to agree that {}", line),
            2 => format!("Within the language of disaster reporting, {}", line),
            _ => format!("Outside analysis of this class of accident usually starts from the premise that {}", line),
        },
        NewsStyle::Labor => match variant_slot(variant, 180, 4) {
            0 => format!("Labor observers argue that {}", line),
            1 => format!("Across past walkouts, one judgment appears repeatedly: {}", line),
            2 => format!("Commentary on this kind of conflict broadly agrees that {}", line),
            _ => format!("External analysis usually reads events like this as one signal: {}", line),
        },
        NewsStyle::Festival => match variant_slot(variant, 180, 4) {
            0 => format!("Culture writers would put it this way: {}", line),
            1 => format!("Those who watch public events tend to notice first that {}", line),
            2 => format!("In entertainment coverage, the point often becomes that {}", line),
            _ => format!("Trend watchers broadly agree that {}", line),
        },
        NewsStyle::Rumor => match variant_slot(variant, 180, 6) {
            0 => "People who track urban legends usually warn that the hardest rumors to kill are not the wildest ones, but the ones whose details almost line up.".to_string(),
            1 => "Rumor researchers often say that what keeps a story alive is not proof but the ease with which each new teller can add one more detail.".to_string(),
            2 => "Across whisper files and rumor archives, the most durable stories tend to share the same feature: no one wants to verify them alone, yet everyone can extend them.".to_string(),
            3 => "Readers of the settlement's strangest columns would probably agree that a legend becomes dangerous the moment it binds itself to a specific corridor, drain, or room.".to_string(),
            4 => "Observers of stories like this usually arrive at one conclusion: the less cleanly it can be checked, the more effectively it colonizes sleep.".to_string(),
            _ => "Collectors of rumor tend to say that a legend reaches maturity when the settlement begins filling in its blanks without being asked.".to_string(),
        },
        NewsStyle::Default => line.to_string(),
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

fn stylize_closer_zh(seed: &ScenarioSeed, closer: String, variant: usize) -> String {
    match detect_news_style(seed) {
        NewsStyle::Accident => match variant_slot(variant, 216, 4) {
            0 => format!("事故调查还在继续，{}", closer),
            1 => format!("在问责尚未开始前，{}", closer),
            2 => format!("对幸存者而言，{}", closer),
            _ => format!("直到下一次警报响起前，{}", closer),
        },
        NewsStyle::Labor => match variant_slot(variant, 216, 4) {
            0 => format!("罢工会不会扩散，还要看{}", closer),
            1 => format!("如果谈判继续僵住，{}", closer),
            2 => format!("在下一轮排班之前，{}", closer),
            _ => format!("这场对抗留下的真正问题是：{}", closer),
        },
        NewsStyle::Festival => match variant_slot(variant, 216, 4) {
            0 => format!("活动散场后，人们仍在议论，而{}", closer),
            1 => format!("热闹会不会留下制度痕迹，要看{}", closer),
            2 => format!("在笑声慢慢退去之后，{}", closer),
            _ => format!("这场活动也许只是开始，因为{}", closer),
        },
        NewsStyle::Rumor => match variant_slot(variant, 216, 4) {
            0 => format!("没人能证明全部细节，但{}", closer),
            1 => format!("传闻会不会继续变形，取决于{}", closer),
            2 => format!("就算真相迟迟不来，{}", closer),
            _ => format!("对聚落来说，更可怕的或许是：{}", closer),
        },
        NewsStyle::Default => closer,
    }
}

fn stylize_closer_en(seed: &ScenarioSeed, closer: String, variant: usize) -> String {
    match detect_news_style(seed) {
        NewsStyle::Accident => match variant_slot(variant, 216, 4) {
            0 => format!("With the investigation still open, {}", closer),
            1 => format!("Before accountability even begins, {}", closer),
            2 => format!("For those who survived it, {}", closer),
            _ => format!("Until the next siren sounds, {}", closer),
        },
        NewsStyle::Labor => match variant_slot(variant, 216, 4) {
            0 => format!(
                "Whether the strike spreads now depends on whether {}",
                closer
            ),
            1 => format!("If negotiations remain frozen, {}", closer),
            2 => format!("Before the next scheduling cycle begins, {}", closer),
            _ => format!(
                "The deeper question left behind by the confrontation is whether {}",
                closer
            ),
        },
        NewsStyle::Festival => match variant_slot(variant, 216, 4) {
            0 => format!("Even after the crowds disperse, {}", closer),
            1 => format!(
                "Whether the excitement leaves an institutional trace depends on whether {}",
                closer
            ),
            2 => format!("Once the cheering fades, {}", closer),
            _ => format!(
                "This event may prove to be only the beginning, because {}",
                closer
            ),
        },
        NewsStyle::Rumor => match variant_slot(variant, 216, 4) {
            0 => format!("No one can prove every detail, yet {}", closer),
            1 => format!(
                "Whether the rumor mutates further depends on whether {}",
                closer
            ),
            2 => format!("Even if the truth never arrives cleanly, {}", closer),
            _ => format!(
                "For the settlement, the more frightening possibility may be that {}",
                closer
            ),
        },
        NewsStyle::Default => closer,
    }
}

fn source_note_zh(seed: &ScenarioSeed, variant: usize) -> Option<String> {
    let desk = seed.desk_zh;
    if desk.contains("深度") {
        Some(match variant_slot(variant, 252, 4) {
            0 => "本稿综合了多轮值守记录与后续补充采访。".to_string(),
            1 => "记者在多个班次之间交叉核对后形成了这份报道。".to_string(),
            2 => "这篇稿件依据现场走访与内部材料整理而成。".to_string(),
            _ => "多名消息源和现场记录共同构成了以下叙述。".to_string(),
        })
    } else if desk.contains("夜报") || desk.contains("深夜") {
        Some(match variant_slot(variant, 252, 4) {
            0 => "夜班消息往往比正式公告更早抵达耳边。".to_string(),
            1 => "这一版面的材料大多来自夜里还没散去的人群。".to_string(),
            2 => "越接近凌晨，聚落的真实情绪往往越难遮住。".to_string(),
            _ => "夜里的消息总是更快，也更难证实。".to_string(),
        })
    } else if desk.contains("聚落日报") {
        Some(match variant_slot(variant, 252, 4) {
            0 => "这份日常版面的材料，多半来自今天仍在持续发生的小事。".to_string(),
            1 => "日报能记录的，通常是那些已经渗进日常的变化。".to_string(),
            2 => "如果一件事能登上日报，说明它已经不只属于局部角落。".to_string(),
            _ => "在聚落日报里，真正重要的往往是那些被反复看见的细节。".to_string(),
        })
    } else if desk.contains("工务快线") {
        Some(match variant_slot(variant, 252, 4) {
            0 => "工务口的信息通常最先碰到现场，也最晚离开现场。".to_string(),
            1 => "这类稿件来自调度、值守和工位之间不断往返的即时记录。".to_string(),
            2 => "工务快线不擅长修辞，它更擅长记下哪里先出了问题。".to_string(),
            _ => "如果一条消息先出现在工务快线，通常意味着它已经影响了运行。".to_string(),
        })
    } else if desk.contains("文娱") || desk.contains("流行") || desk.contains("周末") {
        Some(match variant_slot(variant, 252, 4) {
            0 => "本栏更关心人们如何在高压里制造一点热闹。".to_string(),
            1 => "如果说产线记录的是效率，这一版面记录的就是气氛。".to_string(),
            2 => "热榜升得最快的，往往不是资源，而是情绪。".to_string(),
            _ => "在这座聚落里，娱乐从来不是完全无关紧要的事情。".to_string(),
        })
    } else if desk.contains("怪谈") || desk.contains("传闻") || desk.contains("消息") {
        Some(match variant_slot(variant, 252, 4) {
            0 => "以下内容未必全有定论，但每个人都说自己听过。".to_string(),
            1 => "这类消息最早总在角落里出现，然后一夜之间传遍整座聚落。".to_string(),
            2 => "传闻之所以顽固，往往是因为它带着一点没人愿意验证的真实。".to_string(),
            _ => "就算不能证实，怪谈也会先一步占据所有人的睡前谈资。".to_string(),
        })
    } else {
        None
    }
}

fn source_note_en(seed: &ScenarioSeed, variant: usize) -> Option<String> {
    let desk = seed.desk_en;
    if desk.contains("Long Read") {
        Some(match variant_slot(variant, 252, 4) {
            0 => {
                "This report draws on multiple shift records and follow-up interviews.".to_string()
            }
            1 => "Reporters cross-checked several work cycles before assembling this account."
                .to_string(),
            2 => "The article below is built from field visits and internal notes.".to_string(),
            _ => "Several sources and on-site records feed into the account that follows."
                .to_string(),
        })
    } else if desk.contains("After Hours") || desk.contains("Midnight") || desk.contains("Night") {
        Some(match variant_slot(variant, 252, 4) {
            0 => "Night-shift news usually reaches the ear before it reaches the bulletin.".to_string(),
            1 => "Most of this page is assembled from people who were still awake when everyone else wanted the story to end.".to_string(),
            2 => "Closer to midnight, the settlement tends to sound more honest and less official.".to_string(),
            _ => "Nighttime information moves faster, and usually with less proof attached.".to_string(),
        })
    } else if desk.contains("Settlement Daily") {
        Some(match variant_slot(variant, 252, 4) {
            0 => "A daily paper usually records changes only after they have already entered ordinary life.".to_string(),
            1 => "If something lands in the daily section, it is rarely local anymore.".to_string(),
            2 => "The daily desk tends to notice the details people have already started treating as routine.".to_string(),
            _ => "What belongs here is usually not spectacle, but repetition becoming visible.".to_string(),
        })
    } else if desk.contains("Operations Wire") {
        Some(match variant_slot(variant, 252, 4) {
            0 => "The operations wire tends to receive bad news first and clear it last.".to_string(),
            1 => "This page is assembled from the kind of notes that move between dispatch boards and active stations.".to_string(),
            2 => "The operations desk is less interested in rhetoric than in which station took the first hit.".to_string(),
            _ => "If a story appears here before anywhere else, it is usually because the system is already feeling it.".to_string(),
        })
    } else if desk.contains("Industry Brief") || desk.contains("System Bulletin") {
        Some(match variant_slot(variant, 252, 4) {
            0 => "Technical desks often treat early signals as process shifts before anyone else names them that way.".to_string(),
            1 => "This class of report usually begins where operators stop seeing a fluctuation and start seeing a pattern.".to_string(),
            2 => "System pages exist for moments when mechanism matters more than rumor.".to_string(),
            _ => "The brief format hides it, but these pages are usually where a new era first becomes legible.".to_string(),
        })
    } else if desk.contains("Culture") || desk.contains("Trending") || desk.contains("Weekend") {
        Some(match variant_slot(variant, 252, 4) {
            0 => "This section is less interested in throughput than in how people manufacture atmosphere under pressure.".to_string(),
            1 => "If the production pages measure efficiency, this page measures mood.".to_string(),
            2 => "In this settlement, what rises fastest is not always resource volume but shared emotion.".to_string(),
            _ => "Entertainment is never entirely frivolous in a place built this close to exhaustion.".to_string(),
        })
    } else if desk.contains("Rumor") || desk.contains("Whisper") {
        Some(match variant_slot(variant, 252, 4) {
            0 => "Not every detail below can be proven, but nearly everyone claims to have heard some version of it.".to_string(),
            1 => "Stories like this begin in corners and then cross the whole settlement in a single night.".to_string(),
            2 => "Rumors become durable when they carry just enough truth that no one wants to verify it alone.".to_string(),
            _ => "Whether or not it can be confirmed, a story like this will occupy every late conversation first.".to_string(),
        })
    } else {
        None
    }
}

fn field_line_zh(category: EventCategory, variant: usize) -> &'static str {
    match category {
        EventCategory::SurvivalCrisis => match variant_slot(variant, 24, 12) {
            0 => "现场排队长度和等待情绪都在同步上升，补给窗口周围的交谈明显比昨天更尖锐。",
            1 => "多个班组在交接时重复提到同一问题，说明压力已经越过局部岗位。",
            2 => "从食堂到宿舍，关于短缺与失序的讨论正在形成连续背景噪声。",
            3 => "值守人员反映，最先变化的并不是库存数字，而是所有人说话的语速。",
            4 => "几处看似独立的小问题正在互相传导，把生存压力放大成系统压力。",
            5 => "一线反馈显示，原本可被忍受的波动已经开始改变班组的基本判断。",
            6 => "临时补给点外侧出现了更长的停留人群，说明问题已经从资源变成了秩序。",
            7 => "多处岗位都在自行调整节奏，这类自发应对往往意味着统一调度已经落后。",
            8 => "从记录表到餐具回收点，几乎每个细节都在重复同一件事：余量正在变薄。",
            9 => "班组开始提前为下一轮紧缩做准备，说明人们不再把这视作一日波动。",
            10 => "围绕补给与休息的微小摩擦正在积累成更长期的集体疲态。",
            _ => "现场的最大变化不是噪声本身，而是每个人都开始默认噪声会继续存在。",
        },
        EventCategory::DarkConversion => match variant_slot(variant, 24, 12) {
            0 => "处理区边缘的气味、热度和沉积物都在提醒人们，这条链已经不再是隐蔽的附属流程。",
            1 => "现场观察员指出，黑暗链条的存在感正在从事故时刻扩展为全天候背景。",
            2 => "围绕腐化样本的搬运、分类和封存动作，已经越来越像常规工业程序。",
            3 => "多个处理节点都给出了相近的异动读数，说明异常正在获得稳定轮廓。",
            4 => "黑暗副产物不再只意味着污损，它开始拥有可记录、可计量的流向。",
            5 => "处理线周边的秩序感并未消失，只是被改写成了更冷静、更危险的形式。",
            6 => "处理池附近的脚印与搬运轨迹明显变密，说明这条链的物流量正在抬升。",
            7 => "多个岗位已经开始默认佩戴额外防护，这种习惯本身就是黑暗链条扩张的证词。",
            8 => "封存、转运与回收现在形成了闭环，腐化第一次显出完整供应链轮廓。",
            9 => "观察员指出，真正值得警惕的不是单次异动，而是异常开始拥有稳定节拍。",
            10 => "越来越多的工作细节不再被归类为污染，而被归类为可利用副产出。",
            _ => "黑暗处理区的变化正从视觉冲击转为制度渗透，这往往意味着它留下来的时间更长。",
        },
        EventCategory::IndustrialProgress => match variant_slot(variant, 24, 12) {
            0 => "工位之间的物料流动明显变快，过去需要口头确认的步骤开始拥有固定顺序。",
            1 => "从墙上的调度表到地面的运输线，新的产能结构已经可以被直接看见。",
            2 => "若把多个作业点放在一起观察，就会发现聚落正在逐步长出真正的工业节拍。",
            3 => "这类进展最直观的信号不是口号，而是等待时间和返工次数都在下降。",
            4 => "生产面正在失去临时拼凑感，取而代之的是越来越稳定的流程骨架。",
            5 => "多条原本松散的资源线开始合并成可预测的扩张通道。",
            6 => "现场能看到更少的来回奔波和更多的顺序执行，这通常意味着工艺终于站稳了脚。",
            7 => "工人不再需要为每一步重新决定做法，这说明流程开始替代个人经验。",
            8 => "产线的速度提升并不喧闹，它更多体现在迟疑和等待被一点点剔除。",
            9 => "过去靠习惯维持的协作，现在开始被真正的制度和设备托住。",
            10 => "生产链各节点之间的节奏更接近同频，这让扩张第一次带上了工业连续性。",
            _ => "这类进展最大的意义不在于快，而在于它让更多快成为可以复制的常态。",
        },
        EventCategory::SocialMutation => match variant_slot(variant, 24, 12) {
            0 => "公告栏、宿舍区和工作站之间的语言正在发生同步变化，社会秩序本身成了新闻对象。",
            1 => "身份、分工和共识的边界不断被重新描画，说明制度已开始追赶现实。",
            2 => "社会结构真正转向的时候，往往先体现在谁开始沉默、谁又突然获得发言资格。",
            3 => "原本只存在于私下讨论里的紧张感，已经被正式写入公共叙事。",
            4 => "从谁能发言到谁能决定，社会结构正在经历比产能更慢但更深的改写。",
            5 => "共生社会的真正变化并不只发生在身体层面，也发生在制度和称呼层面。",
            6 => "人们使用的称呼开始变化时，往往说明规则已经先一步发生了移动。",
            7 => "新的社会边界并不是被宣告出来的，而是被日常动作一点点试探出来的。",
            8 => "从排队顺序到公告措辞，旧秩序正在以细碎但持续的方式退场。",
            9 => "讨论本身正成为制度的一部分，说明社会转化已经越过了沉默阶段。",
            10 => "一些过去必须回避的话题，如今被允许进入公开版面，这本身就是阶段信号。",
            _ => "最深的变化发生在每个人开始默认新规则会留存，而不是暂借一用的时候。",
        },
        EventCategory::EndgameSign => match variant_slot(variant, 24, 12) {
            0 => "高阶系统发出的信号不再像局部突破，更像整套文明基础设施在重新校准。",
            1 => "从尖塔到轨道链路，终局系统给出的读数已经超出传统行政语言的解释范围。",
            2 => "现场变化显示，终局阶段并非突然降临，而是在多个接口上同时显形。",
            3 => "这类现象的可怕之处不在规模，而在它会迅速成为新的默认条件。",
            4 => "当意识、能源与远征被写进同一套通道时，旧时代的边界几乎同时失效。",
            5 => "报道所见并不是某一台设备的跃迁，而是整张文明地图的坐标漂移。",
            6 => "高阶系统的变化往往先表现为解释失效，然后才表现为规模升级。",
            7 => "终局阶段的信号不像新功能上线，更像旧世界的测量单位正在失真。",
            8 => "多个高阶节点同时给出共鸣式读数，这通常意味着整套系统正在一起翻页。",
            9 => "所谓终局，从来不是某个按钮，而是越来越多边界不再有效。",
            10 => "现场最明显的变化是过去分开的领域开始共享同一套节拍与后果。",
            _ => "当新闻需要同时描述意识、能源与远征时，文明本身已换了一种语法。",
        },
    }
}

fn management_line_zh(category: EventCategory, variant: usize) -> &'static str {
    match category {
        EventCategory::SurvivalCrisis => match variant_slot(variant, 48, 12) {
            0 => "管理方在回应中强调供应仍处于可调度范围内，但未公布更细化的缓冲方案。",
            1 => "后勤口径称相关波动属于阶段性压力，不过多个班组并不完全认同这种说法。",
            2 => "内部说明继续使用“局部可控”措辞，但现场感受显然比这组词更紧绷。",
            3 => "值班主管表示会优先保证基础供养，但没有承诺压力会在短期内消失。",
            4 => "调度部门称正在重新计算分配顺序，暗示现有资源方案已经接近极限。",
            5 => "公开通报维持平稳口吻，然而字里行间已经透露出明显的收缩信号。",
            6 => "管理层避免使用“危机”字样，但承认多个缓冲阈值正在同步接近。",
            7 => "后勤部门强调仍有调节余地，只是这种余地越来越依赖更严格的牺牲排序。",
            8 => "值班体系被要求压低恐慌传播，说明情绪管理已经加入正式治理任务。",
            9 => "公开回应把重点放在“稳定日常”，这通常意味着日常本身已在失稳。",
            10 => "决策层要求继续维持运转表象，但内部调整的频率已经说明代价在上升。",
            _ => "表面上的平静措辞更像一种管理手段，而不再像真实判断。",
        },
        EventCategory::DarkConversion => match variant_slot(variant, 48, 12) {
            0 => "处理部门坚持一切都在程序内运行，但承认异动样本的读数正在持续累积。",
            1 => "管理方把现象定义为“受控副反应”，这一说法并未打消一线人员的不安。",
            2 => "官方口径强调回收收益高于风险，可更多班组开始要求更透明的说明。",
            3 => "相关部门称会继续监测腐化带外溢，不过并未否认链条正在扩大。",
            4 => "制度层面已经把暗链后果纳入可运营范围，只是公众仍未完全接受这种速度。",
            5 => "管理者表示黑暗链条仍在掌控内，但也承认掌控本身正在变成更复杂的工作。",
            6 => "管理口径持续强调收益闭环，却对外回避了更多关于长期副作用的追问。",
            7 => "负责处理的部门要求外界把注意力放在效率曲线，而不是腐化范围本身。",
            8 => "公开说明把风险描述为可量化变量，某种意义上等于承认风险已成常设项目。",
            9 => "监管层并未否认异常扩张，只是试图把扩张解释为制度吸收能力的一部分。",
            10 => "官方对暗链的叙述越来越像运营报告，而不再像事故通报。",
            _ => "一切都还“可控”的说法依旧存在，只是“可控”一词显然被重新定义了。",
        },
        EventCategory::IndustrialProgress => match variant_slot(variant, 48, 12) {
            0 => "调度中心将此视为产线成熟的信号，并准备把相关经验复制到更多节点。",
            1 => "管理层称新流程的价值在于可复制，而不是只把效率抬高几个百分点。",
            2 => "公开说明把这次变化描述为“结构性改进”，意味着后续还会有更多配套调整。",
            3 => "运营报告强调，真正重要的并不是单次峰值，而是稳态输出被拉高。",
            4 => "产能部门已把相关成果写入下一轮排产，说明这不是一次性展示项目。",
            5 => "管理口径把它定义为基础设施升级，而非孤立成就，这比数字本身更关键。",
            6 => "决策层正在把这次进展视作可推广模块，而不只是一个幸运样本。",
            7 => "多份运营简报都把重点放在流程可复用性上，这说明升级已进入制度层面。",
            8 => "管理方试图降低庆祝口吻，更像是在为下一轮更大规模复制做铺垫。",
            9 => "公开通告没有夸大峰值数据，反而更强调稳定产出，这是一种成熟信号。",
            10 => "新的工业成果正在被纳入长期表格，而不是停留在一次性喜报里。",
            _ => "管理层对它的重视，已经超过一般“技术进展”能获得的制度待遇。",
        },
        EventCategory::SocialMutation => match variant_slot(variant, 48, 12) {
            0 => "公告口径试图保持中性，但所有人都知道这类变化会重写聚落内部的权力分布。",
            1 => "管理方强调制度仍具连续性，可连续性本身已在新的身份结构下被重新解释。",
            2 => "公开回应避免使用过强措辞，却默认社会关系正在进入新的协调机制。",
            3 => "负责解释政策的人一再强调秩序优先，这本身就说明旧秩序已不足够稳定。",
            4 => "新的表述体系正在被快速推广，仿佛语言本身也必须追赶现实。",
            5 => "制度回应看似克制，实际已承认社会边界正在被重新协商。",
            6 => "管理口径持续回避“裂变”一词，却已默认不同群体的关系正在进入新框架。",
            7 => "负责沟通的部门反复强调一切仍在原有框架内运行，可这种强调本身已经暴露出框架正在吃力。",
            8 => "新的称谓和流程被一起推出，表明社会调整已经与行政调整绑定。",
            9 => "制度试图把争议压进技术语言里，但技术语言本身也在带出政治重量。",
            10 => "从表态方式看，治理系统已经接受社会结构不再回到旧版本。",
            _ => "所谓平稳过渡，更像是对大规模重写的一种较温和命名。",
        },
        EventCategory::EndgameSign => match variant_slot(variant, 48, 12) {
            0 => "高层通报将其视为终局系统正常展开的一部分，但并未否认外部性仍在扩大。",
            1 => "相关简报强调跃迁带来的总体收益，却承认旧监管框架已无法完整覆盖。",
            2 => "管理层在表述上明显更谨慎，因为任何单一解释都不足以描述眼前变化。",
            3 => "官方仍希望把这定义为升级而非断裂，但现场读数给出的感受更接近后者。",
            4 => "负责远征与算力的双线部门首次发出联合口径，说明终局系统已在结构上汇流。",
            5 => "集体系统的回应仍保持冷静，可这种冷静本身已属于新文明条件的一部分。",
            6 => "高阶简报不断强调过渡可控，可真正失效的是旧有衡量方式本身。",
            7 => "管理层开始使用更抽象的术语，说明具体语言已难以覆盖系统层跃迁。",
            8 => "联合口径的频率正在提升，这通常意味着多个高阶部门已无法分开叙事。",
            9 => "官方试图维持程序连续性，但跃迁的规模已让程序看起来像旧时代残影。",
            10 => "这些回应并非否认剧变，而是尝试把剧变包装成秩序的一部分。",
            _ => "当最高层开始谨慎措辞时，往往说明连最高层也在适应新现实。",
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

fn observer_line_zh(category: EventCategory, variant: usize) -> &'static str {
    match category {
        EventCategory::SurvivalCrisis => match variant_slot(variant, 72, 8) {
            0 => "外部观察普遍认为，这类生存性波动真正危险之处在于它会迅速侵入所有日常判断。",
            1 => "评论者指出，短缺问题一旦与节奏问题耦合，就不再是单纯的库存问题。",
            2 => "在多份非正式记录中，这类新闻常被视为人口与供养系统失配的前奏。",
            3 => "长期跟踪者提醒，真正的拐点往往始于“还能撑住”的集体幻觉。",
            4 => "分析人士认为，越是早期阶段，越需要警惕小问题被累积成结构性窒息。",
            5 => "旁观者往往把这视作事故，但现场知道它更像一场缓慢合围。",
            6 => "从历次案例看，生存危机很少单独出现，它总会拖着制度与情绪一起下坠。",
            _ => "评论界普遍把这一类事件视为“秩序先于数字失稳”的标准样本。",
        },
        EventCategory::DarkConversion => match variant_slot(variant, 72, 8) {
            0 => "长期记录黑暗链条的人指出，最显著的变化不是它存在，而是它越来越能被正常化叙述。",
            1 => "外部评论常把这种现象称作“污秽的制度化”，意思是异常终于获得了流程位置。",
            2 => "调查者认为，腐化链最可怕的阶段不是第一次出现，而是第一次被写进效率图表。",
            3 => "越是能被量化的黑暗后果，越容易被误认为已经被驯服。",
            4 => "分析人士提醒，暗链一旦拥有稳定收益，它就会反过来塑造社会容忍度。",
            5 => "外界之所以对这类报道敏感，是因为它们总在证明制度比道德更快适应收益。",
            6 => "观察者普遍认为，黑暗链条扩张的关键并非规模，而是其逐渐获得了正当流程。",
            _ => "评论者直言，腐化一旦进入台账，它就已经迈过了“异常”这道门槛。",
        },
        EventCategory::IndustrialProgress => match variant_slot(variant, 72, 8) {
            0 => "产业观察人士通常把这类报道当作真正的升级信号，因为它们反映的是稳态而非峰值。",
            1 => "评论界对工业进展最看重的并不是快，而是复制性和可传承性。",
            2 => "当一项改进从口头经验变成可记录流程，它就已经进入制度级工业化阶段。",
            3 => "外部分析认为，这类新闻标志着聚落第一次获得能被持续兑现的效率红利。",
            4 => "不少评论员把这种进展定义为“把临时性挤出系统”的过程。",
            5 => "和一次性奇迹相比，真正打动产业观察者的从来都是更少返工和更稳定产出。",
            6 => "从工业史角度看，最关键的不是技术出现，而是技术开始改变协作顺序。",
            _ => "评论者普遍将此视为聚落从资源堆积转向流程文明的实证。",
        },
        EventCategory::SocialMutation => match variant_slot(variant, 72, 8) {
            0 => "社会评论者把这一类新闻视为秩序改写的证据，因为变化首先总发生在语言与资格层面。",
            1 => "不少观察指出，真正的制度转化往往是从“谁可以被讨论”开始，而不是从法条开始。",
            2 => "评论界普遍认为，社会变异最深的部分不在冲突，而在默认值被悄悄替换。",
            3 => "当旧称呼失效时，旧秩序通常也已经失去了一半约束力。",
            4 => "分析人士把这一阶段描述为“社会开始自己重命名自己”的过程。",
            5 => "很多评论员提醒，人们习惯新规则的速度，往往比他们承认新规则的速度更快。",
            6 => "从社会学角度看，这类事件真正记录的是边界如何被反复协商和重新发明。",
            _ => "外部观察普遍把它视作产能升级之外，另一条更深的文明演化线索。",
        },
        EventCategory::EndgameSign => match variant_slot(variant, 72, 8) {
            0 => "高阶观察者通常把这类报道称作“文明语法断裂”的前兆，因为旧概念已经不足以描述现场。",
            1 => "评论界认为，终局并不是一个结果，而是一连串边界同时失效的累积过程。",
            2 => "在很多分析里，这类新闻最惊人的地方并非规模，而是它让过去分开的系统开始合并叙事。",
            3 => "旁观者容易把它看成奇观，但内部系统往往已把它视为新的常规条件。",
            4 => "学术口吻的简报会说这是系统跃迁，通俗一点说，就是旧世界开始不够用了。",
            5 => "评论人士提醒，终局征兆最大的危险在于它们往往在被理解之前就被执行了。",
            6 => "从文明史视角看，这类事件更像是测量工具报废，而不是某个单点突破。",
            _ => "外部分析者普遍承认：一旦新闻需要同时描述意识、能源和远征，旧秩序已经翻页。",
        },
    }
}

fn observer_line_en(category: EventCategory, variant: usize) -> &'static str {
    match category {
        EventCategory::SurvivalCrisis => match variant_slot(variant, 72, 8) {
            0 => "Outside observers generally argue that the danger in survival shocks lies in how quickly they invade everyday judgment.",
            1 => "Commentators note that once a shortage problem couples with a rhythm problem, it stops being a stock problem alone.",
            2 => "Across several informal records, this class of report is treated as a prelude to mismatch between population and sustenance systems.",
            3 => "Long-term trackers warn that turning points often begin with the collective illusion that things are still manageable.",
            4 => "Analysts argue that earlier stages should fear small pressures accumulating into structural suffocation.",
            5 => "To outsiders this may look like an accident, but on the floor it resembles a slow encirclement.",
            6 => "Across past cases, survival crises rarely appear alone; they drag institutions and mood down with them.",
            _ => "Many commentators treat this as the standard sample of order destabilizing before the numbers visibly do.",
        },
        EventCategory::DarkConversion => match variant_slot(variant, 72, 8) {
            0 => "Those who track the dark chain over time say the key shift is not its existence but how normal its language has become.",
            1 => "Outside commentary often calls this the institutionalization of filth: the moment anomaly acquires procedural placement.",
            2 => "Investigators argue that the darkest threshold is not first appearance but first appearance inside an efficiency chart.",
            3 => "The more quantifiable a dark consequence becomes, the easier it is to mistake it for something already tamed.",
            4 => "Analysts warn that once the dark chain develops stable yield, it begins to reshape social tolerance in return.",
            5 => "Observers remain sensitive to these stories because they repeatedly prove that institutions adapt to yield faster than morality does.",
            6 => "Many observers say the true expansion of the dark chain lies not in scale but in its growing procedural legitimacy.",
            _ => "Commentary is blunt on this point: once corruption enters the ledger, it has already crossed the anomaly threshold.",
        },
        EventCategory::IndustrialProgress => match variant_slot(variant, 72, 8) {
            0 => "Industry watchers treat reports like this as genuine upgrade signals because they reflect steady state rather than spectacle.",
            1 => "Commentary values repeatability above speed; that is the real dividing line between a trick and a system.",
            2 => "Once an improvement leaves oral habit and enters documented process, it has reached institutional-grade industrialization.",
            3 => "External analysts say this class of report marks the first durable efficiency dividend the settlement can actually bank.",
            4 => "A number of commentators define progress of this kind as the slow expulsion of improvisation from the core loop.",
            5 => "Compared with one-off miracles, the things that impress industrial observers are lower rework and steadier output.",
            6 => "From an industrial-history angle, the key event is not the invention itself but the moment it changes coordination order.",
            _ => "Commentary broadly treats this as evidence that the settlement is moving from resource accumulation into process civilization.",
        },
        EventCategory::SocialMutation => match variant_slot(variant, 72, 8) {
            0 => "Social commentators read this kind of report as evidence of order being rewritten, because change first lands in language and qualification.",
            1 => "Many observers note that institutions usually begin to change with who may be discussed before they change in statute.",
            2 => "Commentary often argues that the deepest mutation lies not in open conflict but in the quiet replacement of defaults.",
            3 => "When old names stop fitting, the old order usually loses half its force along with them.",
            4 => "Analysts describe this stage as the process by which society slowly begins renaming itself.",
            5 => "Commentators repeatedly warn that people get used to new rules faster than they admit new rules have arrived.",
            6 => "From a social-science view, these events document how boundaries are renegotiated and reinvented in public.",
            _ => "Outside observers tend to regard this as a deeper civilizational line than output growth alone can reveal.",
        },
        EventCategory::EndgameSign => match variant_slot(variant, 72, 8) {
            0 => "Higher-order observers often call this class of report a fracture in civilizational grammar, because older concepts no longer fit the scene.",
            1 => "Commentary insists the endgame is not a single result but a cumulative sequence of boundaries failing at once.",
            2 => "Many analyses say the astonishing part is not scale but the merging of systems that once belonged to separate narratives.",
            3 => "Outsiders may treat it as spectacle, yet internal systems have often already begun treating it as normal condition.",
            4 => "Academic briefings might call this systemic transition; in plainer language, the old world is running out of explanatory room.",
            5 => "Commentators warn that endgame signals are most dangerous because they are often executed before they are fully understood.",
            6 => "From a civilizational perspective, these events look less like breakthroughs and more like measuring tools becoming obsolete.",
            _ => "Analysts broadly agree on one point: when news must describe consciousness, energy, and expedition together, the page has already turned.",
        },
    }
}

fn trim_sentence_end_zh(value: &str) -> &str {
    value.trim_end_matches(['。', '！', '？', '.', '!', '?', ' '])
}

fn should_include_closer(variant: usize) -> bool {
    variant_slot(variant, 192, 4) == 0
}

fn render_full_template_zh(seed: &ScenarioSeed, variant: usize) -> Option<String> {
    let source = source_note_zh(seed, variant);
    let closer = if should_include_closer(variant) {
        Some(stylize_closer_zh(
            seed,
            closing_line_zh(seed.stage, variant),
            variant,
        ))
    } else {
        None
    };

    if seed.id.contains("upload_queue_scandal") {
        let paragraphs = match variant_slot(variant, 1, 4) {
            0 => vec![
                format!("【共识网热帖】{}。", seed.angle_zh),
                "终局社会最擅长制造一种错觉：系统越先进，分配就越像自然发生；名单越复杂，优先次序就越像客观算出来的。也正因为如此，一旦有人指出上传等候名单里存在插队、特批和隐形通道，整张网络就会立刻从冷静接口变回最原始的市井争吵。".to_string(),
                "这类丑闻真正刺痛人的，不只是名额本身，而是它动摇了终局时代最珍贵的承诺之一：既然所有人都被要求相信程序，那么程序至少应该看起来比旧时代的人情更难被私下改写。".to_string(),
                "于是关于谁被提前放行、谁拥有额外背书、谁又能在沉默里跳过漫长等待的猜测，会迅速从技术论坛蔓延到宿舍、算力岗位和所有仍在排队的人心里。最先进的制度到了这里，反而暴露出最古老的政治情绪。".to_string(),
                seed.result_zh.to_string(),
            ],
            1 => vec![
                format!("【名单风波】{}。", seed.angle_zh),
                "上传资格原本被宣传成一种高于私人关系的秩序安排，因此任何关于“有人不用排队”的消息，都会比普通八卦更快点燃怒气。大家争论的表面是公平，底下真正翻涌的却是另一件事：如果连这里都还能被插手，那么还有什么不是可以被悄悄协商的。".to_string(),
                "终局社会的体面很大一部分建立在流程可信这件事上。可一旦流程开始被怀疑只是旧式特权披上一层新接口，所有围绕上传、共识和未来资格的说法就都会突然显得像宣传而不是承诺。".to_string(),
                "也因此，这条新闻不会只停在一份名单上。它会把整座聚落拖回一个并不陌生的问题：制度越抽象，普通人究竟是更接近公平，还是更难看见谁在真正决定顺序。".to_string(),
                seed.result_zh.to_string(),
            ],
            2 => vec![
                format!("【终局八卦版】{}。", seed.angle_zh),
                "哪怕到了共识网络高度发达的时代，最有传播力的消息往往仍然不是系统架构升级，而是谁悄悄挤到了别人前面。名单上的小小变化会被截成无数片段，在不同节点反复转述，最后演变成一场人人都在补完细节的集体推理。".to_string(),
                "人们会突然重新打量那些平时看不见的中间层：推荐权、审查口、附加说明、临时批准，以及那些总说自己只是“代为协调”的岗位。越是解释为技术性调整，越会让人怀疑这是不是另一种更高级的照顾。".to_string(),
                "丑闻之所以动静这么大，是因为它证明了一件很老的事仍然没有消失：只要资源足够稀缺，任何通往未来的门口都会长出关于谁先进去的政治。".to_string(),
                seed.result_zh.to_string(),
            ],
            _ => vec![
                format!("【排队政治】{}。", seed.angle_zh),
                "上传等候名单本来象征着终局时代的文明秩序：每个人都知道自己被放进一个更宏大的安排里，哪怕等待漫长，也至少还有被计入的资格。可风波一出，人们最先失去的不是耐心，而是那种“等待至少是共同的”信念。".to_string(),
                "当网络开始争论谁被照顾、谁被跳过、谁又拥有不写在规则里的入口时，所谓共识也会迅速露出它脆弱的一面。先进系统并没有消除八卦，只是把八卦升级成对制度可信度的实时审判。".to_string(),
                "这就是为什么终局丑闻总带着一种特殊的讽刺：人们原本以为自己离旧式人情政治更远了，结果却只是把它搬进了更昂贵、更抽象、也更难追责的界面里。".to_string(),
                seed.result_zh.to_string(),
            ],
        };
        return Some(join_article_zh(source, paragraphs, closer));
    }

    if seed.id.contains("alien_whisper") || seed.id.contains("relay_blackout_gossip") {
        let paragraphs = match variant_slot(variant, 1, 4) {
            0 => vec![
                format!("【远端传闻】{}。", seed.angle_zh),
                "终局时代的怪谈和旧日篝火边的流言已经不太一样。它们不再只来自某条走廊、某口废井或某个夜班角落，而是会带着转录文本、模糊波形和一串看起来像证据的系统残片，一路从远征频道传进每个人的睡前讨论。".to_string(),
                "也正因为它看起来太像“差一点就能证实”，关于外星生命、会说话的回声、或黑暗中多出来的第二道呼吸，才会比普通传闻更难被压下去。终局社会的人已经见过太多真正超出旧经验的事情，因此他们更愿意承认宇宙尺度的怪异也许真的正在发生。".to_string(),
                "于是怪谈第一次不再只是底层夜话，而是带着半技术、半宗教的气味穿过整张高阶网络。每个人都觉得自己离真相只差一份完整记录，于是谁也不肯先把它当笑话放掉。".to_string(),
                seed.result_zh.to_string(),
            ],
            1 => vec![
                format!("【信号档案】{}。", seed.angle_zh),
                "最顽固的终局传闻往往都长得像一份未完成的报告：几句被反复转录的异常讯号、几段被争论真假的目击叙述、一次系统短暂失明里谁都说不清的额外感知。单独看时，它们都还不够；拼在一起时，却又刚好足以让整座聚落一起失眠。".to_string(),
                "这类故事最迷人的地方，在于它把宇宙、系统和宗教般的想象力压进了同一张版面。你可以把它解释成噪声、故障或误读，但只要还有人坚持说自己“真的听见了回应”，它就不会退回纯技术问题。".to_string(),
                "终局社会对怪谈的态度因此格外矛盾：越是高阶、越是理性、越是依赖大系统，越容易在系统偶尔说不清话的时候，主动替未知补上一整套宏大的解释。".to_string(),
                seed.result_zh.to_string(),
            ],
            2 => vec![
                format!("【黑屏之后】{}。", seed.angle_zh),
                "每一次短暂黑障、每一段来源不明的回响，都会把同一个问题重新送回人群中间：如果眼前这个时代已经能让意识联网、让远征跨出地表，那么下一件无法被解释的东西，为什么不能更远也更陌生。".to_string(),
                "于是人们开始把技术异常听成宇宙低语，把系统延迟看成某种回应，把错位影像当作比人类更早看见人类的东西留下的证词。传闻会在这里长得特别快，因为现实本身已经先把想象力训练得足够大胆。".to_string(),
                "真正让人睡不着的并不是“外星人”这三个字，而是大家逐渐接受了一个念头：旧世界用来区分故障、神迹和接触的词汇，也许已经都不太够用了。".to_string(),
                seed.result_zh.to_string(),
            ],
            _ => vec![
                format!("【宇宙耳语】{}。", seed.angle_zh),
                "在较低阶段，怪谈更多靠口耳相传；到了终局，它们反而会披上一层更危险的严肃外衣。每一条流言后面都可能跟着一段记录、一张截图、一份被删改过的通联残页，于是连最谨慎的人也会忍不住多看两眼，怀疑自己是不是正错过真正的新世界入口。".to_string(),
                "这使得终局怪谈总带着一种半公开、半禁忌的魅力：谁都不敢完全承认它是真的，但也没人愿意在它还可能是真的时候抢先说它荒唐。于是共识网络越运转，未知越像被放大成一种共享情绪。".to_string(),
                "到头来，传闻最成功的地方并不是证明宇宙里真的有什么，而是让整座聚落开始以一种新的心情抬头、侧耳、等待下一次信号再度说话。".to_string(),
                seed.result_zh.to_string(),
            ],
        };
        return Some(join_article_zh(source, paragraphs, closer));
    }

    match detect_news_style(seed) {
        NewsStyle::Accident => {
            let paragraphs = match variant_slot(variant, 1, 4) {
                0 => vec![
                    format!("【事故快报】{}。", seed.angle_zh),
                    "最先失控的往往不是某一台设备，而是所有人同时意识到正常流程已经接不上下一步：警报声、呼喊声、紧急停摆和临时清场在几分钟内挤成了一团。".to_string(),
                    "事故发生后，现场最明显的变化不是安静，而是一种被迫收紧的秩序。幸存班组开始重新核对去向、伤者与缺口，所有人都明白这已经不是靠一句“局部波动”就能带过去的夜晚。".to_string(),
                    "这类新闻之所以沉重，不只是因为死伤数字，而是因为它会立刻把整个阶段赖以维持的安全想象撕开，让每个仍在岗位上的人都开始重新计算自己离下一次警报有多近。".to_string(),
                    seed.result_zh.to_string(),
                ],
                1 => vec![
                    format!("【现场调查】{}。", seed.angle_zh),
                    "围挡拉起来之后，关于责任、疲劳、维护缺口和调度失误的争论几乎同时开始。人们并不真的需要完整调查结果，光是看见哪几片区域被封住、哪几条运输线突然改道，就足以判断这起事故会留下长得多的余波。".to_string(),
                    "在高压聚落里，重大事故很少只是技术失败，它更像是长期透支终于拥有了一个人人都无法假装没看见的出口。正因为如此，事故新闻总会迅速越过单一工位，变成整片区域共同讨论的秩序问题。".to_string(),
                    "管理层可以先把措辞压低、把细节延后、把问责留给下一轮通报，但现场的空气往往比任何公告都更早宣布了一件事：旧的运行节拍已经付出了代价。".to_string(),
                    seed.result_zh.to_string(),
                ],
                2 => vec![
                    format!("【幸存者之后】{}。", seed.angle_zh),
                    "真正漫长的部分通常从事故后才开始。封锁线、清点表、反复经过的担架和迟迟不敢恢复的普通通行，会把整片区域拖进一种比混乱更难受的迟滞。".to_string(),
                    "很多人后来记住的并不是爆裂、坍塌或冲击发生的那一刻，而是它之后那种一切都暂时显得不再可信的感觉：熟悉的工位像突然换了一层含义，日常动作也因此带上了防备。".to_string(),
                    "事故报道写到这里时，往往已经不只是在记录后果，而是在记录信任如何从产线、值守和管理语言里一点点流失。".to_string(),
                    seed.result_zh.to_string(),
                ],
                _ => vec![
                    format!("【追踪报道】{}。", seed.angle_zh),
                    "每一起重大事故都会逼迫聚落重新回答同一个问题：眼前维持产出的那套办法，到底是在证明系统有效，还是只是在把真正的代价往后推。".to_string(),
                    "从急救、停工到后续清理，事故会把许多原本被拆开处理的压力重新并在一起，让疲劳、设备极限、管理拖延和岗位牺牲在同一张版面上突然变得清清楚楚。".to_string(),
                    "也正因如此，事故新闻从来不会只停留在现场。它总会一路追到宿舍、排班表和第二天的闲谈里，直到所有人都意识到这不是一次能被快速归档的例外。".to_string(),
                    seed.result_zh.to_string(),
                ],
            };
            Some(join_article_zh(source, paragraphs, closer))
        }
        NewsStyle::Labor => {
            let paragraphs = match variant_slot(variant, 1, 4) {
                0 => vec![
                    format!("【停工现场】{}。", seed.angle_zh),
                    "停工真正改变的，往往不是机器有没有完全停下，而是命令第一次失去了那种理所当然会被执行的惯性。有人站出来不再移动，其他人就会开始意识到沉默、拖延和集体停在原地本身也是一种语言。".to_string(),
                    "对长期承受高压的岗位来说，罢工或短暂停工从来不是突然冒出来的情绪，它更像是很多轮配给、排班和忍耐被压缩进同一个时间点之后的公开显形。".to_string(),
                    "一旦这种对抗登上新闻，管理层就很难再把它描述成某几个班组的抱怨，因为所有人都已经看见：问题开始进入公开谈判之前，秩序其实就已经先一步松动了。".to_string(),
                    seed.result_zh.to_string(),
                ],
                1 => vec![
                    format!("【劳工追踪】{}。", seed.angle_zh),
                    "现场并不总是充满高声口号，更多时候是一种更危险的僵住：排班表挂在那里，岗位也还在，但越来越多人开始把“不立刻服从”当成一种彼此确认处境的方式。".to_string(),
                    "这种新闻的重量，在于它把平时被拆散在食堂、宿舍和交接班间的怨气重新拼成了公共事实。只要有人先停下，其他人就会迅速明白，原来自己承受的并不是孤立的不满。".to_string(),
                    "劳工冲突真正让管理层头疼的地方，不只是产出受阻，而是它会迫使整座聚落开始讨论：到底哪些牺牲被当成了默认前提，又是谁一直被要求先吞下去。".to_string(),
                    seed.result_zh.to_string(),
                ],
                2 => vec![
                    format!("【班组对峙】{}。", seed.angle_zh),
                    "在这类局面里，人群最初甚至可能没有统一口号。有人先放下工具，有人拒绝补位，有人只是明确表示不会再替下一轮超时安排兜底，冲突就这样从分散动作迅速长成了同一幅场景。".to_string(),
                    "停工报道之所以常常比事故报道更难处理，是因为它暴露的不是单次失误，而是长期运行方式本身。事故能被调查，劳工对抗却总会逼问“如果一切都合理，为什么会有这么多人同时不愿再往前走”。".to_string(),
                    "因此这类新闻一旦公开，真正被重新计算的就不只是损失时间，还有制度还有没有继续要求同样忍耐的正当性。".to_string(),
                    seed.result_zh.to_string(),
                ],
                _ => vec![
                    format!("【谈判前夜】{}。", seed.angle_zh),
                    "所有高压聚落迟早都会碰到这一刻：产线依然想往前推，岗位上的人却第一次集体表示，继续运转不能再只靠旧方式透支下去。那一刻到来时，新闻里的关键词就会从调度、效率和补位，转成对峙、让步与谁先眨眼。".to_string(),
                    "对外看，这像是一场停工；对内看，它更像是一份迟到已久的账单终于被摊在桌面上。每一个拒绝继续的人，都在把原本私下承受的成本翻译成可以被全体看见的公共代价。".to_string(),
                    "这也是为什么劳工新闻会迅速扩散：它让太多人第一次意识到，自己以为只能单独忍受的东西，其实早就构成了共同处境。".to_string(),
                    seed.result_zh.to_string(),
                ],
            };
            Some(join_article_zh(source, paragraphs, closer))
        }
        NewsStyle::Rumor => {
            let paragraphs = match variant_slot(variant, 1, 4) {
                0 => vec![
                    format!("【夜间追踪】{}。", seed.angle_zh),
                    format!("{}消息最早总在工棚角落、排水沟边和夜班宿舍门口出现，等到管理层准备回应时，整片区域往往已经人人都能说上一版。", seed.focus_zh),
                    "真正让人不安的并不是故事离奇，而是每个讲述者都坚称自己只是转述了另一个更可靠的目击者。".to_string(),
                    "这类传闻一旦绑定具体地点，就会迅速从取笑材料变成夜班工人绕路、结伴和失眠的现实理由。".to_string(),
                    seed.result_zh.to_string(),
                ],
                1 => vec![
                    format!("【怪谈档案】{}。", seed.angle_zh),
                    "流言的扩散速度几乎总快过证据本身：有人听到、有人看见、有人说自己认识真正看见的人，故事就这么长出了越来越稳的骨架。".to_string(),
                    "最让人头皮发麻的从来不是单一版本，而是几条彼此并未商量过的叙述，偏偏会在最要命的细节上互相对上。".to_string(),
                    "管理层通常不愿正面承认这类怪谈，因为一旦正式开口，它就会立刻从闲话升级成公共事件。".to_string(),
                    seed.result_zh.to_string(),
                ],
                2 => vec![
                    format!("【边角消息】{}。", seed.angle_zh),
                    "传闻最顽固的时候，往往不是证据最多的时候，而是每个人都已经在脑子里替它补完了空白。".to_string(),
                    "于是夜里的脚步声、排水井的回音、角落里晃过去的影子，都会被重新解释成同一个故事的旁证。".to_string(),
                    "那些原本不信的人，也会因为身边所有人都开始讲得太顺，而逐渐怀疑自己是不是漏掉了什么。".to_string(),
                    seed.result_zh.to_string(),
                ],
                _ => vec![
                    format!("【深夜来信】{}。", seed.angle_zh),
                    "这类故事之所以会留下来，不是因为它最可怕，而是因为它总能在现实里找到一小块足够让人犹豫的影子。".to_string(),
                    "一旦有人开始结伴经过同一段路、绕开同一片区域、在同一个时刻压低声音，怪谈就已经赢了一半。".to_string(),
                    "在这座聚落里，都市传说并不只是讲给别人听的，它还会反过来改变人们晚上怎么走路、怎么值班、怎么睡觉。".to_string(),
                    seed.result_zh.to_string(),
                ],
            };
            Some(join_article_zh(source, paragraphs, closer))
        }
        NewsStyle::Festival => {
            let paragraphs = match variant_slot(variant, 1, 4) {
                0 => vec![
                    format!("【活动现场】{}。", seed.angle_zh),
                    "和产线上的秩序感不同，这类活动的热度几乎总是从混乱开始：先有人驻足，再有人起哄，最后连本来打算回宿舍的人都被拖进人群。".to_string(),
                    "真正让管理层难办的不是热闹本身，而是热闹居然确实有效。疲惫、抱怨和紧绷情绪会在这种夜里短暂退后一步，让聚落看起来像个还记得如何快乐的地方。".to_string(),
                    "于是原本只是临时试办的小节目，很快就会被人追问下一次什么时候再来。".to_string(),
                    seed.result_zh.to_string(),
                ],
                1 => vec![
                    format!("【文娱版】{}。", seed.angle_zh),
                    "观众并不在乎节目是否专业，他们在乎的是终于有一件事不需要围着配给、产线和事故转。".to_string(),
                    "当笑声足够密集时，聚落甚至会短暂忘记自己是靠高压和调度维持起来的，这正是活动新闻会在这里持续受欢迎的原因。".to_string(),
                    "从墙报到宿舍闲谈，几乎所有人都在讨论谁表现最好、谁最丢脸、谁又意外出了圈。".to_string(),
                    seed.result_zh.to_string(),
                ],
                2 => vec![
                    format!("【流行观察】{}。", seed.angle_zh),
                    "热度最先表现为围观，然后迅速变成模仿：有人学着同样的唱法、打扮、笑话和表演节奏，仿佛一个晚上就能长出自己的小型流行文化。".to_string(),
                    "对聚落来说，文娱并不是纯粹的额外装饰，它更像是一种证明：高压生活并没有完全压碎人们主动制造气氛的能力。".to_string(),
                    "这也是为什么每一次活动之后，真正被留下来的不只是节目单，而是新的谈资、新的脸孔和新的受欢迎者。".to_string(),
                    seed.result_zh.to_string(),
                ],
                _ => vec![
                    format!("【夜报副刊】{}。", seed.angle_zh),
                    "活动一旦成功，最先改变的通常不是制度，而是步伐：人们会走得更慢，停得更久，愿意在同一个地方多聊上几句。".to_string(),
                    "那些原本只在工作关系里彼此认识的人，也会因为一个节目、一个摊位或者一段表演突然拥有新的社交入口。".to_string(),
                    "于是一次热闹结束后，留下来的往往不只是回忆，还有一整片区域在第二天都显得稍微轻一点的空气。".to_string(),
                    seed.result_zh.to_string(),
                ],
            };
            Some(join_article_zh(source, paragraphs, closer))
        }
        _ => None,
    }
}

fn render_full_template_en(seed: &ScenarioSeed, variant: usize) -> Option<String> {
    let source = source_note_en(seed, variant);
    let closer = if should_include_closer(variant) {
        Some(stylize_closer_en(
            seed,
            closing_line_en(seed.stage, variant),
            variant,
        ))
    } else {
        None
    };

    if seed.id.contains("upload_queue_scandal") {
        let paragraphs = match variant_slot(variant, 1, 4) {
            0 => vec![
                format!("[Consensus Net Uproar] {}.", seed.angle_en),
                "Endgame society is skilled at producing one illusion above all others: the more advanced the system becomes, the more allocation appears natural; the more complicated the queue, the more objective the ordering seems. That is exactly why reports of favoritism, hidden approvals, and line-cutting inside the upload queue instantly turn a calm interface back into an old-fashioned market argument.".to_string(),
                "What wounds people is not the slot alone but the collapse of a promise. If everyone is asked to trust the procedure, then the procedure ought to look harder to rewrite privately than the patronage systems it claimed to replace.".to_string(),
                "From that point onward, speculation about who was waved through early, who received backing, and who possessed a private route around the waiting list spreads from technical channels into dormitories, compute posts, and every mind still waiting its turn. The most advanced institution reveals the oldest political emotion underneath it.".to_string(),
                seed.result_en.to_string(),
            ],
            1 => vec![
                format!("[Queue Scandal] {}.", seed.angle_en),
                "Upload eligibility was sold as an order above private relationship, so any suggestion that some people did not really have to wait will ignite more anger than ordinary gossip ever could. The surface argument is fairness; the deeper panic is simpler: if even this channel can be quietly touched, then what exactly remains beyond negotiation.".to_string(),
                "A great deal of endgame legitimacy rests on process credibility. Once that process begins to look like old privilege in a cleaner interface, every surrounding claim about consensus, transition, and future qualification starts sounding less like promise and more like propaganda.".to_string(),
                "That is why the story never stays inside a single list. It drags the settlement back to a familiar question: the more abstract an institution becomes, does it bring ordinary people closer to justice, or merely make it harder to see who really decides the order.".to_string(),
                seed.result_en.to_string(),
            ],
            2 => vec![
                format!("[Endgame Tabloid] {}.", seed.angle_en),
                "Even in an era of highly networked consensus, the most contagious information is often not a systems upgrade but the suspicion that someone slipped ahead of everyone else. A tiny shift in queue position is clipped, reposted, interpreted, and enlarged until the entire settlement joins in collective detective work.".to_string(),
                "People start reexamining the invisible middle layers: recommendation rights, review gates, appended notes, provisional authorizations, and all the offices that claim they were only coordinating. The more the scandal is explained as technical adjustment, the more clearly it resembles a higher-grade version of favoritism.".to_string(),
                "The noise becomes so intense because the story proves something ancient has survived into the future unchanged: wherever access is scarce, any doorway into tomorrow will grow its own politics over who enters first.".to_string(),
                seed.result_en.to_string(),
            ],
            _ => vec![
                format!("[Politics of Waiting] {}.", seed.angle_en),
                "The upload queue was supposed to symbolize endgame order. People could accept a long wait as long as they believed waiting itself was shared. Once scandal enters the list, what breaks first is not patience but the belief that the delay is common and therefore bearable.".to_string(),
                "When the network starts asking who was favored, who was skipped, and who had access to unwritten doors, consensus reveals how fragile it really is. The advanced system did not eliminate gossip; it upgraded gossip into a live referendum on institutional credibility.".to_string(),
                "That is the irony endgame scandal always carries: people thought they had moved farther from the old politics of favoritism, only to find it reinstalled inside something more expensive, more abstract, and harder to blame.".to_string(),
                seed.result_en.to_string(),
            ],
        };
        return Some(join_article_en(source, paragraphs, closer));
    }

    if seed.id.contains("alien_whisper") || seed.id.contains("relay_blackout_gossip") {
        let paragraphs = match variant_slot(variant, 1, 4) {
            0 => vec![
                format!("[Far-Signal Rumor] {}.", seed.angle_en),
                "Endgame legends no longer resemble old fireside stories. They arrive with transcripts, blurred waveforms, and scraps of system residue that almost pass for evidence, moving from expedition channels into everybody's final conversation before sleep.".to_string(),
                "That is why rumors of alien life, talking echoes, or an extra breath in the blackout are harder to suppress than ordinary myths. People living in a society that has already seen consciousness networked and frontiers pushed outward are more willing to admit that cosmic-scale strangeness may actually be occurring.".to_string(),
                "The legend therefore stops being a low-level whisper and becomes something half technical, half devotional moving through the upper network. Everyone feels truth may be only one complete record away, so no one wants to discard it as a joke too early.".to_string(),
                seed.result_en.to_string(),
            ],
            1 => vec![
                format!("[Signal Archive] {}.", seed.angle_en),
                "The most durable endgame rumors often resemble unfinished reports: a few repeatedly transcribed anomalies, several disputed witness accounts, and one systems blackout no one can narrate cleanly after the fact. Taken apart they remain insufficient; taken together they keep an entire settlement awake.".to_string(),
                "What makes stories like this magnetic is the way they compress cosmos, machinery, and religious imagination onto the same page. You can call it noise, failure, or misreading, but as long as someone insists they truly heard an answer, the matter refuses to shrink back into a technical issue.".to_string(),
                "That is why higher-order societies often react to rumor so strangely: the more rational and system-dependent they become, the more eagerly they complete the unknown with explanations of enormous scale when the system itself begins to speak unclearly.".to_string(),
                seed.result_en.to_string(),
            ],
            2 => vec![
                format!("[After the Black Screen] {}.", seed.angle_en),
                "Every temporary blackout and every source-uncertain echo returns the same question to the crowd: if this age can network minds and push expeditions beyond the old surface, why should the next unexplained thing not also be farther away and stranger than anything the older world prepared us to name.".to_string(),
                "That is how people start hearing technical anomalies as cosmic whispers, reading delays as reply, and treating distorted images as traces left by something that recognized humanity before humanity recognized it.".to_string(),
                "What truly keeps people awake is not the phrase alien life by itself, but the growing sense that the inherited vocabulary used to separate malfunction, miracle, and contact may no longer be adequate.".to_string(),
                seed.result_en.to_string(),
            ],
            _ => vec![
                format!("[Cosmic Whisper] {}.", seed.angle_en),
                "At lower stages, legends spread by mouth alone. In the endgame they become more dangerous because they wear a serious surface: every rumor trails a screenshot, a log fragment, or a damaged relay note, which is enough to make even cautious readers look twice and wonder whether they are about to miss the first real door into a wider world.".to_string(),
                "That gives endgame rumor its peculiar power. No one dares fully endorse it, but no one wants to call it absurd while it still might be true. The more the consensus net circulates, the more the unknown expands into a shared emotion.".to_string(),
                "In the end the rumor does not need to prove that something cosmic is really there. It succeeds by making the whole settlement look upward, listen harder, and wait for the next signal to speak again.".to_string(),
                seed.result_en.to_string(),
            ],
        };
        return Some(join_article_en(source, paragraphs, closer));
    }

    match detect_news_style(seed) {
        NewsStyle::Accident => {
            let paragraphs = match variant_slot(variant, 1, 4) {
                0 => vec![
                    format!("[Accident Bulletin] {}.", seed.angle_en),
                    "What collapses first in a major accident is rarely just one machine. It is the assumption that normal sequence can still connect to the next step, and once that assumption fails, sirens, shouting, stoppage, and improvised clearing all arrive at once.".to_string(),
                    "Afterward the floor does not become peaceful so much as forcibly ordered. Surviving crews begin recounting names, injuries, routes, and absences, and everyone on site understands this is no longer a night that can be filed away as a local fluctuation.".to_string(),
                    "That is what gives disaster coverage its weight. The casualties matter, but so does the way an accident tears open the settlement's safety fiction and forces every remaining worker to recalculate how near the next alarm might be.".to_string(),
                    seed.result_en.to_string(),
                ],
                1 => vec![
                    format!("[Field Investigation] {}.", seed.angle_en),
                    "Once the barriers go up, arguments over responsibility, fatigue, maintenance gaps, and dispatch failure begin almost immediately. People do not need a full report to know the event will linger; the sealed zones and rerouted lanes already say enough.".to_string(),
                    "Inside a high-pressure settlement, an accident is rarely just a technical breakdown. More often it is prolonged exhaustion finally becoming visible in a form no one can pretend not to see.".to_string(),
                    "Management can lower the tone, delay the details, and postpone accountability to a later notice, but the air on the scene usually announces the truth sooner than any bulletin: the old operating rhythm has already exacted its price.".to_string(),
                    seed.result_en.to_string(),
                ],
                2 => vec![
                    format!("[After the Survivors] {}.", seed.angle_en),
                    "The longest part often begins after the impact itself. Cordon lines, count sheets, repeated stretcher runs, and the refusal of ordinary foot traffic to resume all drag the district into a slower and more exhausting kind of paralysis.".to_string(),
                    "What many people remember later is not the moment of rupture or collapse, but the sensation that familiar stations had changed meaning. Routine actions begin to carry caution, because routine no longer feels innocent.".to_string(),
                    "By that point accident reporting is no longer just documenting damage. It is documenting how trust leaks away from the line, from the watch crews, and from the language management uses to describe the line afterward.".to_string(),
                    seed.result_en.to_string(),
                ],
                _ => vec![
                    format!("[Tracking Report] {}.", seed.angle_en),
                    "Every major accident forces the settlement to answer the same question again: was the method that kept output moving evidence of a functioning system, or merely a way of deferring the real cost until it arrived all at once?".to_string(),
                    "From rescue and stoppage to cleanup and rerouting, an accident folds together pressures that were previously handled apart, making fatigue, equipment limits, administrative delay, and disposable labor visible on the same page.".to_string(),
                    "That is why disaster coverage never stays on the floor alone. It follows people into dormitories, schedules, and the next day's gossip until the settlement accepts that the event cannot be archived as a harmless exception.".to_string(),
                    seed.result_en.to_string(),
                ],
            };
            Some(join_article_en(source, paragraphs, closer))
        }
        NewsStyle::Labor => {
            let paragraphs = match variant_slot(variant, 1, 4) {
                0 => vec![
                    format!("[Walkout Floor] {}.", seed.angle_en),
                    "What a walkout changes first is not always whether every machine stops, but whether orders still carry their old automatic force. The moment one group refuses motion, everyone else sees that silence, delay, and standing still together can form a language of their own.".to_string(),
                    "For crews under prolonged pressure, a strike or short stoppage is rarely sudden emotion. It is usually many rounds of ration cuts, schedule strain, and swallowed resentment compressed into one visible public moment.".to_string(),
                    "Once the confrontation reaches the news stream, management can no longer describe it as the complaint of a few stations, because the settlement has already seen the deeper fact: order began loosening before negotiation ever formally began.".to_string(),
                    seed.result_en.to_string(),
                ],
                1 => vec![
                    format!("[Labor Tracking] {}.", seed.angle_en),
                    "Scenes like this are not always loud. Often they are dangerous precisely because they are still: the schedules remain posted, the stations remain visible, yet more and more workers begin treating refusal itself as a way to confirm they are not enduring the pressure alone.".to_string(),
                    "That is what gives labor reporting its force. It gathers grievances usually scattered across canteens, dormitories, and shift handoffs, then returns them to the settlement as one public fact impossible to misrecognize.".to_string(),
                    "The true management problem is not just interrupted throughput. It is that conflict like this forces a wider question into view: which sacrifices were treated as default, and who was always expected to swallow them first?".to_string(),
                    seed.result_en.to_string(),
                ],
                2 => vec![
                    format!("[Crew Standoff] {}.", seed.angle_en),
                    "At the beginning there may not even be a unified slogan. One worker sets down a tool, another refuses to cover an extra post, and someone else says plainly they will not carry the next overtime cycle. In a matter of minutes, scattered acts harden into a single scene.".to_string(),
                    "Stoppage coverage is often harder to contain than accident coverage because it exposes not a single mistake but an operating method. Accidents can be investigated; labor confrontation asks why so many people were unwilling to keep moving if the arrangement was truly acceptable.".to_string(),
                    "Once that question is public, the settlement starts recalculating not only lost hours but the legitimacy of demanding the same endurance again.".to_string(),
                    seed.result_en.to_string(),
                ],
                _ => vec![
                    format!("[Night Before Negotiation] {}.", seed.angle_en),
                    "Every high-pressure settlement reaches this threshold eventually: the line still wants to move forward, but the people on it collectively decide the old method of extracting motion has reached its limit. When that happens, the vocabulary of dispatch gives way to the vocabulary of standoff, concession, and who blinks first.".to_string(),
                    "From the outside it looks like a stoppage. From the inside it feels more like a bill, long overdue, finally being laid flat on the table. Each worker who refuses to continue is translating a private burden into a public cost the whole settlement can now see.".to_string(),
                    "That is why labor stories spread so quickly: they make people realize that what felt individually bearable was already a shared condition.".to_string(),
                    seed.result_en.to_string(),
                ],
            };
            Some(join_article_en(source, paragraphs, closer))
        }
        NewsStyle::Rumor => {
            let paragraphs = match variant_slot(variant, 1, 4) {
                0 => vec![
                    format!("[After-Hours Tracking] {}.", seed.angle_en),
                    format!("Stories like {} rarely begin in public. They start in corners, drains, night dormitories, and low conversations that spread faster than anyone can formally deny them.", seed.focus_en),
                    "What unsettles the settlement is not the strangeness of the tale by itself, but the way every speaker insists they only heard it from someone even more reliable.".to_string(),
                    "Once a rumor binds itself to a specific corridor, drain, or shift route, it stops being entertainment and begins altering how people move after dark.".to_string(),
                    seed.result_en.to_string(),
                ],
                1 => vec![
                    format!("[Rumor File] {}.", seed.angle_en),
                    "The speed of transmission is often the first clue that a story has escaped ordinary gossip. By the time anyone thinks to verify it, the settlement has already built three competing versions and treats all of them as half-true.".to_string(),
                    "The most durable legends are not the loudest ones; they are the ones that attach themselves to one detail no listener is willing to dismiss completely.".to_string(),
                    "Officials prefer not to answer directly, because direct answers convert rumors into recognized public incidents almost at once.".to_string(),
                    seed.result_en.to_string(),
                ],
                2 => vec![
                    format!("[Whisper Wire] {}.", seed.angle_en),
                    "A rumor reaches maturity when people begin filling in the blanks for it without being asked. At that point the settlement no longer needs proof to keep the story alive; routine itself becomes the carrier.".to_string(),
                    "Footsteps, echoes, shadows, and late shift fatigue all become retroactive evidence once enough people agree on what they fear they saw.".to_string(),
                    "Even skeptics start to soften when the same place accumulates too many stories, too many evasions, and too many careful detours.".to_string(),
                    seed.result_en.to_string(),
                ],
                _ => vec![
                    format!("[Midnight Dispatch] {}.", seed.angle_en),
                    "Legends like this persist not because they are the wildest available explanation, but because they leave just enough room for the listener to hesitate.".to_string(),
                    "The moment crews begin walking in pairs, speaking more quietly, or avoiding one route over another, the legend has already crossed out of fiction and into behavior.".to_string(),
                    "That is what gives urban legend real force inside a settlement like this: it changes habits before it ever proves itself.".to_string(),
                    seed.result_en.to_string(),
                ],
            };
            Some(join_article_en(source, paragraphs, closer))
        }
        NewsStyle::Festival => {
            let paragraphs = match variant_slot(variant, 1, 4) {
                0 => vec![
                    format!("[On the Ground] {}.", seed.angle_en),
                    "Events of this kind usually begin in near-accident: too many people stop at once, somebody laughs too loudly, and an improvised crowd forms before anyone has agreed on whether the thing is officially happening.".to_string(),
                    "What makes them sticky is not polish but relief. For a short time, the settlement is allowed to revolve around attention, embarrassment, applause, and delight rather than rations, injuries, and throughput.".to_string(),
                    "That is why a small performance, market, or parade can return the next morning as the most discussed subject on every wall sheet in the district.".to_string(),
                    seed.result_en.to_string(),
                ],
                1 => vec![
                    format!("[Culture Desk] {}.", seed.angle_en),
                    "The audience does not need refinement; it needs permission to look at something that is not another queue, warning sign, or production schedule.".to_string(),
                    "In a settlement built under pressure, public amusement works as proof that exhaustion has not yet claimed the entire emotional field.".to_string(),
                    "That is why these stories never stay confined to the event itself. They spill outward into imitation, gossip, and fresh argument over who mattered most.".to_string(),
                    seed.result_en.to_string(),
                ],
                2 => vec![
                    format!("[Trending Watch] {}.", seed.angle_en),
                    "Popularity is often visible first in imitation: a line repeated the next morning, a costume copied in the dorm blocks, a joke that suddenly belongs to everyone.".to_string(),
                    "Once that happens, the event has already moved past leisure and into social memory. It becomes one of the rare moments the settlement can describe itself without using the language of damage control.".to_string(),
                    "Even management hesitates at that point, because suppressing a successful event often costs more morale than the event itself ever could.".to_string(),
                    seed.result_en.to_string(),
                ],
                _ => vec![
                    format!("[Weekend Feature] {}.", seed.angle_en),
                    "After successful nights like this, the visible changes are almost small enough to miss: people walk slower, linger longer, and discover they can talk to one another outside the grammar of utility.".to_string(),
                    "That shift matters. In a high-pressure settlement, celebration is never just decoration; it is one of the few surviving methods for manufacturing collective ease.".to_string(),
                    "For that reason the real archive of an event is not the program itself, but the names, jokes, and faces that remain in circulation after the lights are gone.".to_string(),
                    seed.result_en.to_string(),
                ],
            };
            Some(join_article_en(source, paragraphs, closer))
        }
        _ => None,
    }
}

fn join_article_zh(
    source: Option<String>,
    mut paragraphs: Vec<String>,
    closer: Option<String>,
) -> String {
    if let Some(source) = source {
        paragraphs.insert(1, source);
    }
    if let Some(closer) = closer {
        paragraphs.push(closer);
    }
    paragraphs.join("")
}

fn join_article_en(
    source: Option<String>,
    mut paragraphs: Vec<String>,
    closer: Option<String>,
) -> String {
    if let Some(source) = source {
        paragraphs.insert(1, source);
    }
    if let Some(closer) = closer {
        paragraphs.push(closer);
    }
    paragraphs.join(" ")
}

fn compose_body_zh(
    seed: &ScenarioSeed,
    _ctx: &EventContext,
    _worker_name: Option<&str>,
    variant: usize,
) -> String {
    if let Some(full_article) = render_full_template_zh(seed, variant) {
        return full_article;
    }

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
    let field = stylize_field_zh(seed, field_line_zh(seed.category, variant), variant);
    let management =
        stylize_management_zh(seed, management_line_zh(seed.category, variant), variant);
    let observer = stylize_observer_zh(seed, observer_line_zh(seed.category, variant), variant);
    let opening_angle = trim_sentence_end_zh(&seed.angle_zh);
    let mut parts = vec![
        format!("{}{}。", opener, opening_angle),
        field,
        management,
        observer,
        seed.result_zh.to_string(),
    ];

    if let Some(source_note) = source_note_zh(seed, variant) {
        parts.insert(1, source_note);
    }

    if should_include_closer(variant) {
        parts.push(stylize_closer_zh(
            seed,
            closing_line_zh(seed.stage, variant),
            variant,
        ));
    }

    parts.join("")
}

fn compose_body_en(
    seed: &ScenarioSeed,
    _ctx: &EventContext,
    _worker_name: Option<&str>,
    variant: usize,
) -> String {
    if let Some(full_article) = render_full_template_en(seed, variant) {
        return full_article;
    }

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
    let field = stylize_field_en(seed, field_line_en(seed.category, variant), variant);
    let management =
        stylize_management_en(seed, management_line_en(seed.category, variant), variant);
    let observer = stylize_observer_en(seed, observer_line_en(seed.category, variant), variant);
    let mut parts = vec![
        opener.to_string(),
        seed.angle_en.to_string(),
        field,
        management,
        observer,
        seed.result_en.to_string(),
    ];

    if let Some(source_note) = source_note_en(seed, variant) {
        parts.insert(1, source_note);
    }

    if should_include_closer(variant) {
        parts.push(stylize_closer_en(
            seed,
            closing_line_en(seed.stage, variant),
            variant,
        ));
    }

    parts.join(" ")
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
            health: 100.0,
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

fn injure_random_workers(workers: &mut Vec<Worker>, injury_count: usize) {
    let limb_slots = [
        LimbSlot::LeftArm,
        LimbSlot::RightArm,
        LimbSlot::LeftLeg,
        LimbSlot::RightLeg,
    ];
    let mut local_rng = rng();

    for _ in 0..injury_count {
        let candidates: Vec<usize> = workers
            .iter()
            .enumerate()
            .filter(|(_, worker)| worker.missing_limbs.len() < limb_slots.len())
            .map(|(index, _)| index)
            .collect();
        let Some(&worker_index) = candidates.choose(&mut local_rng) else {
            break;
        };

        let available_limbs: Vec<LimbSlot> = limb_slots
            .iter()
            .copied()
            .filter(|limb| !workers[worker_index].missing_limbs.contains(limb))
            .collect();
        let Some(&lost_limb) = available_limbs.choose(&mut local_rng) else {
            continue;
        };

        workers[worker_index].missing_limbs.push(lost_limb);
        workers[worker_index].health = (workers[worker_index].health - 25.0).clamp(0.0, 100.0);
        workers[worker_index].happiness =
            (workers[worker_index].happiness - 10.0).clamp(0.0, 100.0);
        workers[worker_index].stress = (workers[worker_index].stress + 18.0).clamp(0.0, 100.0);
        workers[worker_index].fatigue = (workers[worker_index].fatigue + 12.0).clamp(0.0, 100.0);
    }
}

fn kill_random_workers(workers: &mut Vec<Worker>, death_count: usize) {
    let mut local_rng = rng();
    for _ in 0..death_count.min(workers.len()) {
        let candidates: Vec<usize> = (0..workers.len()).collect();
        let Some(&worker_index) = candidates.choose(&mut local_rng) else {
            break;
        };
        workers.remove(worker_index);
    }
}

fn apply_effect(effect: EventEffect, state: &mut GameState, workers: &mut Vec<Worker>) {
    match effect {
        EventEffect::None => {}
        EventEffect::AddCorpse(amount) => {
            state.add_resource(ResourceType::Corpse, amount);
            kill_random_workers(workers, amount.floor() as usize);
            injure_random_workers(workers, 1);
        }
        EventEffect::AddMaggot(amount) => state.add_resource(ResourceType::Maggot, amount),
        EventEffect::AddCorpseAndMaggot { corpse, maggot } => {
            state.add_resource(ResourceType::Corpse, corpse);
            state.add_resource(ResourceType::Maggot, maggot);
            kill_random_workers(workers, corpse.floor() as usize);
            injure_random_workers(workers, 1);
        }
        EventEffect::ReduceFoodAndAddCorpse { food, corpse } => {
            let current_food = state.get_resource(ResourceType::Food);
            state.set_resource(ResourceType::Food, (current_food - food).max(0.0));
            state.add_resource(ResourceType::Corpse, corpse);
            kill_random_workers(workers, corpse.floor() as usize);
            injure_random_workers(workers, 1);
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
    workers: &mut Vec<Worker>,
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

    apply_effect(seed.effect, state, workers);

    let worker = {
        let mut local_rng = rng();
        workers.choose(&mut local_rng)
    };

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
            health: 100.0,
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
        let mut workers = vec![sample_worker()];

        let event = maybe_generate_event(
            &mut state,
            &mut workers,
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
