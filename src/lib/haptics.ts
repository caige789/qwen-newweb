/** 轻量触觉反馈（仅支持的移动端生效，静默降级） */
export function buzz(ms = 8) {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(ms);
    }
  } catch {
    /* 不支持则忽略 */
  }
}
