# 历代经历与天下影响

`src/systems/history-effects.js` 将实际结算与提示文本分开。它不修改行动结果、随机数、奖励、秘密或血缘，只记录已经发生的公开变化。

## 接线

在 `src/systems/dynasty.js` 之后嵌入模块，顺序由 `src/modules.json` 记录。

`choose(m, o)` 保留可用性检查、移除当前窗口、人物 note；将原来的 chronicle 与 fx/post 调用替换为：

```js
historyResolveChoice(m.e, o, () => {
  o.fx && o.fx();
  if (m.e.post) m.e.post();
});
historyFlushPending();
saveGame();
```

在 update 中的保存检查之前调用 `historyFlushPending()`；saveGame 在完成当前世界和 SAVE_SUSPENDED 检查后、saveReady 判断前也调用一次。endSeason 在 busy 检查后、季节经济结算前调用，避免同帧关闭窗口并换季时混入下一季收入。若选择打开了选人、选项或对决窗口，只记录已发生的净变化，并标注后续未结；后续窗口结束后记录剩下的变化。模块单独识别普通 pick/opts 窗口（原有 holding 不包含它们），而只读列表不会阻止结清。所有临时快照绑定原来的 `W` 对象，读档和新开局不会把旧窗口后果记到新世界。

`decodeSave` 的严格验证中调用 `validateHistoryEffects(d)`。没有该字段的旧档合法，load hook 会建立从当前日期开始的空账；不补造预设前史或旧操作。本模块沿用 chronicle 的 choice、succession、realm 类别，姻亲模块另用 kinship；纪事总上限保持 300。

在家族纪事/目标纸窗接入：

```js
{ t: '历代经历 ›', s: '按家主查看实际选择与后果', close: true, fn: () => openGenerationHistory() }
{ t: '天下影响 ›', s: '狸家具体做过什么，六国如何归秦', close: true, fn: () => openWorldEffects() }
```

模块自行用具名函数包装 a3Camp/Jian/Hao/Xiang、a3World/AiWar、a3ArmyKids、fallRealm、die，不替换源码、不调用额外随机数。外层选择与内部军事调用合并为一次结算；灭国总结等动作最终结算后生成，包含最后一击。

## 记录内容与边界

- 记录小鱼干、名望、功劳、精力、健康、秦国力、忌惮的实际净变动；记录迁居、身份变更、军中生还或死亡。
- 六国记录实力变化、结好期限、守将退出与归秦；灭国总结区分狸家直接记功和秦军/时势推进，列出最近 12 件相关玩家行动。
- 郭开的金子等改变死亡日期的选择，先记危期，实际死亡时才记录人命后果。
- 文案中的净额不是奖励/支出的分别流水，也不等同预先显示的可能结果。没有变化就明确说明本次跟踪的领域没有变化。
- 不读取 bio、秘密列表、隐藏特征，未揭露的亲子关系不会出现在记录里。
- 记录最多 240 件结果、六件灭国总结、40 件尚待落定的人命危期；满额先淘汰普通天下消息和无六国关联的旧记录。保存内容有结构及大小验证。
- 记录“选择后仍在世”只针对明确放行/迁置/保全选项中的在场人物，不推断永久获救。
- 不把某国提前灭亡全部归功于一次离间；年度战争、实力恢复、守将和史实推进共同参与结果。

## 验证

`node tools/headless.cjs . tests/history-effects.js --seed 7`（嵌入新模块后）。测试实际净结算、两个阶段的选择、真实离间/劝降/从军后果、灭国归因、读档界限、容量和隐藏血缘安全。
