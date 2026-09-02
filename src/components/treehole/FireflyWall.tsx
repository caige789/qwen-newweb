import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { audio } from "../../lib/audio";
import { buzz } from "../../lib/haptics";
import { api } from "../../lib/api";
import { wallNotes } from "../../lib/wallNotes";

interface FireflyMsg {
  id: string;
  text: string;
  mine: boolean;
}

/** 萤火墙 —— 每只萤火虫是一句匿名旅人的话，轻点即亮；你写的也化作萤火 */
export default function FireflyWall() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<FireflyMsg[]>([]);
  const [revealed, setRevealed] = useState<FireflyMsg | null>(null);
  const [writing, setWriting] = useState(false);
  const [draft, setDraft] = useState("");
  const msgsRef = useRef<FireflyMsg[]>([]);

  /* 每只萤的轨迹参数（与消息一一对应，按 index 取） */
  const flies = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        nx: 0.08 + ((i * 137) % 84) / 100,
        ny: 0.1 + ((i * 211) % 62) / 100,
        ph: (i * 2.4) % (Math.PI * 2),
        sp: 0.5 + ((i * 71) % 50) / 60,
      })),
    []
  );

  /* 读档：自己留下的萤火 */
  useEffect(() => {
    let alive = true;
    api.seed.list().then((seeds) => {
      if (!alive) return;
      const mine = seeds
        .filter((s) => s.kind === "wall-firefly")
        .map((s) => ({
          id: s.id,
          text: (s.payload as { text?: string })?.text ?? "",
          mine: true,
        }))
        .filter((m) => m.text);
      const pool = wallNotes
        .slice()
        .sort(() => Math.random() - 0.5)
        .map((text, i) => ({ id: `pool-${i}`, text, mine: false }));
      const all = [...mine, ...pool].slice(0, 16);
      msgsRef.current = all;
      setMessages(all);
    });
    return () => {
      alive = false;
    };
  }, []);

  /* 萤火画布 */
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
      const list = msgsRef.current;
      list.forEach((m, i) => {
        const f = flies[i % flies.length];
        const x = (f.nx + Math.sin(t * 0.32 * f.sp + f.ph) * 0.05) * w;
        const y = (f.ny + Math.cos(t * 0.26 * f.sp + f.ph * 1.6) * 0.055) * h;
        const tw = 0.45 + 0.5 * Math.sin(t * 1.9 * f.sp + f.ph);
        const hue = m.mine ? "255,196,143" : "255,224,150";
        ctx.globalCompositeOperation = "lighter";
        const g = ctx.createRadialGradient(x, y, 0, x, y, 13);
        g.addColorStop(0, `rgba(${hue},${(0.55 * tw).toFixed(3)})`);
        g.addColorStop(0.5, `rgba(${hue},${(0.16 * tw).toFixed(3)})`);
        g.addColorStop(1, `rgba(${hue},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(255,244,214,${(0.4 + 0.6 * tw).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(x, y, 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = "source-over";
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [flies]);

  /* 点萤 */
  const onTap = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const r = wrap.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const w = r.width;
    const h = r.height;
    const t = performance.now() / 1000;
    const list = msgsRef.current;
    for (let i = 0; i < list.length; i++) {
      const f = flies[i % flies.length];
      const fx = (f.nx + Math.sin(t * 0.32 * f.sp + f.ph) * 0.05) * w;
      const fy = (f.ny + Math.cos(t * 0.26 * f.sp + f.ph * 1.6) * 0.055) * h;
      if (Math.hypot(fx - x, fy - y) < 34) {
        audio.unlock();
        audio.twinkle();
        buzz(8);
        setRevealed(list[i]);
        return;
      }
    }
  };

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    audio.unlock();
    audio.playChime(3);
    buzz(14);
    const id = `wall-${Date.now()}`;
    api.seed.save({ id, kind: "wall-firefly", payload: { text, at: Date.now() }, updatedAt: Date.now() });
    const msg: FireflyMsg = { id, text, mine: true };
    const next = [msg, ...msgsRef.current.filter((m) => !m.mine)].slice(0, 16);
    msgsRef.current = next;
    setMessages(next);
    setDraft("");
    setWriting(false);
    setRevealed(msg);
  };

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div ref={wrapRef} className="absolute inset-0">
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full touch-none" onPointerDown={onTap} />
      </div>

      {/* 顶部提示 */}
      <div className="pointer-events-none absolute inset-x-0 top-2 flex justify-center">
        <p className="rounded-full border border-paper/8 bg-abyss/45 px-5 py-2 text-xs tracking-[0.22em] text-paper/70">
          每只萤火，是一句旅人留下的话 · 轻点它
        </p>
      </div>

      {/* 点亮的句子 */}
      <AnimatePresence>
        {revealed && (
          <motion.div
            key={revealed.id}
            initial={{ opacity: 0, y: 22, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.97 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-x-5 bottom-20 mx-auto max-w-sm"
          >
            <div className="panel rounded-3xl px-6 py-5 text-center">
              <p className="text-[15px] leading-7 text-paper/90">「{revealed.text}」</p>
              <p className="mt-2 text-[10px] tracking-[0.28em] text-fog/50">
                {revealed.mine ? "—— 你留下的萤火" : "—— 一位路过的旅人"}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 写一句 */}
      <div className="absolute inset-x-5 bottom-3 mx-auto max-w-sm">
        <AnimatePresence mode="wait">
          {writing ? (
            <motion.div
              key="editor"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="breath-input flex items-end gap-2 rounded-3xl bg-deep/90 p-3 pl-5"
            >
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={40}
                rows={1}
                autoFocus
                placeholder="留一句给后来的旅人……"
                className="min-h-[40px] min-w-0 flex-1 resize-none bg-transparent text-base leading-6 text-paper placeholder:text-fog/40 focus:outline-none"
              />
              <button
                onClick={send}
                disabled={!draft.trim()}
                className="flex h-10 shrink-0 items-center rounded-full bg-apricot px-5 text-sm tracking-[0.2em] text-abyss transition-all enabled:shadow-[0_0_16px_rgba(244,196,143,0.45)] enabled:active:scale-95 disabled:opacity-30"
              >
                化萤
              </button>
            </motion.div>
          ) : (
            <motion.button
              key="btn"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                audio.unlock();
                audio.pluck(587.33, 0.1);
                setWriting(true);
                setRevealed(null);
              }}
              className="mx-auto flex h-12 items-center gap-2 rounded-full border border-apricot/40 bg-ink/60 px-7 text-sm tracking-[0.24em] text-apricot shadow-[0_0_20px_rgba(244,196,143,0.15)]"
            >
              ✦ 也留一句
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* 计数 */}
      {messages.length > 0 && (
        <p className="pointer-events-none absolute right-4 top-2 text-[10px] tracking-[0.22em] text-fog/45">
          此刻 {messages.length} 只萤火
        </p>
      )}
    </div>
  );
}
