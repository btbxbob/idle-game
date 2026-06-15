use super::*;
use super::styles::{
    closing_line_en, closing_line_zh, detect_news_style, field_line_en, field_line_zh,
    management_line_en, management_line_zh, observer_line_en, observer_line_zh, source_note_en,
    source_note_zh, stylize_closer_en, stylize_closer_zh, stylize_field_en, stylize_field_zh,
    stylize_management_en, stylize_management_zh, stylize_observer_en, stylize_observer_zh,
    NewsStyle,
};

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

pub(super) fn compose_body_zh(
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

pub(super) fn compose_body_en(
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

fn opinion_attribution_zh(seed: &ScenarioSeed, variant: usize) -> &'static str {
    match detect_news_style(seed) {
        NewsStyle::Accident => match variant_slot(variant, 300, 4) {
            0 => "抹了一把脸上的灰，嗓子发紧地说",
            1 => "盯着还没收拾完的现场，半天才挤出一句",
            2 => "把声音压得很低，却还是压不住火气",
            _ => "像是刚从惊魂里回过神，苦笑着说",
        },
        NewsStyle::Labor => match variant_slot(variant, 300, 4) {
            0 => "把工牌往桌上一拍，带着火气说",
            1 => "先翻了个白眼，再忍不住阴阳了一句",
            2 => "一边摇头一边冷笑，话里全是刺",
            _ => "像是已经憋了整整一班的气，张口就来",
        },
        NewsStyle::Festival => match variant_slot(variant, 300, 4) {
            0 => "笑得差点把水喷出来，拍着桌子说",
            1 => "明显还没从热闹里退场，眉飞色舞地说",
            2 => "边笑边比划，像在补一段更离谱的现场版",
            _ => "一副巴不得再来一轮的样子，乐呵呵地说",
        },
        NewsStyle::Rumor => match variant_slot(variant, 300, 4) {
            0 => "先左右看了一圈，压低嗓门说",
            1 => "嘴上说不信，神情却像刚撞见了什么",
            2 => "明明想装镇定，结果越说越像怪谈加更",
            _ => "把声音放得只够近处几个人听见，神秘兮兮地说",
        },
        NewsStyle::Default => match seed.category {
            EventCategory::SocialMutation => match variant_slot(variant, 300, 4) {
                0 => "压低声音，却还是藏不住看热闹的劲头",
                1 => "像是在讲刚听来的新消息，越说越上头",
                2 => "本来想说得克制一点，结果语气先拐了弯",
                _ => "明明只是评价两句，却说出了围观现场的味道",
            },
            EventCategory::SurvivalCrisis => match variant_slot(variant, 300, 4) {
                0 => "像是把一整天的火气都压进这句话里",
                1 => "先叹气再开口，语气里全是疲惫和不服",
                2 => "说到一半就上了情绪",
                _ => "苦着脸，却还是忍不住抖了个黑色幽默包袱",
            },
            _ => match variant_slot(variant, 300, 4) {
                0 => "耸了耸肩，语气却一点也不平",
                1 => "像在讲笑话，但谁都听得出不是轻松的笑话",
                2 => "嘴上装得轻描淡写，情绪却已经写在脸上",
                _ => "说得像段子，落点却很真",
            },
        },
    }
}

fn opinion_attribution_en(seed: &ScenarioSeed, variant: usize) -> &'static str {
    match detect_news_style(seed) {
        NewsStyle::Accident => match variant_slot(variant, 300, 4) {
            0 => "wiped grime from their face and said through a tight throat",
            1 => "kept staring at the half-cleared scene before finally saying",
            2 => "tried to lower their voice, but not their anger, and said",
            _ => "looked like they had only just returned from the shock and said with a bleak laugh",
        },
        NewsStyle::Labor => match variant_slot(variant, 300, 4) {
            0 => "slapped their badge against the table and said",
            1 => "rolled their eyes first and then delivered it with open sarcasm",
            2 => "shook their head, laughed once without humor, and said",
            _ => "sounded like a full shift of frustration finally found a microphone and said",
        },
        NewsStyle::Festival => match variant_slot(variant, 300, 4) {
            0 => "nearly choked laughing, smacked the table, and said",
            1 => "still looked half inside the party and said with theatrical delight",
            2 => "gestured through the punchline like they were improving the scene live and said",
            _ => "looked delighted at the idea of a second round and said",
        },
        NewsStyle::Rumor => match variant_slot(variant, 300, 4) {
            0 => "looked both ways first and then whispered",
            1 => "claimed not to believe it, while looking exactly like someone who had seen something, and said",
            2 => "tried to sound calm, failed, and ended up sounding like the rumor's newest editor",
            _ => "dropped their voice until only the nearest few could hear and said",
        },
        NewsStyle::Default => match seed.category {
            EventCategory::SocialMutation => match variant_slot(variant, 300, 4) {
                0 => "lowered their voice, but not their appetite for the story, and said",
                1 => "sounded like they were passing along fresh hallway gossip and said",
                2 => "tried to keep it measured, then let the tone bend anyway and said",
                _ => "meant to offer a simple opinion, but made it sound like live commentary and said",
            },
            EventCategory::SurvivalCrisis => match variant_slot(variant, 300, 4) {
                0 => "compressed a whole day of anger into one breath and said",
                1 => "sighed first, then answered with tired defiance",
                2 => "got halfway through restraint before emotion took over and said",
                _ => "managed to smuggle one dark joke into an otherwise exhausted answer and said",
            },
            _ => match variant_slot(variant, 300, 4) {
                0 => "shrugged, though the tone was anything but flat, and said",
                1 => "made it sound like a joke with a real bruise underneath and said",
                2 => "tried to keep it casual, failed visibly, and said",
                _ => "delivered it like a line that wanted laughter and truth at the same time",
            },
        },
    }
}

pub(super) fn compose_worker_opinion_zh(worker: &Worker, seed: &ScenarioSeed, scenario_id: &str) -> String {
    let (a, b, c) = trait_voice_pack_zh(worker.primary_trait);
    let idx = worker.name.len() + scenario_id.len();
    format!(
        "{}{}：“{}，{}。{}”",
        worker.name,
        opinion_attribution_zh(seed, idx),
        a[idx % a.len()],
        b[(idx / 2) % b.len()],
        c[(idx / 3) % c.len()]
    )
}

pub(super) fn compose_worker_opinion_en(worker: &Worker, seed: &ScenarioSeed, scenario_id: &str) -> String {
    let (a, b, c) = trait_voice_pack_en(worker.primary_trait);
    let idx = worker.name.len() + scenario_id.len();
    format!(
        "{} {}, \"{}, {}. {}\"",
        worker.name,
        opinion_attribution_en(seed, idx),
        a[idx % a.len()],
        b[(idx / 2) % b.len()],
        c[(idx / 3) % c.len()]
    )
}

