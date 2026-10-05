// ============================================================ events
// Each builder returns { title, who: [ids], text, opts: [{ t, hint, ok, fx, tr }] } or null to skip.
// Writing style (after CK3): second person, plain and concrete, no winks. Options are what you say or do.
// An option with `tr` only shows up if you have that trait, and is marked with it.
const EV = {};
const opt = (t, hint, fx, ok, tr) => ({ t, hint, fx, ok, tr });
EV.prologue = () => {
  const [a, b, d] = W.flags.prologueKids.map(C), pa = P();
  // each child answers from their strongest side; no two give the same answer
  const LINES = ['「立君会死人。我们是做买卖的。」', '「得看本钱多少，几年回本。」', '「得看新君记不记得是谁扶的他。」', '「无数倍。」'];
  const taken = new Set(), said = new Map();
  for (const k of [a, b, d]) { const order = [0, 1, 2, 3].sort((i, j) => stat(k, j) - stat(k, i)); const i = order.find(x => !taken.has(x)); taken.add(i); said.set(k, LINES[i]); }
  const ans = k => said.get(k);
  return { title: '三问', who: [pa.id, a.id, b.id, d.id], big: true,
    text: `狸家的家主${nm(pa)}病了一冬。今天他把三个孩子叫到榻前，靠着枕头问：「种田，能得几倍的利？」「十倍。」「贩珠玉呢？」「百倍。」「那立一国之君呢？」\n谁来接这个家？`,
    // (passing over the eldest costs: they hold a grudge, and it can drive them out of the house)
    opts: [a, b, d].map(k => opt(nm(k) + '：' + ans(k), traitsOf(k).slice(0, 3).join(' ') + ' · ' + STATN.map((s, i) => s + stat(k, i)).join(' ') + (k !== a ? ' · ' + (a.female ? '长姊' : '长兄') + '不服' : ''), () => {
      W.player = k.id; PORT.clear();
      chronicle('succession', nm(k) + '接掌狸家', nm(pa) + '把商号交给了' + nm(k) + '。', k.id);
      W.flags.elder = pa.id; W.ap = apMax(k);
      if (k !== a) { passOver(a, 40); W.news.push('你的' + relTo(a) + nm(a) + '一句话也没说。', '等' + ta(a) + '对你好感过 40，这口气才会慢慢消。'); }
      W.queue.push({ ev: 'qihuo' });
    })) };
};
EV.qihuo = () => {
  const bing = duelFoe('bing');
  return { title: '奇货', who: ['yiren'],
  text: '市集的鱼摊前，两个赵兵正推搡一个穿旧黑袍的年轻人。卖盐的告诉你，那是秦国押在邯郸的质子，叫异人，安国君二十多个儿子里的一个。秦国这些年没少打赵国，他的月钱已经很久没送来了。',
  opts: [opt('「二位军爷，这条鱼算我的。」', '鱼干-20 · 异人好感+15', () => { addFish(-20); addOp(C('yiren'), P(), 15); W.flags.metYiren = true; }),
    opt('推开赵兵', duelHint('比剑', bing, null, '胜：异人+25 望+3 · 败：异人+8'), () => { W.flags.metYiren = true;
      startDuel('比剑', bing, win => { addOp(C('yiren'), P(), win ? 25 : 8); if (win) addPrest(3); }, { why: '胜：异人好感+25 · 名望+3 · 败：异人好感+8' }); }, null, '勇猛'),
    opt('回去打听他的底细', chkHint(3, 8) + ' · 了解秦国后宫', () => { if (chk(3, 8)) { W.flags.knowHuayang = true; logLine('得知：华阳夫人无子', '#ffe08a'); logLine('解锁：行「遣使咸阳」', '#c8e0ff'); } else toast('没打听到什么', '#dddddd'); }),
    opt('「与我无关。」', '', () => {})] };
};
EV.shangdang = () => ({ title: '上党', who: ['pingyuan'],
  text: '韩国上党郡守冯亭不愿降秦，把整个郡献给了赵国。平阳君劝赵王别收，说无故之利必有后祸；平原君说白得十七座城，没有不收的道理。赵王收了。秦国不会就这么算了。',
  opts: [opt('「粮价要涨。先囤一批。」', '鱼干-60 · 日后或许用得上', () => { addFish(-60); W.flags.hoard = true; }, () => W.fish >= 60),
    opt('托平原君的门客进言', chkHint(2, 9) + ' · 名望+8', () => { if (chk(2, 9)) addPrest(8); else addOp(C('pingyuan'), P(), -5); }),
    opt('「打仗是赵王的事。」', '', () => {})] });
