/**
 * solarTerms.ts —— 24 节气引擎
 * 岛跟着农历呼吸：问候、签纸、登岛诗、四季限定场景都从这里取数。
 * 节气日期为公历近似值（±1 天），用于氛围足够精确。
 */

export type Season = "spring" | "summer" | "autumn" | "winter";

export interface SolarTerm {
  key: string;
  name: string;
  season: Season;
  month: number; // 1-12
  day: number; // 近似交节日
  poem: string; // 岛上的一句节气诗
  hint: string; // 宜
}

export const SOLAR_TERMS: SolarTerm[] = [
  { key: "xiaohan", name: "小寒", season: "winter", month: 1, day: 6, poem: "最冷的日子，适合攒最暖的事。", hint: "多喝热水 · 早睡一小时" },
  { key: "dahan", name: "大寒", season: "winter", month: 1, day: 20, poem: "冷到尽头，春天就开始排队了。", hint: "数九 · 静候春归" },
  { key: "lichun", name: "立春", season: "spring", month: 2, day: 4, poem: "今天起，春天上班，你的心事也可以发芽。", hint: "立个小目标 · 看看新绿" },
  { key: "yushui", name: "雨水", season: "spring", month: 2, day: 19, poem: "雨润物无声，有些人也是。", hint: "听一场雨 · 给想念的人问好" },
  { key: "jingzhe", name: "惊蛰", season: "spring", month: 3, day: 6, poem: "春雷叫醒虫子，也顺便叫醒你。", hint: "伸个懒腰 · 出门走走" },
  { key: "chunfen", name: "春分", season: "spring", month: 3, day: 21, poem: "昼夜平分，悲喜也各分一半吧。", hint: " 균형作息 · 踏青" },
  { key: "qingming", name: "清明", season: "spring", month: 4, day: 5, poem: "念逝去的人，也看看眼前的人。", hint: "尝一口青团 · 念一位故人" },
  { key: "guyu", name: "谷雨", season: "spring", month: 4, day: 20, poem: "雨生百谷，时间生答案。", hint: "耐心一点 · 读几页书" },
  { key: "lixia", name: "立夏", season: "summer", month: 5, day: 6, poem: "夏天来了，日子长，正好慢慢过。", hint: "睡个午觉 · 吃第一口瓜" },
  { key: "xiaoman", name: "小满", season: "summer", month: 5, day: 21, poem: "小满就好：满，但不必溢出来。", hint: "留三分余地 · 知足" },
  { key: "mangzhong", name: "芒种", season: "summer", month: 6, day: 6, poem: "忙着种，也忙着收，这就是生活。", hint: "做眼前事 · 不催自己" },
  { key: "xiazhi", name: "夏至", season: "summer", month: 6, day: 21, poem: "一年里最长的白天，长到够你喜欢一件事。", hint: "看一次日落 · 吃面" },
  { key: "xiaoshu", name: "小暑", season: "summer", month: 7, day: 7, poem: "热一点，懒一点，也没关系。", hint: "避开正午 · 喝绿豆汤" },
  { key: "dashu", name: "大暑", season: "summer", month: 7, day: 23, poem: "最热的天，心可以最凉快。", hint: "补水 · 静坐五分钟" },
  { key: "liqiu", name: "立秋", season: "autumn", month: 8, day: 7, poem: "秋天来的时候，风会先捎个信。", hint: "添件薄衫 · 看云" },
  { key: "chushu", name: "处暑", season: "autumn", month: 8, day: 23, poem: "暑气退场，天地忽然开阔。", hint: "早睡 · 看星星" },
  { key: "bailu", name: "白露", season: "autumn", month: 9, day: 8, poem: "露从今夜白，照顾好自己。", hint: "别露脚腕 · 吃温食" },
  { key: "qiufen", name: "秋分", season: "autumn", month: 9, day: 23, poem: "又一次平分，这一年辛苦了一半。", hint: "小结一下 · 说声谢谢" },
  { key: "hanlu", name: "寒露", season: "autumn", month: 10, day: 8, poem: "露水凉了，心还热着就好。", hint: "泡脚 · 喝热茶" },
  { key: "shuangjing", name: "霜降", season: "autumn", month: 10, day: 23, poem: "霜一落，有些心事反而看得清了。", hint: "整理房间 · 整理心情" },
  { key: "lidong", name: "立冬", season: "winter", month: 11, day: 7, poem: "冬藏的开始，好日子要存着过。", hint: "吃饺子 · 早睡" },
  { key: "xiaoxue", name: "小雪", season: "winter", month: 11, day: 22, poem: "小雪封山，也封住一点小确幸。", hint: "围炉 · 吃火锅" },
  { key: "daxue", name: "大雪", season: "winter", month: 12, day: 7, poem: "大雪纷纷，世界安静得像一页纸。", hint: "看雪 · 给朋友写句话" },
  { key: "dongzhi", name: "冬至", season: "winter", month: 12, day: 22, poem: "最长的夜，过了它，白天就一天天长了。", hint: "饺子或汤圆 · 早睡" },
];

export const SEASON_NAMES: Record<Season, string> = {
  spring: "春",
  summer: "夏",
  autumn: "秋",
  winter: "冬",
};

/** 当前节气（按公历日期推断） */
export function getSolarTerm(d: Date = new Date()): SolarTerm {
  const val = (d.getMonth() + 1) * 100 + d.getDate();
  // 一年中最后一个节气是冬至（12/22），此前未过小寒则取冬至
  let current = SOLAR_TERMS[SOLAR_TERMS.length - 1];
  for (const t of SOLAR_TERMS) {
    if (val >= t.month * 100 + t.day) current = t;
    else break;
  }
  return current;
}

export function seasonOf(d: Date = new Date()): Season {
  return getSolarTerm(d).season;
}

/** 距下一个节气还有几天 */
export function daysToNextTerm(d: Date = new Date()): number {
  const cur = getSolarTerm(d);
  const idx = SOLAR_TERMS.indexOf(cur);
  const next = SOLAR_TERMS[(idx + 1) % SOLAR_TERMS.length];
  const now = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  let target = new Date(d.getFullYear(), next.month - 1, next.day);
  if (target <= now) target = new Date(d.getFullYear() + 1, next.month - 1, next.day);
  return Math.round((target.getTime() - now.getTime()) / 86400000);
}

/** 今天恰好是节气日（±1 天）则返回，否则 null —— 用于「今日节气」轻提示 */
export function termAroundToday(d: Date = new Date()): SolarTerm | null {
  for (const t of SOLAR_TERMS) {
    const target = new Date(d.getFullYear(), t.month - 1, t.day).getTime();
    if (Math.abs(d.getTime() - target) < 1.2 * 86400000) return t;
  }
  return null;
}
