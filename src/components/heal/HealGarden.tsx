import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { audio, type NoiseLayerId } from "../../lib/audio";
import { buzz } from "../../lib/haptics";
import { useShake } from "../../hooks/useShake";
import { FlowerIcon, HandShakeIcon, MoonIcon, RainIcon, SparkIcon, SunLikeIcon, WindIcon } from "../shared/icons-extra";

type Kind = "petal" | "leaf" | "star" | "ring" | "trail" | "spark" | "raindrop" | "snowflake" | "splashring";
type Weather = "clear" | "rain" | "snow";

interface P {
  kind: Kind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  rot: number;
  vr: number;
  phase: number;
  color: string;
}

interface Planted {
  x: number;
  y: number;
  hue: string;
  born: number;
  petals: number;
}

const PETALS = ["#f2a7b8", "#f4c1cd", "#e8a3ac", "#f0b39a"];
const LEAVES = ["#aecaa4", "#9dbf92", "#c3d4a8"];
const STAR = "#f5d9a0";
const FLOWER_HUES = ["#f4c48f", "#e5a3ac", "#aecaa4", "#a3c1d6", "#c9b8d9"];

const HINTS: Record<Weather, string[]> = {
  clear: [
    "轻点屏幕 · 落一朵花",
    "按住不动 · 唤一圈光",
    "指尖滑动 · 留一道光痕",
    "摇一摇手机 · 下一场花雨",
    "按住更久一点 · 种一朵花",
  ],
  rain: ["雨落进海里，会荡开涟漪", "轻点水面 · 溅一朵水花", "雨声是岛在轻轻说话"],
  snow: ["雪落得很慢，心事也可以很慢", "轻点一下 · 扬一簇雪雾"],
};

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
const PLANT_HOLD_MS = 1050;