EV.lvfeast = () => ({ title: '吕府夜宴', who: ['lv', 'zhaoji'],
  text: '阳翟来的大贾吕不韦在邯郸置了宅子，今晚请城里的商户吃酒。席间有个叫赵姬的舞姬，吕不韦说是他的姬妾。酒过三巡，他端着杯子坐到你旁边：' +
    (W.flags.metYiren ? '「听说你近来常去质子府？」' : '「城里都在说秦国那位质子。你怎么看？」'),
  opts: [opt('「是。我看好那位公子。」', '吕不韦好感-10 · 他会跟你作对', () => { addMemo(C('lv'), P(), '对头', -10); W.flags.lvRival = true; }),
    opt('「今晚只谈风月。」', duelHint('舌战', C('lv'), null, '让他放下戒心'), lvSmallTalk),
    opt('「这笔买卖太大，一家吃不下。」', chkHint(2, 12) + ' · 与吕不韦结盟分功', () => { if (chk(2, 12)) { W.flags.allied = true; addMemo(C('lv'), P(), '盟友', 20); logLine('你与吕不韦结盟', '#ffe08a'); } else addOp(C('lv'), P(), -5); }),
    opt('「吕公要的，恐怕不止一位公子。」', '吕不韦好感+10 · 名望+3', () => { addOp(C('lv'), P(), 10); addPrest(3); }, null, '野心')] });
EV.huayang = () => W.flags.knowHuayang ? null : ({ title: '华阳夫人', who: ['huayang'],
  text: '一个从咸阳回来的楚商喝多了，说秦国太子安国君最宠华阳夫人，可夫人一直没有孩子。「等她年老色衰，太子身边换了人，她靠谁去？」',
  opts: [opt('记下这件事', '解锁：行「遣使咸阳」', () => { W.flags.knowHuayang = true; })] });
EV.sheren = () => {
  const yr = C('yiren'); if (!alive(yr) || yr.loc !== 'hostage' || W.flags.escapeLead) return null;
  return { title: '舍人', who: ['yiren'],
    text: '异人请你到质子府坐。堂上漏风，他亲手给你倒了碗鱼汤，汤很淡。「在邯郸，肯正眼看我的没有几个。你若不嫌弃，做我的舍人如何？」',
    opts: [opt('「愿为公子奔走。」', '身份：舍人 · 异人好感+5', () => { W.rank = Math.max(W.rank, 1); PORT.clear(); MINI.clear(); addOp(yr, P(), 5); SFX.happy(); }),
      opt('「容我再想想。」', '', () => { W.cool.sheren = 6; })] };
};
EV.lianpo = () => ({ title: '长平', who: ['lianpo'],
  text: '秦军攻上党，赵王派老将廉颇驻守长平。廉颇一到就筑营垒，坚守不出。邯郸城里，往北去的粮车一天比一天多。',
  opts: [opt('知道了', '', () => { C('lianpo').loc = 'away'; })] });
// 赵括 takes the command at 长平 and 廉颇 comes home
EV.zhaokuo = () => ({ title: '纸上谈兵', who: ['zhaokuo'],
  text: '马服君的儿子赵括在酒肆里讲兵法，头头是道，满座叫好。他母亲却在托人给赵王递话，说这孩子不能为将。城里都在传，秦军最怕的就是赵括。',
  opts: [opt('替赵母把信递上去', '名望+5 · 赵括好感-10', () => { addPrest(5); addOp(C('zhaokuo'), P(), -10); }),
    opt('与赵括结交', '赵括好感+15', () => addOp(C('zhaokuo'), P(), 15)),
    opt('趁军粮涨价，卖掉一批', withTip('鱼干+80 · 名望-5', '仁厚'), () => { addFish(80); addPrest(-5); addStress(P(), '仁厚'); })],
  post: () => { const k = C('zhaokuo'), l = C('lianpo'); if (alive(k)) k.loc = 'away'; if (alive(l)) l.loc = 'palace'; } });
