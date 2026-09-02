import { useEffect, useState } from "react";

/**
 * 把本地时间映射成岛上的时辰 —— 七档，问候与天色都跟着真实时钟走。
 * 每 30 秒重新判断一次，跨点即换。
 */
export type DayPhase = "dawn" | "morning" | "noon" | "afternoon" | "dusk" | "evening" | "night";

export interface DayPhaseInfo {
  phase: DayPhase;
  greeting: string;
  label: string;
}

export function calcDayPhase(d: Date = new Date()): DayPhaseInfo {
  const h = d.getHours();
  const m = d.getMinutes();
  const t = h + m / 60;
  if (t >= 5 && t < 8) return { phase: "dawn", greeting: "早上好", label: "拂晓" };
  if (t >= 8 && t < 11.5) return { phase: "morning", greeting: "上午好", label: "清晨" };
  if (t >= 11.5 && t < 14) return { phase: "noon", greeting: "中午好", label: "正午" };
  if (t >= 14 && t < 17) return { phase: "afternoon", greeting: "下午好", label: "午后" };
  if (t >= 17 && t < 19) return { phase: "dusk", greeting: "傍晚好", label: "黄昏" };
  if (t >= 19 && t < 23) return { phase: "evening", greeting: "晚上好", label: "夜晚" };
  return { phase: "night", greeting: "夜深了", label: "子夜" };
}

export function useDayPhase(): DayPhaseInfo {
  const [state, setState] = useState<DayPhaseInfo>(() => calcDayPhase());
  useEffect(() => {
    const id = window.setInterval(() => setState(calcDayPhase()), 30 * 1000);
    return () => window.clearInterval(id);
  }, []);
  return state;
}

/** 问候语随时辰变化的两句小诗 */
export function timeLines(phase: DayPhase): [string, string] {
  switch (phase) {
    case "dawn":
      return ["雾还挂在海面，", "第一缕光替你探路。"];
    case "morning":
      return ["晨光正好，露珠未干，", "把心事拿出来晒一晒。"];
    case "noon":
      return ["日头正当中，", "记得好好吃一顿午饭。"];
    case "afternoon":
      return ["日光斜下来，风也慢了，", "适合发一小会儿呆。"];
    case "dusk":
      return ["晚霞正在收工，", "把疲惫放在岛上吧。"];
    case "evening":
      return ["月亮已上岗，", "心事可以下班了。"];
    default:
      return ["万籁都睡了，", "只有岛还为你亮着灯。"];
  }
}
