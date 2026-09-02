/**
 * 回声信 —— 写给稍后的自己。
 * 存储走 api.letter（IndexedDB），这里只放纯逻辑。
 */

export type DelayKind = "5m" | "30m" | "1h" | "tomorrow";

export interface SealedLetter {
  id: string;
  text: string;
  createdAt: number;
  openAt: number;
}

export const DELAYS: { id: DelayKind; label: string }[] = [
  { id: "5m", label: "5 分钟后" },
  { id: "30m", label: "30 分钟后" },
  { id: "1h", label: "1 小时后" },
  { id: "tomorrow", label: "明早 8 点" },
];

export function openAtFor(kind: DelayKind): number {
  const now = Date.now();
  if (kind === "5m") return now + 5 * 60 * 1000;
  if (kind === "30m") return now + 30 * 60 * 1000;
  if (kind === "1h") return now + 60 * 60 * 1000;
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(8, 0, 0, 0);
  return d.getTime();
}

/** 信封上的倒计时文案 */
export function formatLeft(openAt: number, now: number): string {
  const ms = openAt - now;
  if (ms <= 0) return "可以拆啦";
  const mins = Math.ceil(ms / 60000);
  if (mins <= 1) {
    const s = Math.max(0, Math.ceil(ms / 1000));
    return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  }
  if (mins < 60) return `${mins} 分钟后`;
  const hrs = Math.ceil(mins / 60);
  if (hrs < 24) return `${hrs} 小时后`;
  return "明早 8:00";
}

/** 「来自 x 前的你」 */
export function timeAgo(ts: number): string {
  const mins = Math.max(1, Math.round((Date.now() - ts) / 60000));
  if (mins < 60) return `${mins} 分钟前`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} 小时前`;
  return `${Math.round(hrs / 24)} 天前`;
}