EV.meiji = () => {
  W.flags.meijiDone = true;
  const yr = C('yiren'), zj = C('zhaoji'), lv = C('lv'), p = P();
  if (!alive(yr) || !alive(zj) || yr.sp || zj.sp === W.player) return null;
  // a bride for a prince: young enough to give him a son; your daughters first, then your sisters, youngest first; never your mother
  const tier = c => (c.dad === p.id || c.mom === p.id) ? 0 : ((p.dad && c.dad === p.dad) || (p.mom && c.mom === p.mom)) ? 1 : 2;
  const girls = adults(kinPool()).filter(c => c.female && !c.sp && !c.preg && c.id !== W.player && c.id !== p.mom && ageOf(c) <= 35)
    .sort((a, b) => tier(a) - tier(b) || b.born - a.born);
  const O = [];
  if (girls.length) { const g0 = girls[0]; O.push(opt(`「公子，我家${g0.name}尚未许人。」`, `让你的${relTo(g0) || '族人'}嫁给异人 · 吕不韦好感-20`, () => { liBrideWed(g0); addOp(yr, p, 15); addOp(lv, p, -20); logLine(nm(g0) + '嫁给了异人', '#ffe08a'); })); }
  // (the head herself never marries into 秦's house: a queen can't run a merchant house, and no act two is written for her)
  O.push(opt('「吕公，成人之美。」', '异人好感+10 · 吕不韦好感-5', () => { zhaojiWed(); addOp(yr, p, 10); addOp(lv, p, -5); }));
  O.push(opt('什么也不说', '赵姬嫁给异人', () => zhaojiWed()));
  const wed = zj.sp && C(zj.sp);
  return { title: '讨要', who: ['yiren', 'zhaoji', 'lv'],
    text: '吕不韦又设宴。赵姬起舞的时候，异人一直看着她，筷子都放下了。散席时他走到吕不韦面前，行了个礼：「这位姬人，可否让与我？」吕不韦没有马上回答。' +
      (wed ? `赵姬如今是${who(wed)}的妻子。` : ''),
    opts: O };
};
// the father of 政: whoever she has been with lately (adult males only), weighted
function zhengFather(b, cands) {
  cands = cands.filter(([id]) => { const o = C(id); return alive(o) && !o.female && ageOf(o) >= 16; });
  let x = Math.random() * cands.reduce((t, c) => t + c[1], 0), f = 'yiren';
  for (const [id, w] of cands) { x -= w; if (x <= 0) { f = id; break; } }
  return f;
}
const ZHENG = { id: 'zheng', name: '政', disp: '政', sex: 'M' };
function liBrideWed(b) {
  W.flags.meijiDone = true;
  const yr = C('yiren');
  const cands = [['yiren', 3]].concat(b.lov.filter(id => id !== 'yiren').map(id => [id, 1]));
  // (she belongs to 秦's house now: never the head of this one, nor someone to call home)
  marry(b, yr); b.role = 'noble'; b.flags.royal = true; if (b.id !== W.player) { b.loc = 'hostage'; b.robe = 'qinPoor'; b.flags.left = true; }
  W.flags.liBride = b.id; PORT.clear(); MINI.clear();
  // a child she already carries becomes 政 (the father stays whoever he is)
  if (b.preg) Object.assign(b.preg, ZHENG); else { b.preg = null; setPreg(b, zhengFather(b, cands), Object.assign({}, ZHENG)); }
}
function zhaojiWed() {
  if (C('zhaoji').sp === W.player) return;
  W.flags.meijiDone = true;
  const yr = C('yiren'), zj = C('zhaoji'), p = P();
  // an old save may have her married already: that marriage ends, and her husband takes it badly
  const was = zj.sp && zj.sp !== 'yiren' && C(zj.sp);
  if (was) { divorce(zj, was, true); addOp(was, p, -20); }
  // Existing conception records take precedence over the default historical father.
  marry(zj, yr); zj.loc = 'hostage'; zj.role = 'noble'; zj.robe = 'qinPoor';
  if (!C('zheng')) {
    if (zj.preg) Object.assign(zj.preg, ZHENG); else setPreg(zj, 'lv', Object.assign({}, ZHENG));
  }
}
EV.changping = () => {
  // the army takes grain where it finds it: a hoard has a fair chance of being carted off first
  if (W.flags.hoard && !W.flags.hoardRolled) { W.flags.hoardRolled = true; if (chance(.4)) { W.flags.hoard = false; W.flags.hoardSeized = true; } }
  const O = [opt('派家丁守住质子府的门', '鱼干-40 · 异人好感+20', () => { addFish(-40); addOp(C('yiren'), P(), 20); }, () => W.fish >= 40),
    opt('这阵子别去质子府了', '异人好感-10', () => addOp(C('yiren'), P(), -10))];
  if (W.flags.hoard) O.unshift(opt('开仓卖粮', '鱼干+200 · 名望-4', () => { addFish(200); addPrest(-4); W.flags.hoard = false; }));
  return { title: '长平之败', who: ['zhaokuo'], text: '长平传来消息：赵括突围时中箭身亡，赵军降了秦，没有几个回来。邯郸家家戴孝。一群人堵在质子府门口，要秦国人偿命。' +
      (W.flags.hoardSeized ? '\n你囤的那批粮，前几天被军中征走了，只留下一张借据。' : ''),
    opts: O, pre: () => {
      const k = C('zhaokuo'); if (alive(k)) { die(k, true); W.queue = W.queue.filter(q => !(q.ev === 'death' && q.a === 'zhaokuo')); }
      if (W.flags.hoardSeized && !W.flags.hoardPaid) { W.flags.hoardPaid = true; addPrest(5); }
    } };
};
EV.zhengborn = () => {
  const z = C('zheng'); if (!z) return null;
  const mom = C(z.mom), p = P();
  if (mom && mom.id === W.player) return { title: '政', who: ['zheng', 'yiren'],
    text: '正月，你生下一个儿子。异人抱着他在院子里走了好几圈，给他取名政。秦王的曾孙，身上流着狸家的血。',
    opts: [opt('「这是秦国的公子。」', '名望+10', () => addPrest(10)), opt('把孩子抱给异人', '异人好感+15', () => addOp(C('yiren'), p, 15))] };
  if (mom && mom.house === 'li') return { title: '政', who: ['zheng', mom.id, 'yiren'],
    text: `正月，${who(mom)}生下一个儿子，异人给他取名政。秦王的曾孙，身上流着狸家的血。`,
    opts: [opt('备一份厚礼', '鱼干-30 · 异人好感+10', () => { addFish(-30); addOp(C('yiren'), p, 10); addOp(mom, p, 8); }, () => W.fish >= 30),
      opt('「这孩子也是狸家的骨肉。」', '名望+5', () => addPrest(5))] };
  return { title: '政', who: ['zheng', 'zhaoji', 'yiren'],
    text: '正月，赵姬生下一个儿子，取名政。质子府的接生婆私下跟人算日子：赵姬进门到现在，还不到十个月。',
    opts: [opt('备一份贺礼', '鱼干-30 · 异人、赵姬好感+8', () => { addFish(-30); addOp(C('yiren'), P(), 8); addOp(C('zhaoji'), P(), 8); }, () => W.fish >= 30),
      opt('找那个接生婆问问', '也许有秘密', () => { const s = W.secrets.find(x => x.kid === 'zheng'); if (s) { if (!knows(s)) s.known.push(W.player); logLine('得知秘密：' + secretText(s), '#ffb0d0'); SFX.secret(); } else toast('接生婆说是自己记错了', '#dddddd'); }),
      opt('「别人家的事。」', '', () => {})] };
};
// the grain hoarded after 上党 (if it survived 长平) is the house's stock now: eat it, or sell it at siege prices
EV.siege = () => {
  const hoard = !!W.flags.hoard;
  const O = hoard ? [opt('留着自家吃', '围城时家用 0', () => {}),
    opt('把存粮加价卖出去', withTip('鱼干+150 · 名望-8', '仁厚'), () => { addFish(150); addPrest(-8); W.flags.hoard = W.flags.stock = false; addStress(P(), '仁厚'); })]
    : [opt('多囤些粮', '鱼干-50 · 围城时家用 0' + (W.fish - 50 < 300 ? ' · 出城的金子更难凑' : ''), () => { addFish(-50); W.flags.stock = true; }, () => W.fish >= 50), opt('省着吃', '', () => {})];
  return { title: '围城', who: ['zhaowang'],
    text: '秦军兵临邯郸。城门关了，粮价一天一变。赵王在朝上说，城破之前，先杀秦国的质子。' + (hoard ? '\n上党那年囤的粮还在你家的仓里。' : '') +
      '\n真到那一天，要送' + nm(C('yiren')) + '出城，得有三百鱼干打点城门。谁出这笔钱，功劳算谁的。',
    opts: O, pre: () => { W.flags.siege = true; if (W.flags.hoard) W.flags.stock = true; } };
};
EV.maosui = () => ({ title: '毛遂', who: ['maosui', 'pingyuan'],
  text: '平原君要去楚国求救，想从门客里挑二十个文武兼备的同去，挑来挑去还差一个。一个叫毛遂的门客站出来自荐。平原君说他在门下三年，从没听人提起过他，转头问你怎么看。',
  opts: [opt('「锥子放进囊里，尖是藏不住的。」', '名望+10 · 功+4 · 毛遂好感+20 · 平原君好感+8', () => { addPrest(10); addOp(C('maosui'), P(), 20); addOp(C('pingyuan'), P(), 8);
      addMerit(4, '荐毛遂'); laterItem('chuxiu', 1, '平原君从楚国回来，分了你一份'); }),
    opt('「三年没人提起，自有道理。」', '毛遂好感-20', () => { addOp(C('maosui'), P(), -20); })] });
