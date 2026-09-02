import { useEffect, useMemo, useRef, useState } from "react";
import type { DayPhase } from "../../hooks/useDayPhase";
import type { WxKind } from "../../hooks/useWeather";
import { audio } from "../../lib/audio";

interface Star {
  x: number;
  y: number;
  r: number;
  delay: number;
}

const SKY_CLASSES: DayPhase[] = ["dawn", "morning", "noon", "afternoon", "dusk", "evening", "night"];

/** 每个时辰的太阳位置 / 光色（null = 此时无日） */
const SUN: Partial<Record<DayPhase, { x: string; y: string; s: number; hue: string }>> = {
  dawn: { x: "70%", y: "60%", s: 1.05, hue: "rgba(255,196,138," },
  morning: { x: "74%", y: "26%", s: 0.85, hue: "rgba(255,238,200," },
  noon: { x: "52%", y: "10%", s: 1.1, hue: "rgba(255,246,214," },
  afternoon: { x: "26%", y: "24%", s: 0.95, hue: "rgba(255,222,164," },
  dusk: { x: "46%", y: "68%", s: 1.35, hue: "rgba(255,170,104," },
};

/** 天气带来的天光调整 */
const WX_VEIL: Partial<Record<WxKind, string>> = {
  rain: "rgba(6,14,20,0.42)",
  storm: "rgba(4,10,16,0.5)",
  snow: "rgba(16,26,36,0.3)",
  cloud: "rgba(96,116,128,0.2)",
  fog: "rgba(176,190,198,0.16)",
};

