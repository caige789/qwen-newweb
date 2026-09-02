import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ALL_ENDINGS,
  ALL_SCENES,
  getNode,
  NARRATOR_VOICE,
  NPCS,
  SCENE_META,
  SEASONAL_GATE,
  START_ID,
  type FxKey,
  type SceneKey,
} from "../../lib/story";
import { burstFx, drawScene, spawnParticles, type Particle } from "./scenes";
import NpcCard from "./NpcCard";
import { audio } from "../../lib/audio";
import { buzz } from "../../lib/haptics";
import { api } from "../../lib/api";
import { seasonOf } from "../../lib/solarTerms";
import type { StoredDiscovery, StoredEnding } from "../../lib/db";
import { ChevronLeftIcon, CompassIcon, ScrollIcon, SparkIcon, XIcon } from "../shared/icons";

const reduced =
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const PUNCT = /[，。？！、；：…—""''·\s]/;

/** 互动彩蛋的音效 */
function playFx(fx: FxKey) {
  switch (fx) {
    case "beacon":
      audio.hum();
      audio.playChime(2);
      break;
    case "fireflies":
    case "glowpulse":
    case "shooting":
    case "pollen":
      audio.twinkle();
      break;
    case "ripple":
    case "wave":
    case "splash":
    case "fishjump":
      audio.splash();
      break;
    case "gull":
      audio.gullCry();
      break;
    case "crystal":
      audio.crystalChime();
      break;
    case "raingust":
      audio.rainGust();
      break;
    case "sunrays":
    case "lanternsway":
      audio.playChime(3);
      break;
    case "snowburst":
      audio.playWindBurst(1.2, 0.1);
      audio.twinkle();
      break;
    case "cloudbreak":
      audio.hum();
      audio.playChime(2);
      break;
    case "petalburst":
      audio.playWindBurst(1.2, 0.1);
      audio.twinkle();
      break;
    case "emberburst":
      audio.hum();
      audio.twinkle();
      break;
  }
}

