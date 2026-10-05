// ---------------------------------------------------------- names
const GIV_M = ['阳', '鱼', '团', '墨', '豆', '虎', '石', '乐', '胜', '牧', '喜', '丹', '平', '安', '定', '远', '满', '福', '宝', '球', '斑', '云', '不饿', '有鱼', '无恙', '去病', '长卿', '子鱼', '小满', '阿福'];
const GIV_F = ['糯', '桃', '棉', '月', '芷', '蘅', '雪', '梨', '瑶', '姜', '灵', '秋', '春', '苗', '眯', '萝', '杏', '荷', '葵', '兰', '萱', '莲', '樱', '芽', '絮', '团团', '圆圆', '小桃', '阿糯', '青青'];
const SURS = ['郭', '乐', '毛', '李', '公孙', '卓', '田', '孔', '虞', '冯', '苏', '陈', '庞', '司马', '淳于', '范', '蔡'];
// birth-order prefix + a given name nobody of this surname has used; big clans fall back to names no LIVING kin carries
function orderName(c) {
  const sibs = W && c.mom ? Object.values(W.chars).filter(o => o !== c && o.mom === c.mom && o.born <= c.born).length : 0;
  const pre = sibs === 0 ? (c.female ? '孟' : '伯') : sibs === 1 ? '仲' : sibs === 2 ? '叔' : '季';
  const same = W ? Object.values(W.chars).filter(o => o !== c && o.sur === c.sur) : [];
  const used = new Set(same.map(o => o.name.slice(1))), livingFull = new Set(same.filter(alive).map(o => o.name));
  const all = c.female ? GIV_F : GIV_M, one = all.filter(s => s.length === 1);
  const free = one.filter(s => !used.has(s)), free2 = all.filter(s => !used.has(s)), notLiving = all.filter(s => !livingFull.has(pre + s));
  return pre + pick(free.length ? free : free2.length ? free2 : notLiving.length ? notLiving : all);
}