/** 七时天色 + 星尘 + 日月 + 流云 + 提灯小船 + 随音乐呼吸的灯塔 + 实时天气层 */
export default function AmbientBackground({ phase, wx }: { phase: DayPhase; wx?: WxKind | null }) {
  const stars = useMemo<Star[]>(
    () =>
      Array.from({ length: 70 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 58,
        r: 0.5 + Math.random() * 1.5,
        delay: Math.random() * 6,
      })),
    []
  );
  const starDensity =
    phase === "night" ? 1 : phase === "evening" ? 0.85 : phase === "dusk" ? 0.5 : phase === "dawn" ? 0.32 : 0.1;

  /* 灯塔之光随音乐律动 */
  const [glow, setGlow] = useState(0);
  const freqRef = useRef(new Uint8Array(128));
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      if (audio.hasContext && audio.getFrequencyData(freqRef.current)) {
        let low = 0;
        for (let i = 0; i < 8; i++) low += freqRef.current[i];
        setGlow(Math.min(1, (low / (8 * 255)) * 3.2));
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  /* 夜晚偶有流星 */
  const [meteor, setMeteor] = useState<{ id: number; x: number; y: number } | null>(null);
  useEffect(() => {
    if (phase !== "night" && phase !== "evening" && phase !== "dusk") return;
    const id = window.setInterval(() => {
      setMeteor({ id: Date.now(), x: 10 + Math.random() * 60, y: 6 + Math.random() * 22 });
      window.setTimeout(() => setMeteor(null), 1500);
    }, 14000 + Math.random() * 8000);
    return () => window.clearInterval(id);
  }, [phase]);

  const sun = SUN[phase] ?? null;
  const showMoon = phase === "evening" || phase === "night" || phase === "dusk";
  const veil = wx ? WX_VEIL[wx] ?? null : null;
  const raining = wx === "rain" || wx === "storm";
  const snowing = wx === "snow";

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      {/* 七时天色（交叉淡入） */}
      {SKY_CLASSES.map((p) => (
        <div key={p} className={`sky-layer sky-${p} ${phase === p ? "!opacity-100" : ""}`} />
      ))}

      {/* 星 */}
      <svg className="absolute inset-0 h-full w-full" style={{ opacity: starDensity, transition: "opacity 3s" }}>
        {stars.map((s, i) => (
          <circle key={i} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill="#f4ecdd" opacity={0.25 + ((i * 37) % 50) / 100}>
            <animate
              attributeName="opacity"
              values="0.2;0.8;0.2"
              dur={`${3 + (i % 5)}s`}
              begin={`${s.delay}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))}
      </svg>

      {/* 日 */}
      {sun && (
        <div
          className="absolute rounded-full transition-all duration-[3000ms]"
          style={{
            left: sun.x,
            top: sun.y,
            width: 90 * sun.s,
            height: 90 * sun.s,
            background: `radial-gradient(circle, ${sun.hue}0.9), ${sun.hue}0) 70%)`,
            boxShadow: `0 0 80px 30px ${sun.hue}0.25)`,
          }}
        />
      )}
      {/* 月 */}
      {showMoon && (
        <div
          className="absolute rounded-full transition-all duration-[3000ms]"
          style={{
            left: phase === "dusk" ? "14%" : "18%",
            top: phase === "dusk" ? "20%" : "12%",
            width: 62,
            height: 62,
            background: "radial-gradient(circle at 38% 34%, #fdf6e6, #e8d9b8 70%)",
            boxShadow: "0 0 50px 12px rgba(244,236,221,0.18)",
            opacity: phase === "dusk" ? 0.65 : 1,
          }}
        >
          <div className="absolute left-[22%] top-[30%] h-3 w-3 rounded-full bg-[#d8c8a4]/60" />
          <div className="absolute left-[55%] top-[55%] h-4 w-4 rounded-full bg-[#d8c8a4]/45" />
        </div>
      )}

      {/* 流星 */}
      {meteor && (
        <div
          key={meteor.id}
          className="absolute h-px w-24 origin-left rounded-full bg-gradient-to-r from-transparent via-[#f4ecdd] to-transparent"
          style={{
            left: `${meteor.x}%`,
            top: `${meteor.y}%`,
            transform: "rotate(18deg)",
            animation: "meteor-fly 1.4s ease-in forwards",
          }}
        />
      )}
      <style>{`@keyframes meteor-fly{from{opacity:0;transform:rotate(18deg) translateX(0)}15%{opacity:.9}to{opacity:0;transform:rotate(18deg) translateX(46vw)}}`}</style>

      {/* 流云 */}
      <div
        className="cloud-a absolute left-[8%] top-[16%] h-16 w-64 rounded-full"
        style={{ background: "radial-gradient(60% 100% at 50% 50%, rgba(200,215,225,0.14), transparent 70%)" }}
      />
      <div
        className="cloud-b absolute right-[6%] top-[28%] h-14 w-52 rounded-full"
        style={{ background: "radial-gradient(60% 100% at 50% 50%, rgba(200,215,225,0.11), transparent 70%)" }}
      />

      {/* 呼吸光晕 */}
      <div className="glow-breathe absolute inset-x-0 bottom-0 h-[46%]" />
      <div className="glow-drift-a absolute inset-0" />
      <div className="glow-drift-b absolute inset-0" />

      {/* 提灯小船 */}
      <div className="boat-sail absolute bottom-[9%] left-0 w-16">
        <div className="boat-bob">
          <svg viewBox="0 0 64 44" className="w-full">
            <circle cx="30" cy="10" r="9" fill="rgba(255,214,150,0.25)" className="lantern" />
            <circle cx="30" cy="10" r="3.5" fill="#ffd98c" className="lantern" />
            <path d="M30 13v7" stroke="#8a6a4a" strokeWidth="1.6" />
            <path d="M8 26h48l-8 10H16Z" fill="#12262f" />
            <path d="M14 26h36" stroke="#1d3641" strokeWidth="1.6" />
          </svg>
          <div
            className="mx-auto -mt-1 h-2 w-12 rounded-full"
            style={{ background: "radial-gradient(ellipse, rgba(255,214,150,0.28), transparent 70%)" }}
          />
        </div>
      </div>

      {/* 远岛与灯塔 */}
      <svg
        className="absolute inset-x-0 bottom-0 h-[26%] w-full"
        viewBox="0 0 400 130"
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          d="M0 130 L0 96 C40 84 70 78 110 74 C150 70 180 60 210 58 C250 56 290 66 330 78 C360 86 380 92 400 96 L400 130 Z"
          fill="#08151b"
        />
        <path d="M196 58 L202 22 L214 22 L220 58 Z" fill="#0c1c25" />
        <rect x="199" y="12" width="18" height="11" rx="3" fill="#13262f" />
        <g style={{ opacity: 0.55 + glow * 0.45, transition: "opacity 0.25s" }}>
          <circle cx="208" cy="17" r="14" fill="rgba(255,217,160,0.16)" />
          <circle cx="208" cy="17" r="5" fill="#ffd9a0" />
        </g>
        {/* 水面反光随音乐微亮 */}
        <g style={{ opacity: 0.25 + glow * 0.5, transition: "opacity 0.3s" }}>
          <rect x="150" y="104" width="40" height="1.6" rx="0.8" fill="rgba(255,217,160,0.5)" />
          <rect x="210" y="110" width="56" height="1.4" rx="0.7" fill="rgba(255,217,160,0.35)" />
          <rect x="120" y="116" width="30" height="1.2" rx="0.6" fill="rgba(255,217,160,0.3)" />
        </g>
      </svg>

      {/* 实时天气层：天光压暗 + 雨 / 雪 */}
      {veil && <div className="wx-veil" style={{ background: veil, opacity: 1 }} />}
      {raining && (
        <>
          <div className="wx-rain-layer" />
          <div className="wx-rain-layer slow" />
        </>
      )}
      {snowing && <div className="wx-snow-layer" />}
    </div>
  );
}
