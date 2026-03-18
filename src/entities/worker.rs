use serde::{Deserialize, Serialize};

/// 性别枚举
#[derive(Serialize, Deserialize, Clone, Copy, Debug, PartialEq, Default)]
pub enum Gender {
    #[default]
    Other,
    Male,
    Female,
}

/// 爱好枚举
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum Hobby {
    Reading,     // 阅读
    Gaming,      // 游戏
    Sports,      // 运动
    Music,       // 音乐
    Art,         // 艺术
    Cooking,     // 烹饪
    Gardening,   // 园艺
    Fishing,     // 钓鱼
    Traveling,   // 旅行
    Photography, // 摄影
}

impl Default for Hobby {
    fn default() -> Self {
        Hobby::Reading
    }
}

#[derive(Serialize, Deserialize, Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum LimbSlot {
    LeftArm,
    RightArm,
    LeftLeg,
    RightLeg,
}

/// 特性枚举
#[derive(Serialize, Deserialize, Clone, Copy, Debug, PartialEq, Default)]
pub enum Trait {
    // 效率类
    Diligent, // 勤奋 +15%效率
    #[default]
    Hardworking, // 努力 +10%效率
    Lazy,     // 懒惰 -10%效率
    Efficient, // 高效 +20%效率
    Slow,     // 缓慢 -15%效率
    // 学习类
    Intelligent, // 聪明 +20% XP
    FastLearner, // 快速学习 +15% XP
    Genius,      // 天才 +30% XP
    SlowLearner, // 慢学 -10% XP
    // 社交类
    Social,      // 社交 +5%团队效率
    Loner,       // 孤僻 -5%但有专注加成
    Charismatic, // 魅力 +10%团队效率
    Shy,         // 害羞 -5%团队效率
    // 时间类
    NightOwl,  // 夜猫子 夜间+20%
    EarlyBird, // 早起者 白天+20%
    // 负面类
    Clumsy,    // 笨拙 -10%
    Forgetful, // 健忘 -5%
    Careless,  // 粗心 -8%
    // 正面类
    Careful,     // 细心 +5%
    Creative,    // 创意 +10%
    Persevering, // 坚持不懈 +15%
    Optimistic,  // 乐观 +5%心情恢复
}

/// 特性效果结构
#[derive(Clone, Debug, PartialEq)]
pub struct TraitEffect {
    pub efficiency_bonus: f64, // 效率加成 (-0.15 到 +0.20)
    pub xp_bonus: f64,         // XP加成 (-0.10 到 +0.30)
    pub team_bonus: f64,       // 团队加成 (-0.05 到 +0.10)
    pub time_multiplier: f64,  // 时间倍率 (夜间/白天)
    pub happiness_bonus: f64,  // 心情加成
}

impl Default for TraitEffect {
    fn default() -> Self {
        TraitEffect {
            efficiency_bonus: 0.0,
            xp_bonus: 0.0,
            team_bonus: 0.0,
            time_multiplier: 1.0,
            happiness_bonus: 0.0,
        }
    }
}

