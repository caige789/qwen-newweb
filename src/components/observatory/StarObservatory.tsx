import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { audio } from "../../lib/audio";
import { buzz } from "../../lib/haptics";
import { SparkIcon, XIcon } from "../shared/icons";

export interface Constellation {
  id: string;
  name: string;
  color: string;
  pts: { x: number; y: number }[];
  edges: [number, number][];
}

const COLORS = ["#a3c1d6", "#f4c48f", "#e5a3ac", "#aecaa4", "#c9b8d9"];

interface Star {
  x: number;
  y: number;
  r: number;
  big: boolean;
  ph: number;
}

export default function StarObservatory({
  onClose,
  constellations,
  onChange,
}: {
  onClose: () => void;
  constellations: Constellation[];
  onChange: (cs: Constellation[]) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  /* 点星连线（进行中） */
  const [picks, setPicks] = useState<number[]>([]);
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");
  const colorIdx = useRef(constellations.length);

  const stars = useMemo<Star[]>(() => {
    const n = Math.min(90, Math.max(48, Math.floor((window.innerWidth * window.innerHeight) / 9000)));
    return Array.from({ length: n }, () => ({
      x: 0.04 + Math.random() * 0.92,
      y: 0.05 + Math.random() * 0.72,
      r: 0.8 + Math.random() * 1.6,
      big: Math.random() < 0.18,
      ph: Math.random() * Math.PI * 2,
    }));
  }, []);

  /* 星空画布 */
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
      w = r.width;
      h = r.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    let raf = 0;
    const loop = (now: number) => {
      const t = now / 1000;
      ctx.clearRect(0, 0, w, h);

      // 已点亮的星座
      for (const c of constellations) {
        ctx.strokeStyle = `${c.color}66`;
        ctx.lineWidth = 1.2;
        for (const [a, b] of c.edges) {
          const pa = c.pts[a];
          const pb = c.pts[b];
          if (!pa || !pb) continue;
          ctx.beginPath();
          ctx.moveTo(pa.x * w, pa.y * h);
          ctx.lineTo(pb.x * w, pb.y * h);
          ctx.stroke();
        }
        for (const p of c.pts) {
          const glow = 0.6 + 0.4 * Math.sin(t * 2 + p.x * 20);
          ctx.globalCompositeOperation = "lighter";
          const g = ctx.createRadialGradient(p.x * w, p.y * h, 0, p.x * w, p.y * h, 8);
          g.addColorStop(0, `${c.color}${Math.round(glow * 90).toString(16).padStart(2, "0")}`);
          g.addColorStop(1, `${c.color}00`);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.x * w, p.y * h, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalCompositeOperation = "source-over";
          ctx.fillStyle = c.color;
          ctx.beginPath();
          ctx.arc(p.x * w, p.y * h, 2.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 背景星
      for (const s of stars) {
        const a = 0.25 + 0.5 * (0.5 + 0.5 * Math.sin(t * 1.5 + s.ph));
        ctx.fillStyle = `rgba(235,240,250,${a.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
        ctx.fill();
        if (s.big) {
          ctx.strokeStyle = `rgba(235,240,250,${(a * 0.5).toFixed(3)})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(s.x * w - 5, s.y * h);
          ctx.lineTo(s.x * w + 5, s.y * h);
          ctx.moveTo(s.x * w, s.y * h - 5);
          ctx.lineTo(s.x * w, s.y * h + 5);
          ctx.stroke();
        }
      }

      // 进行中的连线
      if (picks.length > 0) {
        ctx.strokeStyle = "rgba(244,196,143,0.7)";
        ctx.lineWidth = 1.4;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        picks.forEach((idx, i) => {
          const s = stars[idx];
          if (i === 0) ctx.moveTo(s.x * w, s.y * h);
          else ctx.lineTo(s.x * w, s.y * h);
        });
        ctx.stroke();
        ctx.setLineDash([]);
        for (const idx of picks) {
          const s = stars[idx];
          ctx.fillStyle = "#f4c48f";
          ctx.beginPath();
          ctx.arc(s.x * w, s.y * h, 3.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [stars, picks, constellations]);

  /* 点星 */
  const onCanvasTap = (e: React.PointerEvent) => {
    if (naming) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    let best = -1;
    let bestD = 0.06;
    stars.forEach((s, i) => {
      const d = Math.hypot(s.x - x, s.y - y);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    if (best < 0) return;
    audio.unlock();
    if (picks[picks.length - 1] === best) return;
    audio.pluck(659.25 + picks.length * 60, 0.2);
    buzz(5);
    setPicks((p) => [...p, best]);
  };

  const undo = () => setPicks((p) => p.slice(0, -1));
  const clearPicks = () => setPicks([]);

  const save = () => {
    const finalName = name.trim() || `无名星群${constellations.length + 1}`;
    const color = COLORS[colorIdx.current % COLORS.length];
    colorIdx.current += 1;
    const pts = picks.map((i) => ({ x: stars[i].x, y: stars[i].y }));
    const edges: [number, number][] = [];
    for (let i = 0; i < picks.length - 1; i++) edges.push([i, i + 1]);
    const c: Constellation = {
      id: `${Date.now()}`,
      name: finalName,
      color,
      pts,
      edges,
    };
    onChange([...constellations, c]);
    audio.playChime(4);
    audio.twinkle();
    buzz(16);
    setPicks([]);
    setName("");
    setNaming(false);
  };

  const release = (id: string) => {
    onChange(constellations.filter((c) => c.id !== id));
    audio.playWindBurst(0.8, 0.08);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 overflow-hidden"
      style={{ background: "linear-gradient(180deg,#04070c 0%,#081120 45%,#0e1e30 80%,#12283a 100%)" }}
    >
      <div ref={wrapRef} className="absolute inset-0">
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full touch-none" onPointerDown={onCanvasTap} />
      </div>

      {/* 顶栏 */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 pt-[max(env(safe-area-inset-top),16px)]">
        <div className="flex items-center gap-2 text-mist">
          <SparkIcon size={17} />
          <span className="font-display text-base tracking-[0.28em]">观星台</span>
        </div>
        <button
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-paper/15 bg-ink/45 text-fog/70 transition-all active:scale-90"
          aria-label="离开观星台"
        >
          <XIcon size={17} />
        </button>
      </div>

      {/* 底部操作 */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 px-6 pb-[max(env(safe-area-inset-bottom),22px)]">
        <AnimatePresence>
          {naming ? (
            <motion.div
              key="name"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex w-full max-w-sm items-center gap-2"
            >
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={6}
                autoFocus
                placeholder="给它起个名字"
                className="h-12 min-w-0 flex-1 rounded-full border border-mist/35 bg-ink/70 px-5 text-base text-paper placeholder:text-fog/40 focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter") save();
                }}
              />
              <button
                onClick={save}
                className="h-12 shrink-0 rounded-full bg-mist px-6 text-sm tracking-[0.2em] text-abyss shadow-[0_0_20px_rgba(163,193,214,0.35)] transition-transform active:scale-95"
              >
                点亮
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="ops"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex flex-col items-center gap-3"
            >
              {picks.length >= 2 ? (
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={undo}
                    className="h-11 rounded-full border border-paper/15 bg-ink/50 px-5 text-xs tracking-widest text-fog/75 transition-all active:scale-95"
                  >
                    退一笔
                  </button>
                  <button
                    onClick={clearPicks}
                    className="h-11 rounded-full border border-paper/15 bg-ink/50 px-5 text-xs tracking-widest text-fog/75 transition-all active:scale-95"
                  >
                    重来
                  </button>
                  <button
                    onClick={() => setNaming(true)}
                    className="h-11 rounded-full bg-mist px-6 text-sm tracking-[0.2em] text-abyss shadow-[0_0_20px_rgba(163,193,214,0.35)] transition-transform active:scale-95"
                  >
                    连好了 · 命名
                  </button>
                </div>
              ) : (
                <p className="rounded-full border border-paper/10 bg-abyss/50 px-5 py-2 text-xs tracking-[0.22em] text-paper/70">
                  轻点星星，把它们连成你的星座
                </p>
              )}

              {/* 已点亮的星座 */}
              {constellations.length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  {constellations.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => release(c.id)}
                      className="rounded-full border px-3 py-1 text-[11px] tracking-wider transition-all active:scale-95"
                      style={{ color: c.color, borderColor: `${c.color}55`, background: `${c.color}10` }}
                      title="点一下，把它放归星空"
                    >
                      {c.name} · {c.pts.length} 星
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