export default function StoryBook({ onClose }: { onClose: () => void }) {
  const [cover, setCover] = useState(true);
  const [nodeId, setNodeId] = useState(START_ID);
  const [typed, setTyped] = useState(0);
  const [endings, setEndings] = useState<StoredEnding[]>([]);
  const [discovered, setDiscovered] = useState<StoredDiscovery[]>([]);
  const [ended, setEnded] = useState(false);
  const [usedFx, setUsedFx] = useState(false);
  const [path, setPath] = useState<string[]>([]);
  const [justUnlocked, setJustUnlocked] = useState(false);

  const node = getNode(nodeId);
  const sceneKey = node.scene;
  const npc = node.npc ? NPCS[node.npc] : null;
  const voice = npc ? npc.voice : NARRATOR_VOICE;

  /** 四季限定：当季在码头多出一条路，过季自动消失 */
  const season = useMemo(() => seasonOf(), []);
  const visibleChoices = useMemo(() => {
    if (!node.choices) return null;
    const cs = [...node.choices];
    const gate = SEASONAL_GATE[season];
    if (node.id === gate.from && !node.ending && !cs.some((c) => c.next === gate.node)) {
      cs.push({ label: gate.label, next: gate.node });
    }
    return cs;
  }, [node, season]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<SceneKey>(sceneKey);
  const particlesRef = useRef<Particle[]>([]);
  const savedRef = useRef(false);
  const typedRef = useRef(0);

  /* 交叉淡入：记录上一场景与进度 */
  const prevSceneRef = useRef<SceneKey | null>(null);
  const prevParticlesRef = useRef<Particle[]>([]);
  const fadeRef = useRef(1);

  /* 视差：指针位置 → 画布轻微位移 */
  const parallax = useRef({ tx: 0, ty: 0, cx: 0, cy: 0 });

  /* 读档 */
  useEffect(() => {
    api.story.list().then(setEndings);
    api.discovery.list().then(setDiscovered);
  }, []);

  /* 场景画布：仅在打开时运行 */
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      const r = wrap.getBoundingClientRect();
      w = r.width + 48;
      h = r.height + 48;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particlesRef.current = spawnParticles(sceneRef.current, w, h);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const t = now / 1000;

      // 视差平滑跟随
      const px = parallax.current;
      px.cx += (px.tx - px.cx) * Math.min(1, dt * 4);
      px.cy += (px.ty - px.cy) * Math.min(1, dt * 4);
      canvas.style.transform = `translate3d(${-24 + px.cx}px, ${-24 + px.cy}px, 0)`;

      const prev = prevSceneRef.current;
      if (prev && prev !== sceneRef.current && fadeRef.current < 1) {
        // 交叉淡入：先画旧场景，再叠加新场景
        fadeRef.current = Math.min(1, fadeRef.current + dt / 0.9);
        drawScene(ctx, w, h, t, dt, prev, prevParticlesRef.current);
        ctx.globalAlpha = fadeRef.current;
        drawScene(ctx, w, h, t, dt, sceneRef.current, particlesRef.current);
        ctx.globalAlpha = 1;
        if (fadeRef.current >= 1) prevSceneRef.current = null;
      } else {
        drawScene(ctx, w, h, t, dt, sceneRef.current, particlesRef.current);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onMove = (e: PointerEvent) => {
      if (reduced) return;
      const r = wrap.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      parallax.current.tx = nx * -10;
      parallax.current.ty = ny * -7;
    };
    window.addEventListener("pointermove", onMove);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  /* 切换节点 → 换场景（交叉淡入）+ 重置打字 + 点亮探索 */
  useEffect(() => {
    const prev = sceneRef.current;
    if (prev !== sceneKey) {
      const wrap = wrapRef.current;
      if (wrap) {
        const r = wrap.getBoundingClientRect();
        prevParticlesRef.current = spawnParticles(prev, r.width + 48, r.height + 48);
      }
      prevSceneRef.current = prev;
      fadeRef.current = 0;
      particlesRef.current = [];
    }
    sceneRef.current = sceneKey;
    const wrap = wrapRef.current;
    if (wrap) {
      const r = wrap.getBoundingClientRect();
      particlesRef.current = spawnParticles(sceneKey, r.width + 48, r.height + 48);
    }
    setEnded(Boolean(node.ending));
    setUsedFx(false);
    setJustUnlocked(false);
    savedRef.current = false;

    // 首次到访 → 点亮探索图鉴（轻提示一声星闪）
    setDiscovered((ds) => {
      if (ds.some((d) => d.scene === sceneKey)) return ds;
      if (audio.hasContext) audio.twinkle();
      api.discovery.mark(sceneKey);
      return [...ds, { id: sceneKey, scene: sceneKey, visitedAt: Date.now() }];
    });

    // 场景氛围音
    if (audio.hasContext) {
      switch (sceneKey) {
        case "harbor":
          audio.pluck(196, 0.3);
          audio.playWindBurst(1.4, 0.1);
          break;
        case "lighthouse":
          audio.pluck(392, 0.25);
          break;
        case "forest":
        case "lantern":
        case "meadow":
        case "field":
          audio.twinkle();
          break;
        case "spring":
        case "rain":
        case "bridge":
          audio.splash();
          break;
        case "sea":
        case "snow":
          audio.playWindBurst(1.6, 0.1);
          break;
        case "whale":
          audio.hum();
          break;
        case "stars":
        case "dawn":
          audio.playChime(3);
          break;
        case "cave":
          audio.crystalChime();
          break;
        case "village":
          audio.pluck(330, 0.2);
          break;
        case "cloudsea":
          audio.playChime(2);
          audio.playWindBurst(1.4, 0.08);
          break;
        case "sakura":
          audio.twinkle();
          audio.playWindBurst(1.0, 0.06);
          break;
        case "lotus":
          audio.splash();
          audio.twinkle();
          break;
        case "moonrise":
          audio.playChime(3);
          break;
        case "hearth":
          audio.hum();
          audio.woodKnock();
          break;
      }
    }
  }, [nodeId, sceneKey, node.ending]);

  /* 打字机 + NPC 语音 */
  useEffect(() => {
    typedRef.current = reduced ? node.text.length : 0;
    setTyped(typedRef.current);
    if (typedRef.current >= node.text.length) return;
    const id = window.setInterval(() => {
      typedRef.current += 1;
      const ch = node.text[typedRef.current - 1];
      if ((typedRef.current - 1) % voice.every === 0 && ch && !PUNCT.test(ch)) {
        audio.npcBlip(voice.base, voice.jitter, voice.wave);
      }
      setTyped(typedRef.current);
      if (typedRef.current >= node.text.length) window.clearInterval(id);
    }, npc ? 52 : 46);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId]);

  const done = typed >= node.text.length;

  /* 文字读完：结局点亮。首次 → 星屑庆祝；重游 → 轻风铃 */
  useEffect(() => {
    if (!ended || !done || !node.ending || savedRef.current) return;
    savedRef.current = true;
    const e = node.ending;
    const isNew = !endings.some((x) => x.id === e.title);
    setJustUnlocked(isNew);
    if (isNew) {
      audio.playChime(5);
      audio.twinkle();
      buzz(20);
      const wrap = wrapRef.current;
      if (wrap) {
        const r = wrap.getBoundingClientRect();
        particlesRef.current.push(...burstFx("stars", r.width, r.height));
      }
    } else {
      audio.playChime(3);
      buzz(10);
    }
    const stored: StoredEnding = { id: e.title, title: e.title, hue: e.hue, unlockedAt: Date.now() };
    api.story.save(stored);
    setEndings((prev) => (prev.some((x) => x.id === e.title) ? prev : [...prev, stored]));
  }, [ended, done, node.ending, endings]);

  const skip = () => {
    typedRef.current = node.text.length;
    setTyped(node.text.length);
  };
  const choose = (next: string) => {
    audio.unlock();
    audio.pluck(523.25 + Math.random() * 200, 0.3);
    buzz(8);
    setPath((p) => [...p, nodeId]);
    setNodeId(next);
  };
  const back = () => {
    if (!path.length || ended) return;
    audio.pluck(392, 0.15);
    buzz(5);
    setNodeId(path[path.length - 1]);
    setPath((p) => p.slice(0, -1));
  };
  const restart = () => {
    audio.pluck(659.25, 0.2);
    setPath([]);
    setNodeId(START_ID);
  };
  const begin = () => {
    audio.unlock();
    audio.playChime(3);
    buzz(8);
    setCover(false);
  };

  const doInteract = () => {
    if (!node.interact || usedFx) return;
    audio.unlock();
    playFx(node.interact.fx);
    buzz(12);
    setUsedFx(true);
    const wrap = wrapRef.current;
    if (wrap) {
      const r = wrap.getBoundingClientRect();
      particlesRef.current.push(...burstFx(sceneKey, r.width, r.height));
    }
  };

  /* 键盘：封面 Enter 开卷 · 朗读中 Space/Enter 跳过 · 选择时 1/2/3/4 · Backspace 退一步 */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (cover) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          begin();
        }
        return;
      }
      if (!done) {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          skip();
        }
        return;
      }
      if (e.key === "Backspace") {
        back();
        return;
      }
      if (!ended && visibleChoices) {
        const idx = ["1", "2", "3", "4", "5"].indexOf(e.key);
        if (idx >= 0 && visibleChoices[idx]) choose(visibleChoices[idx].next);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cover, done, ended, node, path]);

  const litCount = endings.length;
  const speaking = !ended && !done;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-50 overflow-hidden bg-abyss"
    >
      {/* 场景画布（略放大以支持视差位移） */}
      <div ref={wrapRef} className="absolute inset-0">
        <canvas ref={canvasRef} className="absolute left-0 top-0 will-change-transform" />
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[66%] bg-gradient-to-t from-abyss via-abyss/78 to-transparent" />

      {/* 顶栏（封面时隐藏） */}
      {!cover && (
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 pt-[max(env(safe-area-inset-top),16px)]">
          <div className="flex items-center gap-2 text-apricot/90">
            <ScrollIcon size={17} />
            <span className="font-display text-base tracking-[0.28em]">灯语</span>
          </div>
          <div className="flex items-center gap-2">
            {path.length > 0 && (
              <span className="hidden items-center gap-1 sm:flex" aria-label={`已走过 ${path.length} 个选择`}>
                {path.slice(-7).map((_, i) => (
                  <span key={i} className="h-1.5 w-1.5 rounded-full bg-apricot/70" />
                ))}
              </span>
            )}
            {path.length > 0 && !ended && (
              <button
                onClick={back}
                className="flex h-10 items-center gap-1 rounded-full border border-paper/15 bg-ink/45 px-3 text-xs tracking-widest text-fog/75 transition-all active:scale-90"
                aria-label="退回上一个选择"
              >
                <ChevronLeftIcon size={15} />
                退一步
              </button>
            )}
            <span className="rounded-full border border-apricot/25 bg-ink/45 px-3 py-1 text-[11px] tracking-[0.18em] text-apricot/80">
              结局 {litCount} / {ALL_ENDINGS.length}
            </span>
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-paper/15 bg-ink/45 text-fog/70 transition-all active:scale-90"
              aria-label="离开故事"
            >
              <XIcon size={17} />
            </button>
          </div>
        </div>
      )}

      {/* 叙事区 */}
      {!cover && (
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center px-6 pb-[max(env(safe-area-inset-bottom),26px)]">
          <div className="w-full max-w-md">
            <AnimatePresence mode="wait">
              <motion.div
                key={nodeId}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                {npc && (
                  <div className="mb-3">
                    <NpcCard kind={npc.kind} speaking={speaking} />
                  </div>
                )}

                <p
                  onClick={skip}
                  className="min-h-[104px] cursor-pointer text-center font-display text-[19px] leading-[1.9] tracking-wide text-paper/95 sm:text-xl"
                  style={{ textShadow: "0 2px 18px rgba(0,0,0,0.6)" }}
                >
                  {node.text.slice(0, typed)}
                  {!done && <span className="text-apricot">｜</span>}
                </p>

                {ended && node.ending && done ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15, duration: 0.5 }}
                    className="mt-2 flex flex-col items-center gap-4"
                  >
                    {node.interact && (
                      <InteractChip label={node.interact.label} used={usedFx} onTap={doInteract} />
                    )}
                    {justUnlocked && (
                      <motion.span
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-full bg-apricot/15 px-4 py-1 text-[11px] tracking-[0.3em] text-apricot"
                      >
                        新结局点亮
                      </motion.span>
                    )}
                    <div
                      className="rounded-full px-6 py-1.5 text-[13px] tracking-[0.3em]"
                      style={{
                        color: node.ending.hue,
                        border: `1px solid ${node.ending.hue}66`,
                        background: `${node.ending.hue}14`,
                        textShadow: `0 0 16px ${node.ending.hue}88`,
                      }}
                    >
                      结局 · {node.ending.title}
                    </div>
                    <p className="text-center text-sm leading-7 text-fog/80">{node.ending.line}</p>

                    <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                      {ALL_ENDINGS.map((e) => {
                        const lit = endings.some((x) => x.id === e.title);
                        return (
                          <span
                            key={e.title}
                            className="rounded-full border px-2.5 py-0.5 text-[10px] tracking-wider transition-colors"
                            style={
                              lit
                                ? { color: e.hue, borderColor: `${e.hue}55`, background: `${e.hue}10` }
                                : { color: "rgba(143,176,189,0.4)", borderColor: "rgba(143,176,189,0.15)" }
                            }
                          >
                            {lit ? e.title : "？？"}
                          </span>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        onClick={restart}
                        className="flex h-12 items-center gap-2 rounded-full border border-apricot/50 bg-apricot/12 px-6 text-sm tracking-[0.2em] text-apricot transition-all active:scale-95"
                      >
                        <CompassIcon size={17} />
                        再走一遍
                      </button>
                      <button
                        onClick={onClose}
                        className="h-12 rounded-full border border-paper/15 px-6 text-sm tracking-[0.2em] text-fog/75 transition-all active:scale-95"
                      >
                        回到岛上
                      </button>
                    </div>
                  </motion.div>
                ) : done && visibleChoices ? (
                  <div className="mt-3 flex flex-col gap-2.5">
                    {node.interact && <InteractChip label={node.interact.label} used={usedFx} onTap={doInteract} />}
                    {visibleChoices.map((c, i) => (
                      <motion.button
                        key={c.label}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.08 * i + 0.12, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => choose(c.next)}
                        className="group flex min-h-[52px] items-center justify-between rounded-2xl border border-apricot/22 bg-ink/55 px-5 text-left text-[15px] tracking-wide text-paper/90 backdrop-blur-[2px] transition-colors duration-300 hover:border-apricot/55 hover:bg-ink/75"
                      >
                        <span>{c.label}</span>
                        <span className="ml-3 text-apricot/60 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-apricot">
                          →
                        </span>
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  !done && (
                    <p className="mt-3 text-center text-[11px] tracking-[0.24em] text-fog/40">
                      点一点文字，读快一些
                    </p>
                  )
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* 封面：开卷前的仪式感 */}
      {cover && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-20 flex flex-col items-center justify-center px-8 text-center"
        >
          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex max-h-full flex-col items-center gap-4 overflow-y-auto py-6"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full border border-apricot/40 bg-apricot/10 text-apricot shadow-[0_0_30px_rgba(244,196,143,0.25)]">
              <ScrollIcon size={26} />
            </span>
            <div>
              <h2 className="font-display text-4xl tracking-[0.4em] pl-[0.4em] text-paper text-glow">灯语</h2>
              <p className="mt-3 text-[13px] tracking-[0.3em] text-fog/70">一段会听风说话的旅程</p>
            </div>
            <p className="max-w-[280px] text-xs leading-6 text-fog/55">
              每一次选择，都会走向不同的光。
              <br />
              慢慢走，岛上不赶时间。
            </p>

            {/* 足迹：去过的地方会发光 */}
            <div>
              <p className="mb-2 text-[10px] tracking-[0.3em] text-fog/50">
                足迹 · {discovered.length} / {ALL_SCENES.length}
              </p>
              <div className="flex max-w-[320px] flex-wrap items-center justify-center gap-1.5">
                {ALL_SCENES.map((s) => {
                  const lit = discovered.some((d) => d.scene === s);
                  const meta = SCENE_META[s];
                  return (
                    <span
                      key={s}
                      className="rounded-full border px-2.5 py-0.5 text-[10px] tracking-wider"
                      style={
                        lit
                          ? { color: meta.hue, borderColor: `${meta.hue}55`, background: `${meta.hue}10` }
                          : { color: "rgba(143,176,189,0.35)", borderColor: "rgba(143,176,189,0.14)" }
                      }
                    >
                      {lit ? meta.name : "未至之地"}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* 结局收集 */}
            <div className="flex max-w-[320px] flex-wrap items-center justify-center gap-1.5">
              {ALL_ENDINGS.map((e) => {
                const lit = endings.some((x) => x.id === e.title);
                return (
                  <span
                    key={e.title}
                    className="rounded-full border px-2.5 py-0.5 text-[10px] tracking-wider"
                    style={
                      lit
                        ? { color: e.hue, borderColor: `${e.hue}55`, background: `${e.hue}10` }
                        : { color: "rgba(143,176,189,0.4)", borderColor: "rgba(143,176,189,0.15)" }
                    }
                  >
                    {lit ? e.title : "？？"}
                  </span>
                );
              })}
            </div>

            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={begin}
              className="mt-1 flex h-14 items-center rounded-full bg-apricot px-9 text-base tracking-[0.3em] pl-[2.2em] text-abyss shadow-[0_0_36px_rgba(244,196,143,0.45)]"
            >
              翻开故事
            </motion.button>
            <p className="text-[10px] tracking-[0.24em] text-fog/40">
              已点亮 {litCount} / {ALL_ENDINGS.length} 个结局 · Enter 开卷
            </p>
          </motion.div>
          <button
            onClick={onClose}
            className="absolute right-5 top-[max(env(safe-area-inset-top),16px)] flex h-10 w-10 items-center justify-center rounded-full border border-paper/15 bg-ink/45 text-fog/70 transition-all active:scale-90"
            aria-label="离开故事"
          >
            <XIcon size={17} />
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}

/** 「试一试」互动彩蛋按钮 */
function InteractChip({ label, used, onTap }: { label: string; used: boolean; onTap: () => void }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      whileTap={{ scale: used ? 1 : 0.94 }}
      onClick={onTap}
      disabled={used}
      className={`mx-auto mb-2.5 flex h-11 items-center gap-2 rounded-full border px-5 text-[13px] tracking-[0.18em] transition-all duration-300 ${
        used
          ? "border-moss/35 bg-moss/8 text-moss/80"
          : "border-mist/45 bg-mist/10 text-mist shadow-[0_0_18px_rgba(163,193,214,0.18)] hover:bg-mist/16"
      }`}
    >
      <SparkIcon size={14} />
      {used ? "试过了 · 它在发光" : `试一试 · ${label}`}
    </motion.button>
  );
}