export default function HealGarden({ night = false }: { night?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const particles = useRef<P[]>([]);
  const plantedRef = useRef<Planted[]>([]);
  const [count, setCount] = useState(0);
  const [plantedCount, setPlantedCount] = useState(0);
  const [caught, setCaught] = useState(0);
  const [hintIdx, setHintIdx] = useState(0);
  const [weather, setWeather] = useState<Weather>("clear");
  const weatherRef = useRef<Weather>("clear");

  const nightRef = useRef(night);
  const firefliesRef = useRef<{ nx: number; ny: number; ph: number; sp: number }[]>([]);
  useEffect(() => {
    nightRef.current = night;
    if (night && !firefliesRef.current.length) {
      firefliesRef.current = Array.from({ length: 10 }, () => ({
        nx: 0.06 + Math.random() * 0.88,
        ny: 0.08 + Math.random() * 0.62,
        ph: Math.random() * Math.PI * 2,
        sp: 0.6 + Math.random(),
      }));
    }
  }, [night]);

  const pointer = useRef({
    down: false,
    moved: false,
    long: false,
    planted: false,
    x: 0,
    y: 0,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    downAt: 0,
    pressTimer: null as number | null,
    ringTimer: null as number | null,
    plantTimer: null as number | null,
  });

  /* ---------- 粒子生成 ---------- */
  const spawn = (p: P) => {
    const arr = particles.current;
    if (arr.length > 560) arr.splice(0, arr.length - 560);
    arr.push(p);
  };

  const spawnPetalsAt = (x: number, y: number, n: number) => {
    for (let i = 0; i < n; i++) {
      const ang = rand(0, Math.PI * 2);
      const sp = rand(26, 90);
      spawn({
        kind: Math.random() < 0.72 ? "petal" : "leaf",
        x, y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp - 40,
        life: 0,
        max: rand(1.6, 2.6),
        size: rand(5, 10),
        rot: rand(0, Math.PI * 2),
        vr: rand(-2.4, 2.4),
        phase: rand(0, Math.PI * 2),
        color: Math.random() < 0.72 ? pick(PETALS) : pick(LEAVES),
      });
    }
  };

  const spawnStars = (x: number, y: number, n: number) => {
    for (let i = 0; i < n; i++) {
      const ang = rand(0, Math.PI * 2);
      const sp = rand(16, 60);
      spawn({
        kind: "star", x, y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp - 26,
        life: 0,
        max: rand(1.2, 2),
        size: rand(3, 6),
        rot: rand(0, Math.PI),
        vr: rand(-1.5, 1.5),
        phase: rand(0, Math.PI * 2),
        color: STAR,
      });
    }
  };

  const spawnRing = (x: number, y: number, big = false) => {
    spawn({
      kind: "ring", x, y, vx: 0, vy: 0,
      life: 0,
      max: big ? 1.6 : 1.15,
      size: big ? 16 : 8,
      rot: 0, vr: 0, phase: 0,
      color: big ? "#ffe3ae" : "#f4c48f",
    });
  };

  const spawnTrail = (x: number, y: number) => {
    spawn({
      kind: "trail",
      x: x + rand(-2, 2), y: y + rand(-2, 2),
      vx: rand(-6, 6), vy: rand(-14, -4),
      life: 0,
      max: rand(0.7, 1.1),
      size: rand(4, 9),
      rot: 0, vr: 0, phase: rand(0, Math.PI * 2),
      color: "#ffe9c4",
    });
  };

  const spawnSparks = (x: number, y: number, n: number) => {
    for (let i = 0; i < n; i++) {
      const ang = rand(0, Math.PI * 2);
      const sp = rand(60, 190);
      spawn({
        kind: "spark", x, y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp,
        life: 0,
        max: rand(0.4, 0.8),
        size: rand(1.2, 2.4),
        rot: 0, vr: 0, phase: 0,
        color: pick(["#ffe3ae", "#f4c48f", "#f2a7b8", "#aecaa4"]),
      });
    }
  };

  const spawnSplash = (x: number, y: number) => {
    spawn({ kind: "splashring", x, y, vx: 0, vy: 0, life: 0, max: 1.1, size: 4, rot: 0, vr: 0, phase: 0, color: "#cfe6ec" });
    for (let i = 0; i < 7; i++) {
      const ang = rand(-Math.PI, 0);
      spawn({
        kind: "spark", x, y,
        vx: Math.cos(ang) * rand(30, 90),
        vy: Math.sin(ang) * rand(40, 110),
        life: 0,
        max: rand(0.5, 0.9),
        size: rand(1, 2),
        rot: 0, vr: 0, phase: 0,
        color: "#dceef4",
      });
    }
  };

  /** 种一朵会发光的花 */
  const plantFlower = (x: number, y: number) => {
    plantedRef.current.push({
      x, y,
      hue: pick(FLOWER_HUES),
      born: performance.now(),
      petals: 5 + Math.floor(Math.random() * 3),
    });
    if (plantedRef.current.length > 26) plantedRef.current.shift();
    setPlantedCount(plantedRef.current.length);
    spawnRing(x, y, true);
    spawnSparks(x, y, 14);
    spawnPetalsAt(x, y, 5);
    audio.crystalChime();
    buzz(18);
  };

  const shower = () => {
    const el = wrapRef.current;
    if (!el) return;
    buzz(20);
    const { width, height } = el.getBoundingClientRect();
    for (let i = 0; i < 80; i++) {
      spawn({
        kind: Math.random() < 0.6 ? "petal" : Math.random() < 0.5 ? "leaf" : "star",
        x: rand(0, width),
        y: rand(-height * 0.35, 0),
        vx: rand(-14, 14),
        vy: rand(46, 120),
        life: 0,
        max: rand(2.4, 4),
        size: rand(5, 11),
        rot: rand(0, Math.PI * 2),
        vr: rand(-2.6, 2.6),
        phase: rand(0, Math.PI * 2),
        color: Math.random() < 0.5 ? pick(PETALS) : Math.random() < 0.5 ? pick(LEAVES) : STAR,
      });
    }
    audio.playChime(5);
  };

  const { needPermission, granted, request } = useShake(shower);

  /* ---------- 天气：借用/归还环境声 ---------- */
  const borrowedRef = useRef<NoiseLayerId | null>(null);
  const changeWeather = (wt: Weather) => {
    if (wt === weather) return;
    audio.unlock();
    // 归还之前借的层
    if (borrowedRef.current) {
      audio.setNoise(borrowedRef.current, 0);
      borrowedRef.current = null;
    }
    if (wt === "rain") {
      audio.setNoise("rain", 0.32);
      borrowedRef.current = "rain";
      audio.rainGust(1.2);
    } else if (wt === "snow") {
      audio.setNoise("wind", 0.18);
      borrowedRef.current = "wind";
      audio.playWindBurst(1.4, 0.09);
    } else {
      audio.playWindBurst(0.8, 0.06);
    }
    weatherRef.current = wt;
    setWeather(wt);
    buzz(6);
  };
  useEffect(
    () => () => {
      if (borrowedRef.current) audio.setNoise(borrowedRef.current, 0);
    },
    []
  );

  /* ---------- 手势 ---------- */
  const localPos = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const clearTimers = () => {
    const p = pointer.current;
    if (p.pressTimer !== null) window.clearTimeout(p.pressTimer);
    if (p.ringTimer !== null) window.clearInterval(p.ringTimer);
    if (p.plantTimer !== null) window.clearTimeout(p.plantTimer);
    p.pressTimer = null;
    p.ringTimer = null;
    p.plantTimer = null;
  };

  const onDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const { x, y } = localPos(e);
    // 夜里：先试试能不能接住一只萤火虫
    if (nightRef.current && weatherRef.current === "clear" && wrapRef.current) {
      const rect = wrapRef.current.getBoundingClientRect();
      const flies = firefliesRef.current;
      for (let i = 0; i < flies.length; i++) {
        const f = flies[i];
        const fx = f.nx * rect.width;
        const fy = f.ny * rect.height;
        if (Math.hypot(fx - x, fy - y) < 34) {
          flies.splice(i, 1);
          setCaught((c) => c + 1);
          setCount((c) => c + 1);
          spawnSparks(x, y, 12);
          spawnRing(x, y);
          audio.twinkle();
          buzz(8);
          return;
        }
      }
    }
    const p = pointer.current;
    p.down = true;
    p.moved = false;
    p.long = false;
    p.planted = false;
    p.x = x; p.y = y;
    p.startX = x; p.startY = y;
    p.lastX = x; p.lastY = y;
    p.downAt = performance.now();
    clearTimers();
    p.pressTimer = window.setTimeout(() => {
      if (!p.down || p.moved) return;
      p.long = true;
      audio.hum();
      spawnRing(p.x, p.y);
      p.ringTimer = window.setInterval(() => {
        audio.hum();
        spawnRing(p.x, p.y);
      }, 330);
    }, 320);
    p.plantTimer = window.setTimeout(() => {
      if (!p.down || p.moved || p.planted) return;
      p.planted = true;
      plantFlower(p.x, p.y);
    }, PLANT_HOLD_MS);
  };

  const onMove = (e: React.PointerEvent) => {
    const p = pointer.current;
    if (!p.down) return;
    const { x, y } = localPos(e);
    if (Math.hypot(x - p.startX, y - p.startY) > 14) {
      p.moved = true;
      if (p.pressTimer !== null) {
        window.clearTimeout(p.pressTimer);
        p.pressTimer = null;
      }
    }
    if (p.moved && Math.hypot(x - p.lastX, y - p.lastY) > 7) {
      spawnTrail(x, y);
      p.lastX = x;
      p.lastY = y;
    }
    p.x = x; p.y = y;
  };

  const onUp = () => {
    const p = pointer.current;
    if (!p.down) return;
    p.down = false;
    clearTimers();
    const held = performance.now() - p.downAt;
    const wt = weatherRef.current;
    if (!p.moved && held < 320) {
      if (wt === "rain") {
        spawnSplash(p.x, p.y);
        audio.splash();
      } else if (wt === "snow") {
        for (let i = 0; i < 10; i++) {
          spawn({
            kind: "snowflake",
            x: p.x + rand(-16, 16), y: p.y + rand(-10, 10),
            vx: rand(-30, 30), vy: rand(-70, -20),
            life: 0,
            max: rand(1, 1.8),
            size: rand(1.5, 3),
            rot: 0, vr: 0, phase: rand(0, Math.PI * 2),
            color: "#eef4fa",
          });
        }
        audio.playWindBurst(0.5, 0.05);
      } else {
        spawnPetalsAt(p.x, p.y, 7);
        spawnSparks(p.x, p.y, 8);
        if (Math.random() < 0.5) spawnStars(p.x, p.y, 2);
        audio.pluck(pick([523.25, 587.33, 659.25, 783.99, 880]), 0.4);
      }
      buzz(8);
      setCount((c) => c + 1);
    } else if (p.long && !p.planted) {
      spawnRing(p.x, p.y, true);
      setCount((c) => c + 1);
    }
  };

  /* ---------- 渲染循环 ---------- */
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
    let last = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const t = now / 1000;
      ctx.clearRect(0, 0, w, h);

      /* 常驻发光花朵 */
      for (const fl of plantedRef.current) {
        const age = (now - fl.born) / 1000;
        const grow = Math.min(1, age / 0.7);
        const scale = grow * (0.96 + 0.04 * Math.sin(t * 1.8 + fl.x * 0.01));
        const breathe = 0.5 + 0.5 * Math.sin(t * 2 + fl.y * 0.02);
        ctx.globalCompositeOperation = "lighter";
        const g = ctx.createRadialGradient(fl.x, fl.y, 0, fl.x, fl.y, 26 * scale + breathe * 6);
        g.addColorStop(0, `${fl.hue}55`);
        g.addColorStop(1, `${fl.hue}00`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(fl.x, fl.y, 26 * scale + breathe * 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = "source-over";
        ctx.save();
        ctx.translate(fl.x, fl.y);
        ctx.rotate(Math.sin(t * 0.8 + fl.x) * 0.08);
        ctx.scale(scale, scale);
        ctx.fillStyle = fl.hue;
        for (let i = 0; i < fl.petals; i++) {
          ctx.rotate((Math.PI * 2) / fl.petals);
          ctx.beginPath();
          ctx.ellipse(0, -7, 3.4, 7, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = "#ffe9c4";
        ctx.beginPath();
        ctx.arc(0, 0, 2.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      /* 夜里飘着的萤火虫 */
      const flies = firefliesRef.current;
      if (nightRef.current && weatherRef.current === "clear") {
        if (flies.length < 7 && Math.random() < 0.005) {
          flies.push({
            nx: 0.06 + Math.random() * 0.88,
            ny: 0.08 + Math.random() * 0.62,
            ph: Math.random() * Math.PI * 2,
            sp: 0.6 + Math.random(),
          });
        }
        ctx.globalCompositeOperation = "lighter";
        for (const f of flies) {
          const fx = (f.nx + Math.sin(t * 0.4 * f.sp + f.ph) * 0.045) * w;
          const fy = (f.ny + Math.cos(t * 0.33 * f.sp + f.ph * 1.7) * 0.04) * h;
          const a = 0.5 + 0.45 * Math.sin(t * 2.4 + f.ph);
          const g = ctx.createRadialGradient(fx, fy, 0, fx, fy, 10);
          g.addColorStop(0, `rgba(255,226,150,${(0.8 * a).toFixed(3)})`);
          g.addColorStop(0.45, `rgba(255,214,150,${(0.28 * a).toFixed(3)})`);
          g.addColorStop(1, "rgba(255,214,150,0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(fx, fy, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = `rgba(255,240,200,${a.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(fx, fy, 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalCompositeOperation = "source-over";
      }

      /* 天气环境粒子 */
      const wt = weatherRef.current;
      if (wt === "rain") {
        for (let i = 0; i < 3; i++) {
          spawn({
            kind: "raindrop",
            x: rand(0, w), y: -8,
            vx: rand(-30, -14), vy: rand(300, 420),
            life: 0,
            max: 2.4,
            size: rand(6, 11),
            rot: 0, vr: 0, phase: 0,
            color: "#cfe6ec",
          });
        }
      } else if (wt === "snow") {
        if (Math.random() < 0.5) {
          spawn({
            kind: "snowflake",
            x: rand(0, w), y: -8,
            vx: rand(-8, 8), vy: rand(26, 60),
            life: 0,
            max: rand(6, 10),
            size: rand(1.5, 3.2),
            rot: rand(0, Math.PI), vr: rand(-1, 1), phase: rand(0, Math.PI * 2),
            color: "#eef4fa",
          });
        }
      }

      const arr = particles.current;
      for (let i = arr.length - 1; i >= 0; i--) {
        const p = arr[i];
        p.life += dt;
        if (p.life >= p.max) {
          arr.splice(i, 1);
          continue;
        }
        const k = p.life / p.max;

        if (p.kind === "petal" || p.kind === "leaf") {
          p.vy += 26 * dt;
          p.vy = Math.min(p.vy, 90);
          p.vx *= 1 - 0.6 * dt;
          p.x += p.vx * dt + Math.sin(t * 2.2 + p.phase) * 0.5;
          p.y += p.vy * dt;
          p.rot += p.vr * dt;
          const alpha = k < 0.7 ? 0.95 : 0.95 * (1 - (k - 0.7) / 0.3);
          drawPetalOrLeaf(ctx, p, alpha);
          continue;
        }
        if (p.kind === "star") {
          p.vy += 10 * dt;
          p.x += p.vx * dt + Math.sin(t * 3 + p.phase) * 0.3;
          p.y += p.vy * dt;
          p.rot += p.vr * dt;
          const twinkle = 0.6 + 0.4 * Math.sin(t * 6 + p.phase);
          ctx.globalCompositeOperation = "lighter";
          drawStar(ctx, p, (1 - k) * twinkle);
          ctx.globalCompositeOperation = "source-over";
          continue;
        }
        if (p.kind === "ring") {
          const r = p.size + k * 96;
          ctx.globalCompositeOperation = "lighter";
          ctx.globalAlpha = (1 - k) * 0.55;
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 2.2 - k * 1.4;
          ctx.beginPath();
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
          ctx.globalCompositeOperation = "source-over";
          continue;
        }
        if (p.kind === "splashring") {
          const r = p.size + k * 46;
          ctx.globalAlpha = (1 - k) * 0.6;
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 1.6 - k;
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, r, r * 0.34, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
          continue;
        }
        if (p.kind === "trail") {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          const r = p.size * (1 - k * 0.7);
          ctx.globalCompositeOperation = "lighter";
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 2.6);
          g.addColorStop(0, `rgba(255,233,196,${(0.5 * (1 - k)).toFixed(3)})`);
          g.addColorStop(1, "rgba(255,233,196,0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.x, p.y, r * 2.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalCompositeOperation = "source-over";
          continue;
        }
        if (p.kind === "raindrop") {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          if (p.y > h * 0.88) {
            // 入水：荡开涟漪
            spawn({ kind: "splashring", x: p.x, y: h * 0.88, vx: 0, vy: 0, life: 0, max: 0.9, size: 2, rot: 0, vr: 0, phase: 0, color: "#cfe6ec" });
            arr.splice(i, 1);
            continue;
          }
          ctx.strokeStyle = "rgba(200,226,236,0.4)";
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03);
          ctx.stroke();
          continue;
        }
        if (p.kind === "snowflake") {
          p.x += p.vx * dt + Math.sin(t * 1.1 + p.phase) * 0.4;
          p.y += p.vy * dt;
          p.vy += 6 * dt;
          p.rot += p.vr * dt;
          const alpha = k < 0.75 ? 0.85 : 0.85 * (1 - (k - 0.75) / 0.25);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = alpha;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
          continue;
        }
        // spark
        p.vx *= 1 - 2.6 * dt;
        p.vy = p.vy * (1 - 2.6 * dt) + 60 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = 1 - k;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 - k), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1;
      }

      /* 雨天水面 */
      if (wt === "rain") {
        ctx.fillStyle = "rgba(14,26,34,0.5)";
        ctx.fillRect(0, h * 0.88, w, h * 0.12);
        ctx.globalCompositeOperation = "lighter";
        for (let i = 0; i < 8; i++) {
          const y = h * 0.89 + i * 6;
          const a = 0.05 + 0.05 * Math.sin(t * 2 + i);
          ctx.fillStyle = `rgba(200,226,236,${a.toFixed(3)})`;
          ctx.fillRect((t * 24 + i * 60) % w, y, w * 0.14, 1.2);
        }
        ctx.globalCompositeOperation = "source-over";
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  /* ---------- 提示轮播 ---------- */
  const hints = HINTS[weather];
  useEffect(() => {
    setHintIdx(0);
    const id = window.setInterval(() => setHintIdx((i) => (i + 1) % HINTS[weatherRef.current].length), 4200);
    return () => window.clearInterval(id);
  }, [weather]);

  return (
    <div ref={wrapRef} className="relative h-full w-full overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full touch-none"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      />

      {/* 收集计数 */}
      <div className="pointer-events-none absolute left-4 top-3 flex items-center gap-2 text-apricot/90">
        <SparkIcon size={16} />
        <span className="text-xs tracking-[0.22em]">
          收集了 <span className="font-display text-lg text-glow">{count}</span> 份温柔
        </span>
        {plantedCount > 0 && (
          <span className="ml-1 flex items-center gap-1.5 rounded-full border border-rose/30 bg-ink/40 px-2.5 py-0.5 text-[10px] tracking-widest text-rose/90">
            <FlowerIcon size={12} />
            种下 {plantedCount}
          </span>
        )}
        {night && caught > 0 && (
          <span className="ml-1 flex items-center gap-1.5 rounded-full border border-mist/35 bg-ink/40 px-2.5 py-0.5 text-[10px] tracking-widest text-mist">
            萤火 · {caught}
          </span>
        )}
      </div>

      {/* 花瓣雨 */}
      <motion.button
        whileTap={{ scale: 0.88 }}
        onClick={shower}
        className="absolute right-4 top-3 flex h-11 items-center gap-1.5 rounded-full border border-rose/30 bg-ink/50 px-4 text-xs tracking-widest text-rose transition-colors hover:bg-ink/70"
      >
        <HandShakeIcon size={16} />
        花瓣雨
      </motion.button>

      {/* 天气切换 */}
      <div className="absolute right-4 top-16 flex flex-col gap-2">
        {(
          [
            { id: "clear", icon: <SunLikeIcon size={15} />, label: "晴" },
            { id: "rain", icon: <RainIcon size={15} />, label: "雨" },
            { id: "snow", icon: <WindIcon size={15} />, label: "雪" },
          ] as { id: Weather; icon: React.ReactNode; label: string }[]
        ).map((wt) => (
          <button
            key={wt.id}
            onClick={() => changeWeather(wt.id)}
            className={`flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-300 active:scale-90 ${
              weather === wt.id
                ? "border-apricot/60 bg-apricot/15 text-apricot shadow-[0_0_14px_rgba(244,196,143,0.25)]"
                : "border-paper/12 bg-ink/40 text-fog/65"
            }`}
            aria-label={`天气：${wt.label}`}
          >
            {wt.icon}
          </button>
        ))}
      </div>

      {/* 底部提示 */}
      <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={`${weather}-${hintIdx}`}
            className="rounded-full border border-paper/8 bg-abyss/45 px-5 py-2 text-xs tracking-[0.2em] text-paper/70"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.5 }}
          >
            {hints[hintIdx % hints.length]}
          </motion.p>
        </AnimatePresence>
      </div>

      {needPermission && !granted && (
        <button
          onClick={() => void request()}
          className="absolute bottom-16 left-1/2 -translate-x-1/2 rounded-full border border-apricot/40 bg-ink/70 px-5 py-2.5 text-xs tracking-widest text-apricot"
        >
          开启摇一摇
        </button>
      )}
      {night && weather === "clear" && (
        <span className="pointer-events-none absolute left-4 top-14 flex items-center gap-1.5 text-[10px] tracking-[0.2em] text-mist/70">
          <MoonIcon size={12} />
          夜里萤火虫出来了，轻点接一只
        </span>
      )}
    </div>
  );
}

/* ---------- 绘制小件 ---------- */

function drawPetalOrLeaf(ctx: CanvasRenderingContext2D, p: P, alpha: number) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = p.color;
  const s = p.size;
  ctx.beginPath();
  if (p.kind === "petal") {
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(s, -s, s * 1.5, s * 0.4, 0, s * 1.7);
    ctx.bezierCurveTo(-s * 1.5, s * 0.4, -s, -s, 0, 0);
  } else {
    ctx.moveTo(0, -s);
    ctx.quadraticCurveTo(s * 0.9, 0, 0, s * 1.3);
    ctx.quadraticCurveTo(-s * 0.9, 0, 0, -s);
  }
  ctx.fill();
  ctx.restore();
}

function drawStar(ctx: CanvasRenderingContext2D, p: P, alpha: number) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = p.color;
  const r = p.size;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const rad = i % 2 === 0 ? r : r * 0.36;
    const a = (i * Math.PI) / 4;
    ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
