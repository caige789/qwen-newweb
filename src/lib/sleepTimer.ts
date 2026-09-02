/**
 * 睡眠定时器 —— 模块级单例。
 * 切到别的岛区、组件卸载，倒计时都照常走；最后 20 秒像退潮一样淡出。
 */
import { audio, type NoiseLayerId } from "./audio";

export interface SleepState {
  /** 剩余秒数；null = 未启动 */
  left: number | null;
  /** 本次定时总秒数 */
  total: number;
  /** 屏幕渐暗程度 0..1 */
  dim: number;
}

type Listener = (s: SleepState) => void;

const listeners = new Set<Listener>();
let timer: number | null = null;
let baseLevels: Record<NoiseLayerId, number> = {
  rain: 0,
  tide: 0,
  wind: 0,
  fire: 0,
  brook: 0,
  cricket: 0,
};
let state: SleepState = { left: null, total: 0, dim: 0 };

function emit() {
  for (const fn of listeners) fn(state);
}

function captureLevels() {
  (Object.keys(baseLevels) as NoiseLayerId[]).forEach((id) => {
    baseLevels[id] = audio.getNoiseLevel(id);
  });
}

function tick() {
  if (state.left === null) return;
  const left = state.left - 1;

  if (left <= 20 && left > 0) {
    const f = left / 20;
    (Object.keys(baseLevels) as NoiseLayerId[]).forEach((id) => {
      audio.setNoise(id, baseLevels[id] * f);
    });
    state = { ...state, left, dim: (1 - f) * 0.75 };
  } else if (left <= 0) {
    stopInternal(true);
    return;
  } else {
    state = { ...state, left };
  }
  emit();
}

function stopInternal(finished: boolean) {
  if (timer !== null) {
    window.clearInterval(timer);
    timer = null;
  }
  if (finished) {
    audio.stopAllNoise(1.2);
    state = { left: null, total: 0, dim: 0 };
  } else {
    // 手动取消：把淡出中的音量恢复到定时前的样子
    (Object.keys(baseLevels) as NoiseLayerId[]).forEach((id) => {
      if (baseLevels[id] > 0) audio.setNoise(id, baseLevels[id]);
    });
    state = { left: null, total: 0, dim: 0 };
  }
  emit();
}

export const sleepTimer = {
  get(): SleepState {
    return state;
  },
  subscribe(fn: Listener): () => void {
    listeners.add(fn);
    fn(state);
    return () => {
      listeners.delete(fn);
    };
  },
  start(mins: number) {
    captureLevels();
    // 若当前一层都没开，给一层很轻的潮汐，免得"定时了个寂寞"
    if (!audio.anyNoiseOn()) {
      audio.setNoise("tide", 0.4);
      baseLevels.tide = 0.4;
    }
    if (timer !== null) window.clearInterval(timer);
    state = { left: mins * 60, total: mins * 60, dim: 0 };
    timer = window.setInterval(tick, 1000);
    emit();
  },
  stop() {
    if (state.left === null) return;
    stopInternal(false);
  },
};