EV.dimian = () => {
  // 魏's envoy argues for it in person; after the debate he goes home to 大梁
  const xy = xinyuan();
  return { title: '帝秦', who: ['lzl', xy.id],
  text: '魏王派客将军辛垣衍来劝赵王尊秦王为帝，好让秦军退兵。齐人鲁仲连当着众人说：「秦若称帝，我宁可蹈东海而死。」满座的人都看向你，那个常去质子府的商人。',
  opts: [opt('「鲁先生说得是。」', '鲁仲连好感+15 · 名望+5 · 异人好感-5', () => { addOp(C('lzl'), P(), 15); addPrest(5); addOp(C('yiren'), P(), -5); }),
    opt('「帝号给了秦，下一步还要给什么？」', duelHint('舌战', xy, null, '胜：望+12 鲁仲连+15 · 异人-5'), () => { addOp(C('yiren'), P(), -5);
      startDuel('舌战', xy, win => { if (win) { addPrest(12); addOp(C('lzl'), P(), 15); } else toast('辛垣衍没有被你说动', '#dddddd'); },
        { why: '胜：名望+12 · 鲁仲连好感+15' }); }),
    opt('「尊一个名号，换一城人的命，不算亏。」', '异人好感+8 · 名望-8 · 赵王好感-10', () => { addOp(C('yiren'), P(), 8); addPrest(-8); addOp(C('zhaowang'), P(), -10); }),
    opt('不说话', '', () => {})],
  post: () => { if (alive(xy)) xy.loc = 'daliang'; } };
};
EV.qiefu = () => ({ title: '虎符', who: ['xinling'],
  text: '深夜，信陵君的门客敲开你家后门。魏王的宠姬如姬答应替信陵君偷出兵符，宫外需要一支商队把东西送出城。事成，魏军就能来救邯郸。' +
    // (the season before the escape: say what the 50 does to the 300)
    (!W.flags.escapeLead && W.fish >= 50 && W.fish - 50 < 300 ? '\n出了这五十，送' + nm(C('yiren')) + '出城的三百就不够了。' : ''),
  opts: [opt('「我的车队明早出城。」', '鱼干-50 · 名望+15 · 功+10 · 信陵君好感+30', () => { addFish(-50); addPrest(15); addOp(C('xinling'), P(), 30); addMerit(10, '虎符');
      laterItem('zhaojian', 2, '信陵君派人送来的谢礼'); if (typeof offerFriend === 'function') offerFriend(C('xinling'), true); }, () => W.fish >= 50),
    opt('收下定金，然后称病', '鱼干+40 · 名望-10', () => { addFish(40); addPrest(-10); }, null, '狡诈'),
    opt('「这件事我掺和不起。」', '', () => {})] });
