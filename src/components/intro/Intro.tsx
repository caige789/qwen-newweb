import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { DayPhase } from "../../hooks/useDayPhase";
import { timeLines } from "../../hooks/useDayPhase";
import { getSolarTerm } from "../../lib/solarTerms";
import type { WeatherInfo } from "../../hooks/useWeather";
import { WxIcon } from "../shared/WeatherChip";

interface Props {
  onEnter: () => void;
  phase: DayPhase;
  greeting: string;
  wx?: WeatherInfo | null;
}

/** 登岛页：竖排岛名 + 上升光点 + 随时辰变化的问候 */
export default function Intro({ onEnter, phase, greeting, wx }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [line1, line2] = timeLines(phase);
  const term = useMemo(() => getSolarTerm(), []);
  /* 登岛页也有一口在走的钟 */
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const p = (n: number) => String(n).padStart(2, "0");

  /* 缓缓上升的光点 */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const motes = Array.from({ length: 26 }, () => ({
      x: Math.random() * 1,
      y: Math.random() * 1,
      r: 0.8 + Math.random() * 1.8,
      sp: 0.012 + Math.random() * 0.03,
      ph: Math.random() * Math.PI * 2,
    }));

    let raf = 0;
    const loop = (now: number) => {
      const t = now / 1000;
      ctx.clearRect(0, 0, w, h);
      for (const m of motes) {
        m.y -= m.sp * 0.016 * 60 * 0.016;
        if (m.y < -0.05) {
          m.y = 1.05;
          m.x = Math.random();
        }
        const x = m.x * w + Math.sin(t * 0.7 + m.ph) * 10;
        const y = m.y * h;
        const a = 0.2 + 0.3 * (0.5 + 0.5 * Math.sin(t * 1.6 + m.ph));
        const g = ctx.createRadialGradient(x, y, 0, x, y, m.r * 4);
        g.addColorStop(0, `rgba(255,227,174,${a.toFixed(3)})`);
        g.addColorStop(1, "rgba(255,227,174,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, m.r * 4, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <motion.div
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-0 z-30 flex flex-col items-center justify-center"
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      <div className="relative flex flex-col items-center gap-8 px-8">
        {/* 竖排岛名 */}
        <div className="flex items-center gap-5">
          <motion.h1
            className="vertical-rl font-display text-5xl tracking-[0.5em] text-paper text-glow sm:text-6xl"
            initial={{ opacity: 0, y: -18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            治愈光屿
          </motion.h1>
          <motion.div
            className="flex flex-col items-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <span className="h-16 w-px bg-gradient-to-b from-transparent via-apricot/60 to-transparent" />
            <span className="flex h-9 w-9 items-center justify-center rounded-[6px] bg-ember/90 font-display text-sm text-abyss shadow-[0_0_18px_rgba(232,153,106,0.5)]">
              屿
            </span>
          </motion.div>
        </div>

        {/* 随时辰的问候 */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8 }}
        >
          <p className="text-[15px] leading-8 text-mist/85 sm:text-lg">
            {line1}
            <br />
            {line2}
          </p>
          <p className="mt-2 text-xs tracking-[0.32em] text-apricot/75">{greeting}</p>
          <p className="mt-1.5 text-[11px] tracking-[0.24em] text-fog/55">
            今日{term.name} · 「{term.poem}」
          </p>
          {/* 实时时间 + 此刻天气 */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.7 }}
            className="mt-3 flex items-center justify-center gap-2.5 rounded-full border border-paper/10 bg-abyss/40 px-4 py-1.5"
          >
            <span className="font-display text-sm tracking-[0.12em] text-paper/90 tabular-nums">
              {p(now.getHours())}:{p(now.getMinutes())}
              <span className="text-fog/50">:{p(now.getSeconds())}</span>
            </span>
            {wx && (
              <>
                <span className="h-3 w-px bg-paper/15" />
                <span className="flex items-center gap-1.5 text-xs text-paper/80 tabular-nums">
                  <WxIcon kind={wx.kind} size={15} />
                  {wx.temp}°{wx.label} · {wx.city}
                </span>
              </>
            )}
          </motion.div>
        </motion.div>

        {/* 登岛 */}
        <motion.button
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.7 }}
          whileTap={{ scale: 0.94 }}
          onClick={onEnter}
          className="group relative flex h-16 w-16 items-center justify-center"
          aria-label="进入光屿"
        >
          <span className="glow-breathe absolute inset-0 rounded-full" />
          <span className="absolute inset-0 rounded-full border border-apricot/50 bg-ink/40 transition-colors duration-300 group-hover:bg-apricot/12" />
          <span className="font-display text-lg tracking-[0.3em] pl-[0.3em] text-apricot">登岛</span>
        </motion.button>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3, duration: 0.8 }}
          className="text-[11px] tracking-[0.28em] text-fog/50"
        >
          不需要登录 · 不留下数据 · 随便点点
        </motion.p>
      </div>
    </motion.div>
  );
}