impl Trait {
    /// 获取特性的效果
    pub fn get_effect(&self) -> TraitEffect {
        match self {
            // 效率类
            Trait::Diligent => TraitEffect {
                efficiency_bonus: 0.15,
                xp_bonus: 0.0,
                team_bonus: 0.0,
                time_multiplier: 1.0,
                happiness_bonus: 0.0,
            },
            Trait::Hardworking => TraitEffect {
                efficiency_bonus: 0.10,
                xp_bonus: 0.0,
                team_bonus: 0.0,
                time_multiplier: 1.0,
                happiness_bonus: 0.0,
            },
            Trait::Lazy => TraitEffect {
                efficiency_bonus: -0.10,
                xp_bonus: 0.0,
                team_bonus: 0.0,
                time_multiplier: 1.0,
                happiness_bonus: -5.0,
            },
            Trait::Efficient => TraitEffect {
                efficiency_bonus: 0.20,
                xp_bonus: 0.0,
                team_bonus: 0.0,
                time_multiplier: 1.0,
                happiness_bonus: 0.0,
            },
            Trait::Slow => TraitEffect {
                efficiency_bonus: -0.15,
                xp_bonus: 0.0,
                team_bonus: 0.0,
                time_multiplier: 1.0,
                happiness_bonus: -3.0,
            },
            // 学习类
            Trait::Intelligent => TraitEffect {
                efficiency_bonus: 0.0,
                xp_bonus: 0.20,
                team_bonus: 0.0,
                time_multiplier: 1.0,
                happiness_bonus: 0.0,
            },
            Trait::FastLearner => TraitEffect {
                efficiency_bonus: 0.0,
                xp_bonus: 0.15,
                team_bonus: 0.0,
                time_multiplier: 1.0,
                happiness_bonus: 0.0,
            },
            Trait::Genius => TraitEffect {
                efficiency_bonus: 0.0,
                xp_bonus: 0.30,
                team_bonus: 0.0,
                time_multiplier: 1.0,
                happiness_bonus: 0.0,
            },
            Trait::SlowLearner => TraitEffect {
                efficiency_bonus: 0.0,
                xp_bonus: -0.10,
                team_bonus: 0.0,
                time_multiplier: 1.0,
                happiness_bonus: -2.0,
            },
            // 社交类
            Trait::Social => TraitEffect {
                efficiency_bonus: 0.0,
                xp_bonus: 0.0,
                team_bonus: 0.05,
                time_multiplier: 1.0,
                happiness_bonus: 3.0,
            },
            Trait::Loner => TraitEffect {
                efficiency_bonus: 0.0,
                xp_bonus: 0.0,
                team_bonus: -0.05,
                time_multiplier: 1.0,
                happiness_bonus: -2.0,
            },
            Trait::Charismatic => TraitEffect {
                efficiency_bonus: 0.0,
                xp_bonus: 0.0,
                team_bonus: 0.10,
                time_multiplier: 1.0,
                happiness_bonus: 5.0,
            },
            Trait::Shy => TraitEffect {
                efficiency_bonus: 0.0,
                xp_bonus: 0.0,
                team_bonus: -0.05,
                time_multiplier: 1.0,
                happiness_bonus: -3.0,
            },
            // 时间类
            Trait::NightOwl => TraitEffect {
                efficiency_bonus: 0.0,
                xp_bonus: 0.0,
                team_bonus: 0.0,
                time_multiplier: 1.20, // 夜间+20%
                happiness_bonus: 0.0,
            },
            Trait::EarlyBird => TraitEffect {
                efficiency_bonus: 0.0,
                xp_bonus: 0.0,
                team_bonus: 0.0,
                time_multiplier: 1.20, // 白天+20%
                happiness_bonus: 0.0,
            },
            // 负面类
            Trait::Clumsy => TraitEffect {
                efficiency_bonus: -0.10,
                xp_bonus: 0.0,
                team_bonus: 0.0,
                time_multiplier: 1.0,
                happiness_bonus: -3.0,
            },
            Trait::Forgetful => TraitEffect {
                efficiency_bonus: -0.05,
                xp_bonus: 0.0,
                team_bonus: 0.0,
                time_multiplier: 1.0,
                happiness_bonus: -2.0,
            },
            Trait::Careless => TraitEffect {
                efficiency_bonus: -0.08,
                xp_bonus: 0.0,
                team_bonus: 0.0,
                time_multiplier: 1.0,
                happiness_bonus: -4.0,
            },
            // 正面类
            Trait::Careful => TraitEffect {
                efficiency_bonus: 0.05,
                xp_bonus: 0.0,
                team_bonus: 0.0,
                time_multiplier: 1.0,
                happiness_bonus: 2.0,
            },
            Trait::Creative => TraitEffect {
                efficiency_bonus: 0.10,
                xp_bonus: 0.05,
                team_bonus: 0.0,
                time_multiplier: 1.0,
                happiness_bonus: 5.0,
            },
            Trait::Persevering => TraitEffect {
                efficiency_bonus: 0.15,
                xp_bonus: 0.10,
                team_bonus: 0.0,
                time_multiplier: 1.0,
                happiness_bonus: 3.0,
            },
            Trait::Optimistic => TraitEffect {
                efficiency_bonus: 0.0,
                xp_bonus: 0.0,
                team_bonus: 0.0,
                time_multiplier: 1.0,
                happiness_bonus: 8.0, // 心情恢复快
            },
        }
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Worker {
    // 基础字段
    pub name: String,
    pub skills: String,
    pub background: String,
    pub preferences: String,
    pub assigned_building: Option<String>,
    pub level: u32,
    pub efficiency_multiplier: f64,
    pub xp: f64,
    pub xp_to_next_level: f64,
    // 新增字段
    #[serde(default)]
    pub gender: Gender,
    #[serde(default)]
    pub hobbies: Vec<Hobby>,
    #[serde(default)]
    pub primary_trait: Trait,
    #[serde(default)]
    pub secondary_traits: Vec<Trait>,
    #[serde(default = "default_happiness")]
    pub happiness: f64,
    #[serde(default)]
    pub hunger: f64, // 饥饿度 0-100，0=饱食，100=饿死
    #[serde(default = "default_focus")]
    pub focus: f64,
    #[serde(default = "default_fatigue")]
    pub fatigue: f64,
    #[serde(default = "default_stress")]
    pub stress: f64,
    #[serde(default)]
    pub missing_limbs: Vec<LimbSlot>,
    #[serde(default)]
    pub maggot_limbs: Vec<LimbSlot>,
    #[serde(default)]
    pub is_hungry: bool, // 是否饥饿
    #[serde(default)]
    pub starvation_start_time: f64, // 开始饥饿的时间戳
}

fn default_happiness() -> f64 {
    50.0
}

fn default_focus() -> f64 {
    55.0
}

fn default_fatigue() -> f64 {
    10.0
}

fn default_stress() -> f64 {
    15.0
}

impl Worker {
    /// 创建新工人的便捷方法
    pub fn new(name: &str, skills: &str, background: &str, preferences: &str) -> Self {
        Worker {
            name: name.to_string(),
            skills: skills.to_string(),
            background: background.to_string(),
            preferences: preferences.to_string(),
            assigned_building: None,
            level: 1,
            efficiency_multiplier: 1.0,
            xp: 0.0,
            xp_to_next_level: 100.0,
            gender: Gender::default(),
            hobbies: Vec::new(),
            primary_trait: Trait::default(),
            secondary_traits: Vec::new(),
            happiness: 50.0,
            hunger: 0.0, // 初始不饿
            focus: default_focus(),
            fatigue: default_fatigue(),
            stress: default_stress(),
            missing_limbs: Vec::new(),
            maggot_limbs: Vec::new(),
            is_hungry: false,
            starvation_start_time: 0.0,
        }
    }

    /// 创建完整工人的方法（包含所有新字段）
    pub fn new_full(
        name: &str,
        skills: &str,
        background: &str,
        preferences: &str,
        gender: Gender,
        hobbies: Vec<Hobby>,
        primary_trait: Trait,
        secondary_traits: Vec<Trait>,
    ) -> Self {
        Worker {
            name: name.to_string(),
            skills: skills.to_string(),
            background: background.to_string(),
            preferences: preferences.to_string(),
            assigned_building: None,
            level: 1,
            efficiency_multiplier: 1.0,
            xp: 0.0,
            xp_to_next_level: 100.0,
            gender,
            hobbies,
            primary_trait,
            secondary_traits,
            happiness: 50.0,
            hunger: 0.0, // 初始不饿
            focus: default_focus(),
            fatigue: default_fatigue(),
            stress: default_stress(),
            missing_limbs: Vec::new(),
            maggot_limbs: Vec::new(),
            is_hungry: false,
            starvation_start_time: 0.0,
        }
    }

    /// 添加爱好（最多2个）

    /// 添加爱好（最多2个）
    pub fn add_hobby(&mut self, hobby: Hobby) {
        if self.hobbies.len() < 2 {
            self.hobbies.push(hobby);
        }
    }

    /// 添加次特性（最多2个）
    pub fn add_secondary_trait(&mut self, trait_type: Trait) {
        if self.secondary_traits.len() < 2 {
            self.secondary_traits.push(trait_type);
        }
    }

    /// 计算工人的总特性效果
    /// 主特性效果100%，次特性效果50%
    pub fn calculate_trait_effects(&self) -> TraitEffect {
        let primary = self.primary_trait.get_effect();

        let mut total = TraitEffect {
            efficiency_bonus: primary.efficiency_bonus,
            xp_bonus: primary.xp_bonus,
            team_bonus: primary.team_bonus,
            time_multiplier: primary.time_multiplier,
            happiness_bonus: primary.happiness_bonus,
        };

        // 次特性效果减半（50%）
        for trait_type in &self.secondary_traits {
            let effect = trait_type.get_effect();
            total.efficiency_bonus += effect.efficiency_bonus * 0.5;
            total.xp_bonus += effect.xp_bonus * 0.5;
            total.team_bonus += effect.team_bonus * 0.5;
            total.time_multiplier += (effect.time_multiplier - 1.0) * 0.5;
            total.happiness_bonus += effect.happiness_bonus * 0.5;
        }

        total
    }

    /// 获取最终效率倍率（包含特性效果）
    pub fn get_total_efficiency(&self) -> f64 {
        let base = self.efficiency_multiplier;
        let trait_effect = self.calculate_trait_effects();
        base * (1.0 + trait_effect.efficiency_bonus)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_trait_effect_default() {
        let effect = TraitEffect::default();
        assert_eq!(effect.efficiency_bonus, 0.0);
        assert_eq!(effect.xp_bonus, 0.0);
        assert_eq!(effect.team_bonus, 0.0);
        assert_eq!(effect.time_multiplier, 1.0);
        assert_eq!(effect.happiness_bonus, 0.0);
    }

    #[test]
    fn test_trait_get_effect_efficiency() {
        // 测试效率类特性
        let diligent = Trait::Diligent.get_effect();
        assert_eq!(diligent.efficiency_bonus, 0.15);
        assert_eq!(diligent.xp_bonus, 0.0);

        let hardworking = Trait::Hardworking.get_effect();
        assert_eq!(hardworking.efficiency_bonus, 0.10);

        let lazy = Trait::Lazy.get_effect();
        assert_eq!(lazy.efficiency_bonus, -0.10);
        assert_eq!(lazy.happiness_bonus, -5.0);

        let efficient = Trait::Efficient.get_effect();
        assert_eq!(efficient.efficiency_bonus, 0.20);

        let slow = Trait::Slow.get_effect();
        assert_eq!(slow.efficiency_bonus, -0.15);
        assert_eq!(slow.happiness_bonus, -3.0);
    }

    #[test]
    fn test_trait_get_effect_learning() {
        // 测试学习类特性
        let intelligent = Trait::Intelligent.get_effect();
        assert_eq!(intelligent.xp_bonus, 0.20);

        let fast_learner = Trait::FastLearner.get_effect();
        assert_eq!(fast_learner.xp_bonus, 0.15);

        let genius = Trait::Genius.get_effect();
        assert_eq!(genius.xp_bonus, 0.30);

        let slow_learner = Trait::SlowLearner.get_effect();
        assert_eq!(slow_learner.xp_bonus, -0.10);
        assert_eq!(slow_learner.happiness_bonus, -2.0);
    }

    #[test]
    fn test_trait_get_effect_social() {
        // 测试社交类特性
        let social = Trait::Social.get_effect();
        assert_eq!(social.team_bonus, 0.05);
        assert_eq!(social.happiness_bonus, 3.0);

        let loner = Trait::Loner.get_effect();
        assert_eq!(loner.team_bonus, -0.05);

        let charismatic = Trait::Charismatic.get_effect();
        assert_eq!(charismatic.team_bonus, 0.10);
        assert_eq!(charismatic.happiness_bonus, 5.0);

        let shy = Trait::Shy.get_effect();
        assert_eq!(shy.team_bonus, -0.05);
        assert_eq!(shy.happiness_bonus, -3.0);
    }

    #[test]
    fn test_trait_get_effect_time() {
        // 测试时间类特性
        let night_owl = Trait::NightOwl.get_effect();
        assert_eq!(night_owl.time_multiplier, 1.20);

        let early_bird = Trait::EarlyBird.get_effect();
        assert_eq!(early_bird.time_multiplier, 1.20);
    }

    #[test]
    fn test_trait_get_effect_positive() {
        // 测试正面类特性
        let careful = Trait::Careful.get_effect();
        assert_eq!(careful.efficiency_bonus, 0.05);
        assert_eq!(careful.happiness_bonus, 2.0);

        let creative = Trait::Creative.get_effect();
        assert_eq!(creative.efficiency_bonus, 0.10);
        assert_eq!(creative.xp_bonus, 0.05);
        assert_eq!(creative.happiness_bonus, 5.0);

        let persevering = Trait::Persevering.get_effect();
        assert_eq!(persevering.efficiency_bonus, 0.15);
        assert_eq!(persevering.xp_bonus, 0.10);
        assert_eq!(persevering.happiness_bonus, 3.0);

        let optimistic = Trait::Optimistic.get_effect();
        assert_eq!(optimistic.happiness_bonus, 8.0);
    }

    #[test]
    fn test_trait_get_effect_negative() {
        // 测试负面类特性
        let clumsy = Trait::Clumsy.get_effect();
        assert_eq!(clumsy.efficiency_bonus, -0.10);
        assert_eq!(clumsy.happiness_bonus, -3.0);

        let forgetful = Trait::Forgetful.get_effect();
        assert_eq!(forgetful.efficiency_bonus, -0.05);
        assert_eq!(forgetful.happiness_bonus, -2.0);

        let careless = Trait::Careless.get_effect();
        assert_eq!(careless.efficiency_bonus, -0.08);
        assert_eq!(careless.happiness_bonus, -4.0);
    }

    #[test]
    fn test_worker_calculate_trait_effects_primary_only() {
        // 测试只有主特性的工人
        let worker = Worker::new_full(
            "Test Worker",
            "mining",
            "A test worker",
            "Coin Mine",
            Gender::Male,
            vec![],
            Trait::Diligent, // 主特性：勤奋 +15%效率
            vec![],          // 无次特性
        );

        let effects = worker.calculate_trait_effects();
        assert_eq!(effects.efficiency_bonus, 0.15);
        assert_eq!(effects.xp_bonus, 0.0);
        assert_eq!(effects.team_bonus, 0.0);
        assert_eq!(effects.time_multiplier, 1.0);
        assert_eq!(effects.happiness_bonus, 0.0);
    }

    #[test]
    fn test_worker_calculate_trait_effects_with_secondary() {
        // 测试有次特性的工人
        let worker = Worker::new_full(
            "Test Worker",
            "mining",
            "A test worker",
            "Coin Mine",
            Gender::Male,
            vec![],
            Trait::Diligent,     // 主特性：勤奋 +15%效率
            vec![Trait::Social], // 次特性：社交 +5%团队，+3心情（50%效果）
        );

        let effects = worker.calculate_trait_effects();
        // 主特性100% + 次特性50%
        assert_eq!(effects.efficiency_bonus, 0.15); // 15% from Diligent
        assert_eq!(effects.xp_bonus, 0.0);
        assert_eq!(effects.team_bonus, 0.025); // 5% * 0.5 = 2.5%
        assert_eq!(effects.time_multiplier, 1.0);
        assert_eq!(effects.happiness_bonus, 1.5); // 3 * 0.5 = 1.5
    }

    #[test]
    fn test_worker_calculate_trait_effects_two_secondaries() {
        // 测试有两个次特性的工人
        let worker = Worker::new_full(
            "Test Worker",
            "mining",
            "A test worker",
            "Coin Mine",
            Gender::Male,
            vec![],
            Trait::Genius, // 主特性：天才 +30% XP
            vec![
                Trait::Efficient,  // 次特性1：高效 +20%效率（50%效果）
                Trait::Optimistic, // 次特性2：乐观 +8心情（50%效果）
            ],
        );

        let effects = worker.calculate_trait_effects();
        // 主特性100%
        assert_eq!(effects.efficiency_bonus, 0.10); // 20% * 0.5 = 10% from Efficient
        assert_eq!(effects.xp_bonus, 0.30); // 30% from Genius
        assert_eq!(effects.happiness_bonus, 4.0); // 8 * 0.5 = 4.0 from Optimistic
    }

    #[test]
    fn test_worker_calculate_trait_effects_mixed() {
        // 测试混合正负效果的工人
        let worker = Worker::new_full(
            "Test Worker",
            "mining",
            "A test worker",
            "Coin Mine",
            Gender::Female,
            vec![],
            Trait::Hardworking, // 主特性：努力 +10%效率
            vec![
                Trait::Lazy, // 次特性1：懒惰 -10%效率，-5心情（50%效果）
            ],
        );

        let effects = worker.calculate_trait_effects();
        // 10% + (-10% * 0.5) = 10% - 5% = 5%
        assert_eq!(effects.efficiency_bonus, 0.05);
        // 0 + (-5 * 0.5) = -2.5
        assert_eq!(effects.happiness_bonus, -2.5);
    }

    #[test]
    fn test_worker_get_total_efficiency() {
        // 测试获取最终效率倍率
        let mut worker = Worker::new_full(
            "Test Worker",
            "mining",
            "A test worker",
            "Coin Mine",
            Gender::Male,
            vec![],
            Trait::Diligent, // 主特性：勤奋 +15%效率
            vec![],
        );

        // 基础倍率为1.0，特性加成15%，最终应为1.0 * 1.15 = 1.15
        assert!((worker.get_total_efficiency() - 1.15).abs() < 0.001);

        // 修改基础倍率
        worker.efficiency_multiplier = 1.5;
        // 1.5 * 1.15 = 1.725
        assert!((worker.get_total_efficiency() - 1.725).abs() < 0.001);
    }

    #[test]
    fn test_worker_get_total_efficiency_with_secondary() {
        // 测试有次特性时的效率倍率
        let worker = Worker::new_full(
            "Test Worker",
            "mining",
            "A test worker",
            "Coin Mine",
            Gender::Male,
            vec![],
            Trait::Efficient,      // 主特性：高效 +20%效率
            vec![Trait::Diligent], // 次特性：勤奋 +15%效率（50%效果 = 7.5%）
        );

        // 总效率加成：20% + 7.5% = 27.5%
        // 基础倍率1.0 * 1.275 = 1.275
        assert!((worker.get_total_efficiency() - 1.275).abs() < 0.001);
    }

    #[test]
    fn test_worker_add_secondary_trait() {
        let mut worker = Worker::new("Test", "skill", "bg", "pref");
        assert_eq!(worker.secondary_traits.len(), 0);

        worker.add_secondary_trait(Trait::Diligent);
        assert_eq!(worker.secondary_traits.len(), 1);
        assert_eq!(worker.secondary_traits[0], Trait::Diligent);

        worker.add_secondary_trait(Trait::Social);
        assert_eq!(worker.secondary_traits.len(), 2);

        // 尝试添加第三个次特性（应该被拒绝）
        worker.add_secondary_trait(Trait::Lazy);
        assert_eq!(worker.secondary_traits.len(), 2); // 仍然是2个
    }

    #[test]
    fn test_worker_time_multiplier_calculation() {
        // 测试时间倍率计算
        let worker = Worker::new_full(
            "Test Worker",
            "mining",
            "A test worker",
            "Coin Mine",
            Gender::Male,
            vec![],
            Trait::NightOwl,        // 主特性：夜猫子 1.2倍
            vec![Trait::EarlyBird], // 次特性：早起者 1.2倍（50%效果 = 0.1倍）
        );

        let effects = worker.calculate_trait_effects();
        // 1.0 + (1.2 - 1.0) + (1.2 - 1.0) * 0.5
        // = 1.0 + 0.2 + 0.1 = 1.3
        assert!((effects.time_multiplier - 1.3).abs() < 0.001);
    }
}