const escOdds = () => clamp((W.fish - 150) / 150 + .03 * stat(P(), 3), .05, .95);
EV.escape = () => {
  const yr = C('yiren'), lv = C('lv'), p = P(); if (!alive(yr)) return null;
  // short of the 300? the closer you are, the likelier you can scrape the rest together (150 hardly ever, 290 nearly always)
  const rich = W.fish >= 300, odds = escOdds();
  // 异人 remembers who paid for the gate
  const lvPays = () => { W.flags.escapeLead = 'lv'; W.credit.lv += RACE.lvEsc; addMemo(yr, lv, '出城之恩', 20); };
  return { title: '出城', who: ['yiren', 'lv'],
    text: '赵王下令，明日处死秦国质子。异人夜里来找你，抓着你的袖子说不出话。吕不韦的人随后也到了：守城的官吏只认金子，六百斤。吕不韦备好了，问你出不出。',
    opts: [opt('「钱我来出。」', rich ? '鱼干-300 · 立嗣+' + RACE.esc + ' · 功+20 · 异人好感+25' : '鱼干不够 · 谋 ' + R(odds * 100) + '% 凑齐 · 立嗣+' + RACE.esc + ' · 功+20', () => {
        if (W.fish >= 300 || chance(odds)) { addFish(-Math.min(300, W.fish)); W.credit.you += RACE.esc; addMerit(20, '出城'); addOp(yr, p, 25); addMemo(yr, p, '出城之恩', 20); W.flags.escapeLead = 'you'; }
        else { toast('钱没凑够，城门是吕不韦的金子打开的', '#ff9a8a'); lvPays(); } }),
      opt('「吕公出吧。我跟着走。」', '功劳归吕不韦 · 异人好感+5', () => { lvPays(); addOp(yr, p, 5); }),
      opt('把异人的去向告诉赵王', '赵王好感+40 · 从此与秦为敌', () => { W.flags.betray = true; addOp(yr, p, -80); rel(yr, p).tag = 'rival'; addMemo(yr, p, '告密', -60); addOp(C('zhaowang'), p, 40); addPrest(10); W.flags.escapeLead = 'lv'; addMemo(yr, lv, '出城之恩', 20); })],
    // the night of the escape: nothing else happens in between
    post: () => { W.queue = W.queue.filter(q => q.ev !== 'sheren' && q.ev !== 'rand'); W.queue.unshift({ ev: 'hide' }); } };
};
EV.hide = () => {
  const yr = C('yiren'), wife = yr && yr.sp && C(yr.sp), end = () => { W.queue.unshift({ ev: 'act1end' }); };
  if (!alive(wife)) { end(); return null; }
  const out = W.flags.escapeLead === 'you' ? '你的车队把异人送出了城' : '异人跟着吕不韦的车队出了城';
  const kid = wife.kids.map(C).find(k => alive(k) && ageOf(k) < 16);
  // a soldier who finds the cellar has to be dealt with (比剑)
  const bing = duelFoe('bing');
  if (wife.id === W.player) {
    return { title: '搜城', who: [wife.id].concat(kid ? [kid.id] : []),
      text: `${out}，你${kid ? '和孩子' + nm(kid) : ''}还留在邯郸。赵兵在挨家挨户地搜秦国人的妻儿。`,
      opts: [opt('躲进狸家的地窖', cellarHint(bing) + ' · 名望+5', () => cellar(bing, () => { W.flags.hid = true; addPrest(5); }, () => { addPrest(-10); toast('赵兵搜到了地窖，你们连夜换了三处地方', '#ff9a8a'); })),
        opt('去求平原君庇护', chkHint(2, 10) + ' · 平原君好感', () => { if (chk(2, 10)) { addOp(C('pingyuan'), wife, 10); W.flags.hid = true; } else { addOp(C('pingyuan'), wife, -10); toast('平原君闭门不见', '#ff9a8a'); } }),
        opt('换上旧衣，混在市集里', '', () => {})],
      post: end };
  }
  // you told 赵王 where he went: his wife and son are next
  if (W.flags.betray) {
    const zw = C('zhaowang'), them = kid ? '他们' : ta(wife);
    return { title: '搜城', who: [wife.id].concat(kid ? [kid.id] : []),
      text: `${out}。赵王的人拿着你给的消息，正往质子府去。${who(wife)}${kid ? '和' + nm(kid) : ''}还在城里。`,
      opts: [opt('「这是赵王的事。」', '', () => {}),
        opt('暗中递个信，让' + them + '躲一躲', ta(wife) + '好感+10', () => addOp(wife, P(), 10)),
        opt('「把' + them + '也交出去。」', (alive(zw) ? nm(zw) + '+20 · ' : '') + them + '记恨一辈子', () => {
          if (alive(zw)) addOp(zw, P(), 20); addMemo(wife, P(), '邯郸之仇', -60); if (kid) addMemo(kid, P(), '邯郸之仇', -60); a2c().soldZ = true; })],
      post: end };
  }
  // your own daughter or sister has no other family to run to
  const ours = wife.house === 'li';
  return { title: '搜城', who: [wife.id].concat(kid ? [kid.id] : []),
    text: `${out}，${who(wife)}${kid ? '和孩子' + nm(kid) : ''}还留在邯郸。赵兵在挨家挨户地搜。`,
    opts: [opt('藏进你家的地窖', cellarHint(bing) + ' · ' + ta(wife) + '会记得', () => cellar(bing,
        () => { addOp(wife, P(), 10); addMemo(wife, P(), '藏匿之恩', 25); if (kid) { addOp(kid, P(), 10); addMemo(kid, P(), '藏匿之恩', 15); } W.flags.hid = true; },
        () => { addPrest(-10); toast('赵兵搜到了地窖，' + ta(wife) + '们连夜逃走了', '#ff9a8a'); })),
      ours ? opt('送' + ta(wife) + '去乡下的庄子躲一阵', '鱼干-30 · 好感+10', () => { addFish(-30); addOp(wife, P(), 10); }, () => W.fish >= 30)
        : opt('送' + ta(wife) + '回娘家', '好感+10', () => addOp(wife, P(), 10)),
      ours ? opt('「回质子府去，那里有人守着。」', '好感-15', () => { addOp(wife, P(), -15); if (kid) addOp(kid, P(), -10); })
        : opt('关上门', '好感-15', () => addOp(wife, P(), -15))],
    post: end };
};
// the adoption: who gets the credit is only decided when the act ends
EV.zichu = () => {
  if (W.flags.zichu) return null;
  return { title: '立嗣', who: ['huayang', 'yiren'],
    text: '咸阳来信：华阳夫人认异人为子，立为安国君的嫡嗣。信里提到了邯郸的两位商人。',
    opts: [opt('「这笔买卖，成了一半。」', '立嗣功劳：你 ' + W.credit.you + ' / 吕 ' + W.credit.lv + ' · 名望+8', () => {
      W.flags.zichu = true; addPrest(8); addOp(C('yiren'), P(), 5); })] };
};
EV.act1end = () => {
  if (W.flags.act1Done) return null;
  W.flags.act1Done = true; W.flags.zichu = true;
  const yr = C('yiren'), lv = C('lv'), hy = C('huayang'), p = P(), you = W.credit.you, lvc = W.credit.lv;
  // 异人 goes home, meets 华阳夫人 in 楚 dress and takes the name 子楚
  if (alive(yr) && yr.disp === '异人') { yr.disp = '子楚'; W.flags.renamed = true; }
  // what 子楚 and 华阳夫人 will remember of the two merchants
  if (alive(yr)) { const d = clamp(R((you - lvc) / 3), -15, 25); addMemo(yr, p, '立嗣之功', W.flags.allied ? 10 : d); if (alive(lv)) addMemo(yr, lv, '立嗣之功', W.flags.allied ? 10 : -d); }
  if (alive(hy)) { addMemo(hy, p, '说客', Math.floor(you / 10)); if (alive(lv)) addMemo(hy, lv, '说客', Math.floor(lvc / 10)); }
  const oy = opinion(yr, p), ol = opinion(yr, lv);
  let verdict;
  if (W.flags.betray) verdict = '你把异人的去向告诉了赵王，赵王赏了你。异人没有死。他回了咸阳，也记住了你。';
  else if (W.flags.allied) verdict = '你和吕不韦一同站在子楚身后。这笔买卖，你们一人一半。';
  else if (W.flags.escapeLead === 'you' && you >= lvc) verdict = '出城那夜，子楚对你说：「他日若得秦国，与君共之。」吕不韦也听见了。';
  else if (you >= lvc && oy > ol) verdict = '立嗣的事，你出的力比吕不韦多。子楚遇事，也先问你。';
  else if (you >= lvc) verdict = W.flags.escapeLead === 'lv' ? '立嗣的事，你出的力比吕不韦多。可出城那夜，开城门的是吕不韦的金子，子楚记得这个。' : '立嗣的事，你出的力比吕不韦多。可子楚遇事，先问的是吕不韦。';
  else if (oy > ol) verdict = (W.flags.escapeLead === 'you' ? '出城的金子是你出的。' : '') + '吕不韦的功劳比你大，可子楚遇事，常常先问你。';
  else verdict = (W.flags.escapeLead === 'you' ? '出城的金子是你出的，可' : '') + '子楚记得的是吕不韦。你的名字，他要想一想才叫得出来。';
  if (W.flags.hid && !W.flags.betray) { const w = alive(yr) && yr.sp && C(yr.sp); verdict += w && w.id !== W.player ? '搜城那几天，' + nm(w) + '躲在你家的地窖里。' : '搜城那几天，你们躲过了赵兵。'; }
  // no longer a hostage: the heir of 秦's heir, dressed like one
  if (alive(yr)) { yr.loc = 'xpalace'; yr.role = 'noble'; yr.robe = 'qin'; PORT.clear(); MINI.clear(); }
  if (alive(lv)) {
    lv.loc = 'xlvfu';
    // you cost him his investment
    if (W.flags.betray) { addOp(lv, p, -40); rel(lv, p).tag = 'rival'; }
  }
  // 政 must exist from here on; his mother keeps him in 邯郸 until 前251, and 赵姬, if she isn't his mother, follows 吕不韦
  ensureZheng();
  const zj = C('zhaoji'); if (alive(zj) && zj.id !== W.player && qm() !== zj && zj.sp !== 'yiren' && zj.sp !== W.player && !household().includes(zj) && cityOf(zj) === 'handan') zj.loc = 'xlvfu';
  // history takes over from here: the famous without a known death date live and die like anyone else
  for (const c of Object.values(W.chars)) if (c.hist && alive(c) && c.immortal && (c.dieT === null || c.dieT === undefined)) c.immortal = false;
  // (four roads into act two: with 子楚 to 咸阳, 邯郸 guarding his wife and son, 邯郸 as a merchant, 赵 for the betrayer)
  return { title: '第一幕 · 奇货', who: ['yiren', W.player], big: true,
    text: verdict + `\n立嗣功劳：你 ${you} / 吕 ${lvc}\n子楚好感：你 ${oy} / 吕 ${ol}\n子楚要回咸阳了。`,
    opts: act1Roads() };
};
