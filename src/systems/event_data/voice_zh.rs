use crate::entities::Trait;

pub fn trait_voice_pack_zh(
    trait_value: Trait,
) -> (
    &'static [&'static str],
    &'static [&'static str],
    &'static [&'static str],
) {
    match trait_value {
        Trait::Diligent
        | Trait::Hardworking
        | Trait::Efficient
        | Trait::Persevering
        | Trait::Careful => (
            &[
                "先把岗位守住",
                "越是这时候越不能乱",
                "流程还在转就有机会",
                "把这轮先顶过去",
                "别让今天白白损失掉",
                "先把关键工位稳住",
                "这时候最怕有人先松手",
                "班组不能在这个节骨眼散掉",
                "先把今天的损失压到最低",
                "再难也得把工序接住",
            ],
            &[
                "大家至少还知道自己该做什么",
                "真正危险的是节拍断掉",
                "我宁愿多值一轮班，也不想看系统停住",
                "现在需要更稳的安排",
                "岗位比口号更诚实",
                "只要流程没断，局面就还有补救空间",
                "大家最需要的是能落地的调度，不是空话",
                "机器和人都怕犹豫，稳比快更重要",
                "先让班组知道下一步做什么，情绪就不会先崩",
                "现在每一分钟都该拿来保住产线",
            ],
            &[
                "别松手。",
                "先把这轮扛住。",
                "能修就修。",
                "数字会骗人，工位不会。",
                "现在最重要的是稳住。",
                "先别让产线掉下来。",
                "该顶的时候就得顶。",
                "把活接住再说。",
                "稳住就还有明天。",
                "先把口子堵上。",
                "别让流程断气。",
                "先顶住这一班。",
                "守住比漂亮更重要。",
                "先让线活着。",
                "乱不得。",
            ],
        ),
        Trait::Lazy
        | Trait::Slow
        | Trait::SlowLearner
        | Trait::Clumsy
        | Trait::Careless
        | Trait::Forgetful => (
            &[
                "听起来又要加班",
                "他们总说只是临时问题",
                "我只想知道今晚会不会更难熬",
                "消息倒是比饭来得快",
                "最好别再临时改流程了",
                "每次出事都先轮到我们加班",
                "我就知道这事不会轻易过去",
                "现在连喘口气都像奢侈",
                "最麻烦的总是落到值班的人头上",
                "又来一轮临时调整是吧",
            ],
            &[
                "每次都说可控，结果总会多一堆表格",
                "如果不是落到我头上，我可能都不想注意",
                "别把所有麻烦都往班组里塞",
                "我希望别再把事情搞复杂",
                "这事听起来已经够麻烦了",
                "上头一句协调，下面就得多跑几圈",
                "我只求别把简单问题做成长期折磨",
                "能不能先把吃饭和休息保证了再谈别的",
                "每次都要我们自己想办法消化后果",
                "如果流程再改一次，肯定又有人跟不上",
            ],
            &[
                "能早点结束就好。",
                "别再拖长了。",
                "希望这次不是长期安排。",
                "我可不想赔上一整夜。",
                "拜托简单一点。",
                "让我先把这班混过去。",
                "今天最好别再加码。",
                "麻烦别变成常态。",
                "我只想准点下班。",
                "别再往下压了。",
                "别让我再多背一层锅。",
                "今天到此为止行吗。",
                "别再来新花样。",
                "先让我喘口气。",
                "这事最好别升级。",
            ],
        ),
        Trait::Intelligent | Trait::FastLearner | Trait::Genius | Trait::Creative => (
            &[
                "这件事的因果链其实很清楚",
                "从系统角度看",
                "我怀疑这只是更大模式的一部分",
                "如果把变量摊开看",
                "这里面一定有可重复的结构",
                "我更愿意把它视为一个可分析的样本",
                "先别急着把它叫做事故",
                "这个节点出现得太有规律了",
                "从逻辑链上看它并不突然",
                "如果把前后读数放一起看",
            ],
            &[
                "现象本身比通报更重要",
                "他们说的是结果，不是机制",
                "真正关键的是它为何在这个时点出现",
                "只要样本够多，这就不再神秘",
                "我更关心它会怎么改写后续生产逻辑",
                "真正值得记录的是系统为何允许它发生",
                "每次异常都在透露主线的薄弱处",
                "只看表面波动会错过核心因子",
                "这不是孤例，而是某种阈值被碰到了",
                "如果模型成立，下一次波动会来得更快",
            ],
            &[
                "这不是噪音，是结构。",
                "我想看原始记录。",
                "迟早有人会把它建模出来。",
                "这里面藏着下一步的钥匙。",
                "现在缺的是诚实数据。",
                "先把因果链画出来。",
                "别让情绪盖过样本。",
                "结构比口号更重要。",
                "它迟早会暴露规律。",
                "关键变量已经浮出来了。",
                "先别浪费这个样本。",
                "模式已经在说话了。",
                "这行数据很贵。",
                "别急着下结论，先画图。",
                "真正的答案在序列里。",
            ],
        ),
        Trait::Social | Trait::Charismatic | Trait::Optimistic => (
            &[
                "大家今天都在讨论这件事",
                "这个消息一出，工棚就有反应",
                "我敢说每个班组都听到了风声",
                "你能从表情上看出来",
                "人群的情绪变得很快",
                "连平时不吭声的人都开始交换消息了",
                "走廊里的话题几分钟就换成了这个",
                "这事一出来，大家看彼此的眼神都不一样了",
                "消息传得比广播还快",
                "连食堂里都在说这件事",
            ],
            &[
                "恐慌会传得比通知更快，但希望也一样",
                "只要把话讲明白，队伍就不会散",
                "比起沉默，我宁愿大家把担心说出来",
                "现在最需要的是能听懂的解释",
                "只要节拍没全乱，局面就还能接住",
                "大家最怕的是没人出来把话说明白",
                "如果有人肯承担解释责任，情绪就不会继续下坠",
                "传言会自己生长，所以回应必须更快",
                "我们需要的是把同一件事讲成同一个版本",
                "队伍不会因为坏消息散，只会因为沉默散",
            ],
            &[
                "现在还不是最糟的时候。",
                "总会有人把事情接住。",
                "别先把彼此吓坏。",
                "我们至少还在同一条线上。",
                "如果要变，也要一起变。",
                "先别把希望说没了。",
                "能说清楚就还有余地。",
                "人心别先散。",
                "先让大家知道自己不是孤立的。",
                "坏消息也得有人稳着讲。",
                "别让传言赢了。",
                "先把话讲明白。",
                "人还在，就能接。",
                "把情绪拢住再说。",
                "别让队伍先碎。",
            ],
        ),
        Trait::Loner | Trait::Shy => (
            &[
                "我平时不太参与这种讨论",
                "如果一定要问",
                "我更习惯先记下来",
                "我不想太早下结论",
                "你可以把这当成个人观察",
                "我宁愿多看两轮再开口",
                "先别把我的名字写得太显眼",
                "我通常只在被问到时才说",
                "我不确定这是不是适合公开说的话",
                "如果一定要记录，就按事实写",
            ],
            &[
                "大家说得太多时，重要细节反而会被盖住",
                "有些变化在安静的时候更明显",
                "不出声不代表没看见",
                "我不觉得现在有人完全理解它",
                "再观察一轮会更稳妥",
                "很多东西不是没发生，只是被更响的声音压过去了",
                "我更相信反复出现的细节，而不是第一波解读",
                "真相通常不会出现在最热闹的地方",
                "只要再看一班，很多人现在的说法就会自己失效",
                "先把记录留下，比急着表态更有用",
            ],
            &[
                "先别把话说满。",
                "噪音太大了。",
                "真实通常藏在安静处。",
                "还没到能下定论的时候。",
                "现在最缺的是清醒。",
                "再安静一点就能看出来了。",
                "别急着站队。",
                "让我再看一轮。",
                "沉默里信息更多。",
                "现在说死太早了。",
                "别让热闹替代判断。",
                "先把细节留下。",
                "现在最怕误读。",
                "再等一轮更稳。",
                "安静一点才听得见真相。",
            ],
        ),
        Trait::NightOwl | Trait::EarlyBird => (
            &[
                "这种波动总挑时段说话",
                "白班和夜班看到的像两套世界",
                "换班边缘最能看出问题",
                "我比很多人更早注意到节拍变化",
                "时段本身就是问题的一部分",
                "这类事总在最不该出波动的时候出波动",
                "晨班和夜班看到的不是同一张图",
                "时间窗一错开，很多问题立刻就暴露了",
                "我盯的不是新闻，是它出现的时刻",
                "时段比表面现象更诚实",
            ],
            &[
                "如果只看一个班次，结论肯定会偏",
                "真正的拐点总发生在大家最疲惫或最松弛的时候",
                "他们应该按时间窗来布置应对",
                "节拍一乱，时间感先出问题",
                "时钟往往比报告更诚实",
                "同一条产线在不同班次里会说不同的话",
                "想抓住规律，就得先抓住它出现的时间段",
                "很多错误不是突然发生，而是在换班缝隙里堆出来的",
                "时间分布本身就是线索，不是背景",
                "值班安排要是错了，再好的口径也会露底",
            ],
            &[
                "换个班次看会更清楚。",
                "这事有明确的时间纹理。",
                "再看一轮时间窗。",
                "信号不会随机出现。",
                "它有自己的时序。",
                "别忽略换班线。",
                "看钟表比看脸色更准。",
                "它总在特定时段露头。",
                "再追一轮时序。",
                "节拍本身会说话。",
                "看时间，别只看表情。",
                "它有固定出场顺序。",
                "再等下个时段。",
                "换班缝最会漏真相。",
                "先盯时间轴。",
            ],
        ),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn all_traits() -> Vec<Trait> {
        vec![
            Trait::Diligent, Trait::Hardworking, Trait::Efficient, Trait::Persevering, Trait::Careful,
            Trait::Lazy, Trait::Slow, Trait::SlowLearner, Trait::Clumsy, Trait::Careless, Trait::Forgetful,
            Trait::Intelligent, Trait::FastLearner, Trait::Genius, Trait::Creative,
            Trait::Social, Trait::Charismatic, Trait::Optimistic,
            Trait::Loner, Trait::Shy,
            Trait::NightOwl, Trait::EarlyBird,
        ]
    }

    #[test]
    fn every_trait_returns_three_non_empty_slices() {
        for t in all_traits() {
            let (a, b, c) = trait_voice_pack_zh(t);
            assert!(!a.is_empty(), "a slice empty for {:?}", t);
            assert!(!b.is_empty(), "b slice empty for {:?}", t);
            assert!(!c.is_empty(), "c slice empty for {:?}", t);
        }
    }

    #[test]
    fn efficiency_group_traits_share_pack() {
        let traits = [Trait::Diligent, Trait::Hardworking, Trait::Efficient, Trait::Persevering, Trait::Careful];
        let reference = trait_voice_pack_zh(traits[0]);
        for t in &traits[1..] {
            let pack = trait_voice_pack_zh(*t);
            assert_eq!(reference.0.len(), pack.0.len());
            assert_eq!(reference.1.len(), pack.1.len());
            assert_eq!(reference.2.len(), pack.2.len());
        }
    }

    #[test]
    fn negative_group_traits_share_pack() {
        let traits = [Trait::Lazy, Trait::Slow, Trait::SlowLearner, Trait::Clumsy, Trait::Careless, Trait::Forgetful];
        let reference = trait_voice_pack_zh(traits[0]);
        for t in &traits[1..] {
            let pack = trait_voice_pack_zh(*t);
            assert_eq!(reference.0.len(), pack.0.len());
            assert_eq!(reference.1.len(), pack.1.len());
            assert_eq!(reference.2.len(), pack.2.len());
        }
    }

    #[test]
    fn all_slices_contain_non_empty_strings() {
        for t in all_traits() {
            let (a, b, c) = trait_voice_pack_zh(t);
            for s in a.iter().chain(b.iter()).chain(c.iter()) {
                assert!(!s.is_empty(), "empty string in pack for {:?}", t);
            }
        }
    }
}

