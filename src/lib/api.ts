/**
 * api.ts —— 统一 API 层。
 * 页面只调用这里的方法；所有实现目前走 IndexedDB（单机版）。
 * 将来升级联网版，把函数体换成 fetch 云端接口即可，页面零改动。
 */

import {
  dbAll,
  dbDelete,
  dbPut,
  type StoredConstellation,
  type StoredDiscovery,
  type StoredEnding,
  type StoredLetter,
  type StoredSeed,
} from "./db";

/** 失败静默降级：存档类能力出错绝不打断治愈体验 */
async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export const api = {
  letter: {
    list: (): Promise<StoredLetter[]> => safe(() => dbAll<StoredLetter>("letter"), []),
    save: (l: StoredLetter): Promise<void> => safe(() => dbPut("letter", l).then(() => undefined), undefined),
    remove: (id: string): Promise<void> => safe(() => dbDelete("letter", id).then(() => undefined), undefined),
  },

  constellation: {
    list: (): Promise<StoredConstellation[]> => safe(() => dbAll<StoredConstellation>("constellation"), []),
    /** 全量替换（观星台每次编辑后整体落档） */
    replaceAll: (cs: StoredConstellation[]): Promise<void> =>
      safe(
        async () => {
          const existing = await dbAll<StoredConstellation>("constellation");
          const keep = new Set(cs.map((c) => c.id));
          await Promise.all(
            existing.filter((e) => !keep.has(e.id)).map((e) => dbDelete("constellation", e.id))
          );
          await Promise.all(cs.map((c) => dbPut("constellation", c)));
        },
        undefined
      ),
  },

  seed: {
    list: (): Promise<StoredSeed[]> => safe(() => dbAll<StoredSeed>("seed"), []),
    save: (s: StoredSeed): Promise<void> => safe(() => dbPut("seed", s).then(() => undefined), undefined),
    remove: (id: string): Promise<void> => safe(() => dbDelete("seed", id).then(() => undefined), undefined),
  },

  story: {
    /** 已点亮的灯语结局（跨刷新保留） */
    list: (): Promise<StoredEnding[]> => safe(() => dbAll<StoredEnding>("story"), []),
    save: (e: StoredEnding): Promise<void> => safe(() => dbPut("story", e).then(() => undefined), undefined),
  },

  discovery: {
    /** 灯语里去过的场景（点亮探索图鉴） */
    list: (): Promise<StoredDiscovery[]> => safe(() => dbAll<StoredDiscovery>("discovery"), []),
    mark: (scene: string): Promise<void> =>
      safe(() => dbPut("discovery", { id: scene, scene, visitedAt: Date.now() }).then(() => undefined), undefined),
  },
};
