import type { SceneKey } from "../../lib/story";

/** 「灯语」场景渲染 —— 全部程序化绘制，无图片资源 */

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  phase: number;
  speed: number;
  life?: number;
  kind:
    | "firefly"
    | "star"
    | "bubble"
    | "ripple"
    | "gull"
    | "spark"
    | "shooting"
    | "rain"
    | "glow"
    | "ember"
    | "pollen"
    | "snowflake"
    | "petal";
}

interface Palette {
  top: string;
  mid: string;
  bottom: string;
}

const PALETTES: Record<SceneKey, Palette> = {
  harbor: { top: "#1c2c44", mid: "#5c4a63", bottom: "#c98a5e" },
  lighthouse: { top: "#081322", mid: "#12283e", bottom: "#1e3c52" },
  forest: { top: "#07170f", mid: "#0e2b1c", bottom: "#1c4630" },
  lantern: { top: "#150e08", mid: "#2e1c0e", bottom: "#5a3a1a" },
  spring: { top: "#081e22", mid: "#103a40", bottom: "#1c5a5c" },
  sea: { top: "#071222", mid: "#0e2440", bottom: "#1a3c5c" },
  whale: { top: "#050d1a", mid: "#0b1e34", bottom: "#143252" },
  stars: { top: "#060d1c", mid: "#142240", bottom: "#2e3a5c" },
  cave: { top: "#050d16", mid: "#0a2030", bottom: "#12394a" },
  meadow: { top: "#0a1030", mid: "#1a2450", bottom: "#3a3a68" },
  rain: { top: "#101a26", mid: "#1c2c3c", bottom: "#2c4252" },
  dawn: { top: "#162440", mid: "#4a4a6e", bottom: "#e0a06a" },
  village: { top: "#0e1626", mid: "#232c44", bottom: "#4a4258" },
  bridge: { top: "#0a1424", mid: "#16283e", bottom: "#2a4258" },
  field: { top: "#101a2e", mid: "#233252", bottom: "#3a4a3a" },
  snow: { top: "#141c2c", mid: "#2c3a50", bottom: "#5a6a80" },
  cloudsea: { top: "#0c1226", mid: "#26305a", bottom: "#5a5a8a" },
  sakura: { top: "#180f1e", mid: "#3e2438", bottom: "#8a5060" },
  lotus: { top: "#081a1c", mid: "#123034", bottom: "#1e4a46" },
  moonrise: { top: "#050a18", mid: "#0e1e3a", bottom: "#2a4468" },
  hearth: { top: "#140c08", mid: "#2e1a10", bottom: "#5a3418" },
};

const TAU = Math.PI * 2;
const rand = (a: number, b: number) => a + Math.random() * (b - a);

function rand3(i: number) {
  return (0.5 + (0.5 * Math.abs(Math.sin(i * 12.9898) * 43758.5453)) % 1) % 1;
}

export function spawnParticles(scene: SceneKey, w: number, h: number): Particle[] {
  const ps: Particle[] = [];
  const push = (kind: Particle["kind"], n: number, make?: () => Partial<Particle>) => {
    for (let i = 0; i < n; i++) {
      ps.push({
        x: rand(0, w),
        y: rand(0, h * 0.7),
        vx: rand(-0.1, 0.1),
        vy: rand(-0.1, 0.1),
        r: rand(1, 2.4),
        phase: rand(0, TAU),
        speed: rand(0.4, 1.4),
        kind,
        ...(make ? make() : {}),
      });
    }
  };

  switch (scene) {
    case "forest":
    case "lantern":
      push("firefly", 42, () => ({ r: rand(1.2, 2.6), y: rand(h * 0.2, h * 0.9) }));
      push("star", 14, () => ({ y: rand(0, h * 0.3), r: rand(0.6, 1.4) }));
      break;
    case "spring":
      push("firefly", 22, () => ({ r: rand(1, 2), y: rand(h * 0.3, h * 0.8) }));
      push("ripple", 3, () => ({ x: rand(w * 0.3, w * 0.7), y: h * 0.72 }));
      break;
    case "sea":
      push("star", 40, () => ({ y: rand(0, h * 0.45), r: rand(0.5, 1.6) }));
      push("ripple", 4, () => ({ x: rand(w * 0.1, w * 0.9), y: h * 0.78 }));
      break;
    case "whale":
      push("star", 30, () => ({ y: rand(0, h * 0.4), r: rand(0.5, 1.4) }));
      push("bubble", 16, () => ({ x: rand(w * 0.25, w * 0.6), y: rand(h * 0.5, h * 0.95) }));
      break;
    case "stars":
      push("star", 70, () => ({ y: rand(0, h * 0.85), r: rand(0.5, 2) }));
      push("spark", 12, () => ({ r: rand(1.5, 3), y: rand(h * 0.4, h * 0.9) }));
      break;
    case "harbor":
      push("gull", 4, () => ({ x: rand(0, w), y: rand(h * 0.15, h * 0.4), speed: rand(0.3, 0.7) }));
      push("star", 16, () => ({ y: rand(0, h * 0.3), r: rand(0.5, 1.3) }));
      break;
    case "lighthouse":
      push("star", 46, () => ({ y: rand(0, h * 0.6), r: rand(0.5, 1.8) }));
      break;
    case "cave":
      push("glow", 26, () => ({ r: rand(1, 2.4), y: rand(h * 0.2, h * 0.9) }));
      push("ripple", 2, () => ({ x: rand(w * 0.35, w * 0.65), y: h * 0.82 }));
      break;
    case "meadow":
      push("star", 90, () => ({ y: rand(0, h * 0.62), r: rand(0.5, 2) }));
      push("firefly", 12, () => ({ r: rand(1, 2), y: rand(h * 0.55, h * 0.85) }));
      break;
    case "rain":
      push("rain", 60, () => ({ x: rand(0, w), y: rand(0, h), vy: rand(4, 6) }));
      push("ripple", 3, () => ({ x: rand(w * 0.2, w * 0.8), y: h * 0.88 }));
      break;
    case "dawn":
      push("gull", 5, () => ({ x: rand(0, w), y: rand(h * 0.12, h * 0.34), speed: rand(0.3, 0.8) }));
      push("glow", 16, () => ({ r: rand(1, 2), y: rand(h * 0.4, h * 0.62) }));
      break;
    case "village":
      push("ember", 20, () => ({ r: rand(1, 2.2), y: rand(h * 0.3, h * 0.75), vy: rand(0.3, 0.8) }));
      push("star", 20, () => ({ y: rand(0, h * 0.35), r: rand(0.5, 1.4) }));
      break;
    case "bridge":
      push("star", 36, () => ({ y: rand(0, h * 0.5), r: rand(0.5, 1.6) }));
      push("ripple", 4, () => ({ x: rand(w * 0.25, w * 0.75), y: h * 0.8 }));
      break;
    case "field":
      push("pollen", 40, () => ({ r: rand(1, 2.4), y: rand(h * 0.35, h * 0.95), vy: rand(0.3, 0.8) }));
      push("firefly", 14, () => ({ r: rand(1, 2), y: rand(h * 0.5, h * 0.85) }));
      break;
    case "snow":
      push("snowflake", 46, () => ({ r: rand(1, 2.6), y: rand(0, h), vy: rand(0.7, 1.8) }));
      push("star", 14, () => ({ y: rand(0, h * 0.3), r: rand(0.5, 1.3) }));
      break;
    case "cloudsea":
      push("star", 50, () => ({ y: rand(0, h * 0.4), r: rand(0.5, 1.8) }));
      push("gull", 3, () => ({ x: rand(0, w), y: rand(h * 0.1, h * 0.28), speed: rand(0.4, 0.8) }));
      break;
    case "sakura":
      push("petal", 30, () => ({ r: rand(2.4, 4.4), y: rand(0, h * 0.8), vy: rand(0.5, 1.2) }));
      push("glow", 8, () => ({ r: rand(1, 2), y: rand(h * 0.5, h * 0.85) }));
      break;
    case "lotus":
      push("firefly", 12, () => ({ r: rand(1, 2), y: rand(h * 0.55, h * 0.9) }));
      push("ripple", 3, () => ({ x: rand(w * 0.25, w * 0.75), y: h * 0.82 }));
      break;
    case "moonrise":
      push("star", 56, () => ({ y: rand(0, h * 0.5), r: rand(0.5, 1.8) }));
      push("glow", 10, () => ({ r: rand(1, 2), y: rand(h * 0.6, h * 0.85) }));
      break;
    case "hearth":
      push("ember", 18, () => ({ r: rand(1, 2.2), x: rand(w * 0.3, w * 0.7), y: rand(h * 0.4, h * 0.8), vy: rand(0.5, 1.3) }));
      push("star", 10, () => ({ y: rand(0, h * 0.3), r: rand(0.5, 1.2) }));
      break;
  }
  return ps.slice(0, 110);
}

function gradient(ctx: CanvasRenderingContext2D, w: number, h: number, p: Palette) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, p.top);
  g.addColorStop(0.55, p.mid);
  g.addColorStop(1, p.bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

/* ---------- 各场景签名元素 ---------- */

function drawHarbor(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const sunY = h * 0.52;
  const g = ctx.createRadialGradient(w * 0.5, sunY, 10, w * 0.5, sunY, w * 0.42);
  g.addColorStop(0, "rgba(255,214,150,0.85)");
  g.addColorStop(0.3, "rgba(244,180,120,0.4)");
  g.addColorStop(1, "rgba(244,180,120,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.beginPath();
  ctx.fillStyle = "#ffdfa8";
  ctx.arc(w * 0.5, sunY, w * 0.075, 0, TAU);
  ctx.fill();
  const wy = h * 0.62;
  ctx.fillStyle = "rgba(20,28,48,0.85)";
  ctx.fillRect(0, wy, w, h - wy);
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 9; i++) {
    const y = wy + 8 + i * 12;
    const a = 0.1 + 0.08 * Math.sin(t * 1.2 + i);
    ctx.fillStyle = `rgba(255,200,140,${a.toFixed(3)})`;
    ctx.fillRect(w * 0.5 - w * 0.05 - i * 6, y, w * 0.1 + i * 12, 1.6);
  }
  ctx.globalCompositeOperation = "source-over";
}

function drawLighthouse(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const bx = w * 0.62;
  const baseY = h * 0.92;
  ctx.fillStyle = "#0c1a2a";
  ctx.beginPath();
  ctx.moveTo(bx - w * 0.045, baseY);
  ctx.lineTo(bx - w * 0.02, h * 0.34);
  ctx.lineTo(bx + w * 0.02, h * 0.34);
  ctx.lineTo(bx + w * 0.045, baseY);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#12283e";
  ctx.fillRect(bx - w * 0.03, h * 0.3, w * 0.06, h * 0.045);
  const ang = t * 0.55;
  for (const dir of [ang, ang + Math.PI]) {
    const len = w * 0.75;
    const cy = h * 0.32;
    const spread = 0.09;
    ctx.globalCompositeOperation = "lighter";
    const g = ctx.createLinearGradient(bx, cy, bx + Math.cos(dir) * len, cy + Math.sin(dir) * len);
    g.addColorStop(0, "rgba(255,224,160,0.5)");
    g.addColorStop(1, "rgba(255,224,160,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(bx, cy);
    ctx.lineTo(bx + Math.cos(dir - spread) * len, cy + Math.sin(dir - spread) * len);
    ctx.lineTo(bx + Math.cos(dir + spread) * len, cy + Math.sin(dir + spread) * len);
    ctx.closePath();
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
  }
  ctx.beginPath();
  ctx.fillStyle = "#ffe4a8";
  ctx.arc(bx, h * 0.32, 5, 0, TAU);
  ctx.fill();
  ctx.fillStyle = "rgba(8,16,28,0.9)";
  ctx.fillRect(0, baseY, w, h - baseY);
}

function drawForest(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  ctx.fillStyle = "rgba(4,14,9,0.9)";
  for (let i = 0; i < 7; i++) {
    const x = (i / 6) * w + Math.sin(i * 2.7) * 20;
    const tw = w * 0.09;
    const th = h * rand3(i) * 0.5 + h * 0.2;
    ctx.beginPath();
    ctx.moveTo(x - tw, h);
    ctx.lineTo(x, h - th);
    ctx.lineTo(x + tw, h);
    ctx.closePath();
    ctx.fill();
  }
  const lx = w * 0.5 + Math.sin(t * 0.8) * w * 0.04;
  const ly = h * 0.62 + Math.cos(t * 1.1) * 8;
  const g = ctx.createRadialGradient(lx, ly, 2, lx, ly, w * 0.1);
  g.addColorStop(0, "rgba(255,200,120,0.75)");
  g.addColorStop(1, "rgba(255,200,120,0)");
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = g;
  ctx.fillRect(lx - w * 0.1, ly - w * 0.1, w * 0.2, w * 0.2);
  ctx.globalCompositeOperation = "source-over";
}

function drawLantern(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const cx = w * 0.5;
  const cy = h * 0.55;
  const g = ctx.createRadialGradient(cx, cy, 20, cx, cy, w * 0.55);
  g.addColorStop(0, "rgba(255,190,110,0.5)");
  g.addColorStop(0.5, "rgba(244,150,80,0.16)");
  g.addColorStop(1, "rgba(244,150,80,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  const fy = cy + h * 0.06;
  ctx.fillStyle = "#1c1108";
  ctx.beginPath();
  ctx.ellipse(cx, fy, w * 0.075, h * 0.05, 0, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + w * 0.055, fy - h * 0.045, w * 0.035, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + w * 0.035, fy - h * 0.07);
  ctx.lineTo(cx + w * 0.045, fy - h * 0.1);
  ctx.lineTo(cx + w * 0.058, fy - h * 0.072);
  ctx.moveTo(cx + w * 0.062, fy - h * 0.072);
  ctx.lineTo(cx + w * 0.075, fy - h * 0.1);
  ctx.lineTo(cx + w * 0.085, fy - h * 0.068);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx - w * 0.08, fy + h * 0.01, w * 0.045, h * 0.028, -0.5, 0, TAU);
  ctx.fill();
  const lx = cx + w * 0.12;
  const ly = fy - h * 0.02 + Math.sin(t * 2) * 3;
  const lg = ctx.createRadialGradient(lx, ly, 2, lx, ly, w * 0.09);
  lg.addColorStop(0, "rgba(255,224,150,0.95)");
  lg.addColorStop(1, "rgba(255,224,150,0)");
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = lg;
  ctx.fillRect(lx - w * 0.09, ly - w * 0.09, w * 0.18, w * 0.18);
  ctx.globalCompositeOperation = "source-over";
  ctx.beginPath();
  ctx.fillStyle = "#ffe9b8";
  ctx.arc(lx, ly, 7, 0, TAU);
  ctx.fill();
}

function drawSpring(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const cy = h * 0.72;
  ctx.fillStyle = "rgba(10,40,46,0.9)";
  ctx.beginPath();
  ctx.ellipse(w * 0.5, cy, w * 0.42, h * 0.09, 0, 0, TAU);
  ctx.fill();
  ctx.globalCompositeOperation = "lighter";
  const g = ctx.createRadialGradient(w * 0.5, cy, 5, w * 0.5, cy, w * 0.3);
  g.addColorStop(0, "rgba(150,220,220,0.3)");
  g.addColorStop(1, "rgba(150,220,220,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, cy - h * 0.1, w, h * 0.2);
  // 泉眼小气泡串
  for (let i = 0; i < 5; i++) {
    const prog = (t * 0.4 + i * 0.2) % 1;
    const a = (1 - prog) * 0.4;
    ctx.strokeStyle = `rgba(180,235,230,${a.toFixed(3)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(w * 0.5 + Math.sin(i * 2) * 20, cy - prog * 30, 2 + prog * 3, 0, TAU);
    ctx.stroke();
  }
  ctx.globalCompositeOperation = "source-over";
}

function drawSea(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const mx = w * 0.72;
  const my = h * 0.24;
  const g = ctx.createRadialGradient(mx, my, 8, mx, my, w * 0.22);
  g.addColorStop(0, "rgba(220,235,250,0.8)");
  g.addColorStop(0.25, "rgba(200,220,245,0.25)");
  g.addColorStop(1, "rgba(200,220,245,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.beginPath();
  ctx.fillStyle = "#e8f0fa";
  ctx.arc(mx, my, w * 0.05, 0, TAU);
  ctx.fill();
  const wy = h * 0.66;
  ctx.fillStyle = "rgba(8,20,38,0.85)";
  ctx.fillRect(0, wy, w, h - wy);
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 8; i++) {
    const y = wy + 10 + i * 14;
    const a = 0.08 + 0.06 * Math.sin(t * 1.4 + i * 0.9);
    ctx.fillStyle = `rgba(210,230,250,${a.toFixed(3)})`;
    ctx.fillRect(mx - w * 0.04 - i * 7, y, w * 0.08 + i * 14, 1.4);
  }
  ctx.globalCompositeOperation = "source-over";
}

function drawWhale(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const cy = h * 0.6 + Math.sin(t * 0.5) * 8;
  ctx.fillStyle = "#0a1a2e";
  ctx.beginPath();
  ctx.moveTo(w * 0.12, cy + h * 0.05);
  ctx.quadraticCurveTo(w * 0.35, cy - h * 0.13, w * 0.62, cy - h * 0.02);
  ctx.quadraticCurveTo(w * 0.72, cy + h * 0.02, w * 0.78, cy - h * 0.05);
  ctx.quadraticCurveTo(w * 0.8, cy + h * 0.04, w * 0.7, cy + h * 0.08);
  ctx.quadraticCurveTo(w * 0.4, cy + h * 0.12, w * 0.12, cy + h * 0.05);
  ctx.closePath();
  ctx.fill();
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * TAU + t * 0.4;
    const rr = w * 0.05 + (i % 4) * 6;
    const x = w * 0.5 + Math.cos(a) * rr;
    const y = cy - h * 0.16 + Math.sin(a * 2) * rr * 0.5 - i * 2;
    const al = 0.14 + 0.1 * Math.sin(t * 2 + i);
    ctx.fillStyle = `rgba(255,220,160,${Math.max(0, al).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(x, y, 2.4, 0, TAU);
    ctx.fill();
  }
  ctx.globalCompositeOperation = "source-over";
}

function drawStars(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const g = ctx.createRadialGradient(w * 0.5, h * 0.2, 30, w * 0.5, h * 0.2, w * 0.7);
  g.addColorStop(0, "rgba(245,217,160,0.14)");
  g.addColorStop(1, "rgba(245,217,160,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  const wy = h * 0.78;
  ctx.fillStyle = "rgba(6,13,28,0.8)";
  ctx.fillRect(0, wy, w, h - wy);
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 16; i++) {
    const x = (i / 16) * w + Math.sin(i * 3.3) * 12;
    const y = wy + 6 + (i % 4) * 9;
    const a = 0.12 + 0.1 * Math.sin(t * 1.6 + i);
    ctx.fillStyle = `rgba(245,217,160,${a.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(x, y, 1.4, 0, TAU);
    ctx.fill();
  }
  ctx.globalCompositeOperation = "source-over";
}

function drawCave(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  ctx.fillStyle = "rgba(6,16,26,0.92)";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(w * 0.22, 0);
  ctx.bezierCurveTo(w * 0.08, h * 0.3, w * 0.05, h * 0.6, 0, h);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(w, 0);
  ctx.lineTo(w * 0.78, 0);
  ctx.bezierCurveTo(w * 0.93, h * 0.32, w * 0.96, h * 0.62, w, h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#0a1e2c";
  for (let i = 0; i < 9; i++) {
    const x = w * (0.16 + i * 0.085);
    const len = h * (0.05 + ((i * 37) % 13) * 0.008);
    ctx.beginPath();
    ctx.moveTo(x - 12, 0);
    ctx.lineTo(x + 12, 0);
    ctx.lineTo(x, len);
    ctx.closePath();
    ctx.fill();
  }
  const crystal = (x: number, y: number, s: number, hue: string, ph: number) => {
    const glow = 0.5 + 0.4 * Math.sin(t * 1.4 + ph);
    ctx.save();
    ctx.translate(x, y);
    ctx.globalCompositeOperation = "lighter";
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 3);
    g.addColorStop(0, `rgba(127,212,193,${(0.28 * glow).toFixed(3)})`);
    g.addColorStop(1, "rgba(127,212,193,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, s * 3, 0, TAU);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
    [-0.5, 0, 0.5].forEach((rot, i) => {
      ctx.save();
      ctx.rotate(rot);
      const hh = s * (1.6 + i * 0.28);
      ctx.fillStyle = hue;
      ctx.globalAlpha = 0.5 + 0.35 * glow;
      ctx.beginPath();
      ctx.moveTo(-s * 0.34, 0);
      ctx.lineTo(0, -hh);
      ctx.lineTo(s * 0.34, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });
    ctx.restore();
  };
  crystal(w * 0.18, h * 0.74, w * 0.022, "#4fa892", 0);
  crystal(w * 0.82, h * 0.7, w * 0.026, "#3e90a8", 1.4);
  crystal(w * 0.3, h * 0.3, w * 0.016, "#7fd4c1", 2.2);
  crystal(w * 0.72, h * 0.26, w * 0.018, "#9bd4e0", 3.1);
  const sx = w * 0.5;
  const sy = h * 0.5;
  const pulse = 0.6 + 0.4 * Math.sin(t * 1.8);
  ctx.globalCompositeOperation = "lighter";
  const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, w * 0.14);
  sg.addColorStop(0, `rgba(255,236,190,${(0.5 * pulse).toFixed(3)})`);
  sg.addColorStop(1, "rgba(255,236,190,0)");
  ctx.fillStyle = sg;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = `rgba(255,240,205,${(0.6 + 0.35 * pulse).toFixed(3)})`;
  ctx.beginPath();
  ctx.arc(sx, sy, 5, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = `rgba(255,236,190,${(0.35 * pulse).toFixed(3)})`;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(sx - 16, sy);
  ctx.lineTo(sx + 16, sy);
  ctx.moveTo(sx, sy - 16);
  ctx.lineTo(sx, sy + 16);
  ctx.stroke();
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "rgba(10,26,38,0.85)";
  ctx.fillRect(0, h * 0.8, w, h * 0.2);
}

function drawMeadow(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  ctx.save();
  ctx.translate(w * 0.5, h * 0.3);
  ctx.rotate(-0.35);
  const mg = ctx.createLinearGradient(0, -w * 0.14, 0, w * 0.14);
  mg.addColorStop(0, "rgba(180,190,230,0)");
  mg.addColorStop(0.5, "rgba(200,205,235,0.16)");
  mg.addColorStop(1, "rgba(180,190,230,0)");
  ctx.fillStyle = mg;
  ctx.fillRect(-w, -w * 0.14, w * 2, w * 0.28);
  ctx.restore();
  const bx = w * 0.72;
  const by = h * 0.2;
  const tw = 0.6 + 0.4 * Math.sin(t * 2.1);
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = `rgba(245,217,160,${(0.7 * tw).toFixed(3)})`;
  ctx.beginPath();
  ctx.arc(bx, by, 2.6, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = `rgba(245,217,160,${(0.4 * tw).toFixed(3)})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(bx - 11, by);
  ctx.lineTo(bx + 11, by);
  ctx.moveTo(bx, by - 11);
  ctx.lineTo(bx, by + 11);
  ctx.stroke();
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "#101633";
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(0, h * 0.74);
  ctx.bezierCurveTo(w * 0.3, h * 0.66, w * 0.6, h * 0.7, w, h * 0.8);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(90,100,170,0.5)";
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 26; i++) {
    const x = (i / 26) * w;
    const base = h * (0.72 + 0.08 * Math.sin(i * 1.7));
    const sway = Math.sin(t * 1.6 + i) * 3;
    ctx.beginPath();
    ctx.moveTo(x, base + 6);
    ctx.quadraticCurveTo(x + sway * 0.4, base - 4, x + sway, base - 10 - (i % 3) * 3);
    ctx.stroke();
  }
  const px = w * 0.4;
  const py = h * 0.76;
  ctx.fillStyle = "#0a0e24";
  ctx.beginPath();
  ctx.ellipse(px, py, w * 0.075, w * 0.022, -0.06, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(px + w * 0.085, py - w * 0.012, w * 0.02, 0, TAU);
  ctx.fill();
  const armA = Math.sin(t * 1.2) * 0.18;
  ctx.strokeStyle = "#0a0e24";
  ctx.lineWidth = w * 0.012;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(px + w * 0.05, py - w * 0.008);
  ctx.lineTo(px + w * 0.075, py - w * 0.055 - armA * w * 0.03);
  ctx.stroke();
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = `rgba(245,217,160,${(0.5 + 0.4 * Math.sin(t * 3)).toFixed(3)})`;
  ctx.beginPath();
  ctx.arc(px + w * 0.075, py - w * 0.065 - armA * w * 0.03, 2.2, 0, TAU);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";
}

function drawRain(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  ctx.fillStyle = "rgba(24,36,50,0.7)";
  ctx.beginPath();
  ctx.moveTo(0, h * 0.66);
  ctx.bezierCurveTo(w * 0.25, h * 0.5, w * 0.5, h * 0.6, w, h * 0.52);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();
  const hx = w * 0.62;
  const hy = h * 0.72;
  ctx.fillStyle = "#141e2a";
  ctx.fillRect(hx, hy, w * 0.3, h * 0.16);
  ctx.beginPath();
  ctx.moveTo(hx - w * 0.06, hy);
  ctx.lineTo(hx + w * 0.34, hy);
  ctx.lineTo(hx + w * 0.3, hy - h * 0.07);
  ctx.lineTo(hx - w * 0.01, hy - h * 0.07);
  ctx.closePath();
  ctx.fillStyle = "#1a2735";
  ctx.fill();
  const flick = 0.72 + 0.22 * Math.sin(t * 2.2) + 0.06 * Math.sin(t * 7.3);
  const wx = hx + w * 0.05;
  const wy = hy + h * 0.04;
  ctx.globalCompositeOperation = "lighter";
  const wg = ctx.createRadialGradient(wx, wy, 0, wx, wy, w * 0.13);
  wg.addColorStop(0, `rgba(255,196,130,${(0.34 * flick).toFixed(3)})`);
  wg.addColorStop(1, "rgba(255,196,130,0)");
  ctx.fillStyle = wg;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = `rgba(255,205,140,${(0.55 + 0.3 * flick).toFixed(3)})`;
  ctx.fillRect(wx - w * 0.028, wy - h * 0.026, w * 0.056, h * 0.052);
  ctx.strokeStyle = "#141e2a";
  ctx.lineWidth = 2;
  ctx.strokeRect(wx - w * 0.028, wy - h * 0.026, w * 0.056, h * 0.052);
  ctx.beginPath();
  ctx.moveTo(wx, wy - h * 0.026);
  ctx.lineTo(wx, wy + h * 0.026);
  ctx.stroke();
  const tx = hx - w * 0.04;
  const ty = hy + h * 0.1;
  ctx.fillStyle = "#0c141d";
  ctx.beginPath();
  ctx.ellipse(tx, ty, w * 0.02, h * 0.045, 0, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(tx, ty - h * 0.05, w * 0.032, h * 0.012, 0, Math.PI, TAU);
  ctx.fill();
  ctx.fillStyle = "rgba(46,66,84,0.6)";
  ctx.fillRect(0, h * 0.88, w, h * 0.12);
}

function drawDawn(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const hor = h * 0.58;
  const sunY = hor - h * 0.02 - (Math.sin(t * 0.1) + 1) * h * 0.03;
  const sg = ctx.createRadialGradient(w * 0.5, sunY, 8, w * 0.5, sunY, w * 0.5);
  sg.addColorStop(0, "rgba(255,224,170,0.9)");
  sg.addColorStop(0.25, "rgba(255,196,130,0.42)");
  sg.addColorStop(1, "rgba(255,196,130,0)");
  ctx.fillStyle = sg;
  ctx.fillRect(0, 0, w, h);
  ctx.beginPath();
  ctx.fillStyle = "#ffe2ae";
  ctx.arc(w * 0.5, sunY, w * 0.085, Math.PI, TAU);
  ctx.fill();
  ctx.fillStyle = "rgba(34,40,70,0.9)";
  ctx.fillRect(0, hor, w, h - hor);
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 12; i++) {
    const y = hor + 6 + i * 10;
    const spread = i * w * 0.016;
    const a = 0.16 - i * 0.011 + 0.05 * Math.sin(t * 1.4 + i * 0.8);
    ctx.fillStyle = `rgba(255,210,150,${Math.max(0.02, a).toFixed(3)})`;
    ctx.fillRect(w * 0.5 - w * 0.05 - spread, y, w * 0.1 + spread * 2, 1.8);
  }
  for (let i = 0; i < 7; i++) {
    const prog = (t * 0.05 + i * 0.14) % 1;
    const x = w * (0.18 + i * 0.095);
    const y = hor - prog * h * 0.42;
    const a = Math.sin(prog * Math.PI) * 0.8;
    ctx.fillStyle = `rgba(255,236,190,${a.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(x + Math.sin(t + i) * 6, y, 1.8 + (1 - prog) * 1.4, 0, TAU);
    ctx.fill();
  }
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "#0e1428";
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(0, h * 0.7);
  ctx.bezierCurveTo(w * 0.12, h * 0.68, w * 0.16, h * 0.76, w * 0.24, h * 0.82);
  ctx.lineTo(w * 0.3, h);
  ctx.closePath();
  ctx.fill();
}

function drawVillage(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  // 远山
  ctx.fillStyle = "rgba(20,28,46,0.8)";
  ctx.beginPath();
  ctx.moveTo(0, h * 0.5);
  ctx.bezierCurveTo(w * 0.3, h * 0.38, w * 0.6, h * 0.46, w, h * 0.4);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();
  // 一排小屋（高低错落）
  const houses = 5;
  for (let i = 0; i < houses; i++) {
    const hx = w * (0.08 + i * 0.18);
    const hw = w * 0.15;
    const hh = h * (0.13 + rand3(i) * 0.05);
    const hy = h * 0.86 - hh;
    ctx.fillStyle = i % 2 ? "#182234" : "#141d2c";
    ctx.fillRect(hx, hy, hw, hh);
    // 屋顶
    ctx.beginPath();
    ctx.moveTo(hx - w * 0.015, hy);
    ctx.lineTo(hx + hw / 2, hy - h * 0.05);
    ctx.lineTo(hx + hw + w * 0.015, hy);
    ctx.closePath();
    ctx.fill();
    // 暖窗
    const fl = 0.65 + 0.3 * Math.sin(t * 2 + i * 1.7) + 0.05 * Math.sin(t * 8 + i);
    ctx.fillStyle = `rgba(255,196,120,${(0.5 + 0.35 * fl).toFixed(3)})`;
    ctx.fillRect(hx + hw * 0.34, hy + hh * 0.35, hw * 0.3, hh * 0.28);
  }
  // 檐下纸灯笼串（轻轻晃）
  for (let i = 0; i < 4; i++) {
    const lx = w * (0.2 + i * 0.2);
    const sway = Math.sin(t * 1.3 + i * 1.1) * 4;
    const ly = h * 0.62 + Math.sin(t * 0.8 + i) * 2;
    ctx.strokeStyle = "rgba(244,236,221,0.2)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(lx, ly - h * 0.05);
    ctx.lineTo(lx + sway, ly);
    ctx.stroke();
    ctx.globalCompositeOperation = "lighter";
    const g = ctx.createRadialGradient(lx + sway, ly + 8, 2, lx + sway, ly + 8, w * 0.05);
    g.addColorStop(0, "rgba(255,180,100,0.55)");
    g.addColorStop(1, "rgba(255,180,100,0)");
    ctx.fillStyle = g;
    ctx.fillRect(lx + sway - w * 0.05, ly + 8 - w * 0.05, w * 0.1, w * 0.1);
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(255,200,130,0.9)";
    ctx.beginPath();
    ctx.ellipse(lx + sway, ly + 8, w * 0.014, w * 0.02, 0, 0, TAU);
    ctx.fill();
  }
  // 阿婆剪影（踩凳点灯）
  const gx = w * 0.78;
  const gy = h * 0.8;
  ctx.fillStyle = "#0d1522";
  ctx.fillRect(gx - w * 0.02, gy + h * 0.02, w * 0.04, h * 0.03);
  ctx.beginPath();
  ctx.ellipse(gx, gy - h * 0.01, w * 0.018, h * 0.045, 0, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(gx, gy - h * 0.065, w * 0.012, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = "#0d1522";
  ctx.lineWidth = w * 0.009;
  ctx.lineCap = "round";
  const armLift = Math.sin(t * 1.1) * 0.15;
  ctx.beginPath();
  ctx.moveTo(gx + w * 0.012, gy - h * 0.035);
  ctx.lineTo(gx + w * 0.035, gy - h * (0.085 + armLift));
  ctx.stroke();
  // 石阶路
  ctx.fillStyle = "rgba(24,34,52,0.9)";
  ctx.fillRect(0, h * 0.86, w, h * 0.14);
}

function drawBridge(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  // 月亮
  const mx = w * 0.3;
  const my = h * 0.2;
  const g = ctx.createRadialGradient(mx, my, 6, mx, my, w * 0.18);
  g.addColorStop(0, "rgba(220,235,250,0.75)");
  g.addColorStop(1, "rgba(220,235,250,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.beginPath();
  ctx.fillStyle = "#e8f0fa";
  ctx.arc(mx, my, w * 0.04, 0, TAU);
  ctx.fill();
  // 桥洞与银币般的月影
  const wy = h * 0.72;
  ctx.fillStyle = "rgba(10,20,34,0.9)";
  ctx.fillRect(0, wy, w, h - wy);
  ctx.fillStyle = "#16233a";
  ctx.beginPath();
  ctx.moveTo(w * 0.2, wy);
  ctx.quadraticCurveTo(w * 0.5, wy - h * 0.2, w * 0.8, wy);
  ctx.lineTo(w * 0.8, wy);
  ctx.lineTo(w * 0.2, wy);
  ctx.closePath();
  ctx.fill();
  // 桥洞
  ctx.fillStyle = "#0a1424";
  ctx.beginPath();
  ctx.ellipse(w * 0.5, wy, w * 0.13, h * 0.09, 0, Math.PI, TAU);
  ctx.fill();
  // 洞中月影
  const shimmer = 0.5 + 0.3 * Math.sin(t * 1.7);
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = `rgba(220,235,250,${(0.3 * shimmer).toFixed(3)})`;
  ctx.beginPath();
  ctx.ellipse(w * 0.5, wy - h * 0.015, w * 0.05, h * 0.012, 0, 0, TAU);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";
  // 桥栏柱
  ctx.fillStyle = "#1c2b44";
  for (let i = 0; i < 7; i++) {
    const x = w * (0.24 + i * 0.087);
    const topY = wy - Math.sin(((x - w * 0.2) / (w * 0.6)) * Math.PI) * h * 0.19;
    ctx.fillRect(x - 2, topY - 12, 4, 14);
  }
  // 鲤鱼（桥影里游动的火苗）
  for (let i = 0; i < 3; i++) {
    const prog = (t * 0.06 + i * 0.34) % 1;
    const fx = w * (0.28 + prog * 0.44);
    const fy = wy + h * 0.06 + Math.sin(t * 1.2 + i * 2) * 6;
    const dir = i % 2 === 0 ? 1 : -1;
    ctx.fillStyle = "rgba(232,120,80,0.75)";
    ctx.beginPath();
    ctx.ellipse(fx, fy, 9, 3.4, dir * 0.2, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(fx - dir * 9, fy);
    ctx.lineTo(fx - dir * 15, fy - 3.6);
    ctx.lineTo(fx - dir * 15, fy + 3.6);
    ctx.closePath();
    ctx.fill();
  }
  // 岸草
  ctx.strokeStyle = "rgba(60,90,110,0.6)";
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 14; i++) {
    const x = (i / 14) * w;
    const sway = Math.sin(t * 1.4 + i) * 2.5;
    ctx.beginPath();
    ctx.moveTo(x, h * 0.92);
    ctx.quadraticCurveTo(x + sway * 0.4, h * 0.88, x + sway, h * 0.85);
    ctx.stroke();
  }
}

function drawField(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  // 远丘
  ctx.fillStyle = "rgba(24,34,48,0.85)";
  ctx.beginPath();
  ctx.moveTo(0, h * 0.56);
  ctx.bezierCurveTo(w * 0.3, h * 0.46, w * 0.7, h * 0.5, w, h * 0.44);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();
  // 花田（一排排发光的小花）
  for (let row = 0; row < 5; row++) {
    const ry = h * (0.62 + row * 0.08);
    const n = 16 - row * 2;
    for (let i = 0; i < n; i++) {
      const x = (i + 0.5 + (row % 2) * 0.4) / n * w + Math.sin(row * 3 + i) * 6;
      const sway = Math.sin(t * 1.5 + i * 0.9 + row) * 2;
      const tw = 0.55 + 0.45 * Math.sin(t * 1.8 + i * 1.3 + row * 2);
      const size = 2.6 + row * 0.5;
      // 茎
      ctx.strokeStyle = "rgba(70,110,80,0.5)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, ry + 10);
      ctx.quadraticCurveTo(x + sway * 0.4, ry + 4, x + sway, ry);
      ctx.stroke();
      // 花头（发光）
      ctx.globalCompositeOperation = "lighter";
      const g = ctx.createRadialGradient(x + sway, ry, 0, x + sway, ry, size * 3.4);
      g.addColorStop(0, `rgba(255,215,140,${(0.5 * tw).toFixed(3)})`);
      g.addColorStop(1, "rgba(255,215,140,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x + sway, ry, size * 3.4, 0, TAU);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = `rgba(255,225,160,${(0.65 + 0.35 * tw).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(x + sway, ry, size, 0, TAU);
      ctx.fill();
    }
  }
  // 田埂
  ctx.fillStyle = "rgba(18,26,22,0.9)";
  ctx.fillRect(0, h * 0.95, w, h * 0.05);
}

function drawSnow(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  // 雪山坡
  ctx.fillStyle = "rgba(74,90,114,0.5)";
  ctx.beginPath();
  ctx.moveTo(0, h * 0.55);
  ctx.lineTo(w * 0.42, h * 0.3);
  ctx.lineTo(w * 0.75, h * 0.52);
  ctx.lineTo(w, h * 0.42);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();
  // 雪地
  const sy = h * 0.68;
  const sg = ctx.createLinearGradient(0, sy, 0, h);
  sg.addColorStop(0, "#93a4bc");
  sg.addColorStop(1, "#5a6a84");
  ctx.fillStyle = sg;
  ctx.beginPath();
  ctx.moveTo(0, sy + h * 0.04);
  ctx.bezierCurveTo(w * 0.3, sy - h * 0.02, w * 0.6, sy + h * 0.03, w, sy - h * 0.01);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();
  // 脚印（一串，微微发光）
  for (let i = 0; i < 7; i++) {
    const fx = w * (0.16 + i * 0.1);
    const fy = h * (0.86 - i * 0.02) + (i % 2) * 7;
    ctx.fillStyle = "rgba(40,52,74,0.5)";
    ctx.beginPath();
    ctx.ellipse(fx, fy, 5, 8, 0.3, 0, TAU);
    ctx.fill();
  }
  // 披雪枯树 ×2
  const tree = (tx: number, scale: number) => {
    ctx.strokeStyle = "#2c3444";
    ctx.lineWidth = 3 * scale;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(tx, h * 0.8);
    ctx.lineTo(tx, h * 0.62);
    ctx.moveTo(tx, h * 0.68);
    ctx.lineTo(tx - 14 * scale, h * 0.6);
    ctx.moveTo(tx, h * 0.66);
    ctx.lineTo(tx + 16 * scale, h * 0.56);
    ctx.stroke();
    ctx.strokeStyle = "rgba(235,240,250,0.85)";
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.moveTo(tx - 1, h * 0.62);
    ctx.lineTo(tx - 13 * scale, h * 0.598);
    ctx.moveTo(tx + 1, h * 0.655);
    ctx.lineTo(tx + 15 * scale, h * 0.556);
    ctx.stroke();
  };
  tree(w * 0.12, 1.1);
  tree(w * 0.88, 0.9);
  // 一盏立在雪里的小灯
  const lx = w * 0.5;
  const ly = h * 0.72;
  const fl = 0.7 + 0.3 * Math.sin(t * 2.4);
  ctx.globalCompositeOperation = "lighter";
  const g = ctx.createRadialGradient(lx, ly, 3, lx, ly, w * 0.11);
  g.addColorStop(0, `rgba(255,200,120,${(0.5 * fl).toFixed(3)})`);
  g.addColorStop(1, "rgba(255,200,120,0)");
  ctx.fillStyle = g;
  ctx.fillRect(lx - w * 0.11, ly - w * 0.11, w * 0.22, w * 0.22);
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "#1c2430";
  ctx.fillRect(lx - 2.5, ly, 5, h * 0.06);
  ctx.fillStyle = `rgba(255,220,150,${(0.75 + 0.25 * fl).toFixed(3)})`;
  ctx.beginPath();
  ctx.arc(lx, ly - 4, 6.5, 0, TAU);
  ctx.fill();
}

function drawCloudsea(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  // 云海（多层云，缓慢翻涌）
  for (let layer = 0; layer < 4; layer++) {
    const ly = h * (0.52 + layer * 0.12);
    const amp = 14 - layer * 2;
    const speed = 0.14 + layer * 0.05;
    const alpha = 0.32 - layer * 0.06;
    ctx.fillStyle = `rgba(150,160,200,${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, ly);
    for (let x = 0; x <= w; x += 8) {
      const y = ly + Math.sin(x * 0.012 + t * speed + layer * 2) * amp + Math.sin(x * 0.004 + t * speed * 0.6) * amp * 0.7;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
  }
  // 云缝里的微光
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 6; i++) {
    const x = w * ((i + 0.5) / 6);
    const y = h * 0.66 + Math.sin(i * 2.4) * 14;
    const a = 0.05 + 0.05 * Math.sin(t * 0.9 + i * 1.3);
    ctx.fillStyle = `rgba(255,214,150,${a.toFixed(3)})`;
    ctx.beginPath();
    ctx.ellipse(x, y, w * 0.07, h * 0.02, 0, 0, TAU);
    ctx.fill();
  }
  ctx.globalCompositeOperation = "source-over";
  // 山脊岩石（观景点）
  ctx.fillStyle = "#141b2e";
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(0, h * 0.78);
  ctx.lineTo(w * 0.14, h * 0.7);
  ctx.lineTo(w * 0.24, h * 0.76);
  ctx.lineTo(w * 0.3, h);
  ctx.closePath();
  ctx.fill();
  // 坐在岩石上的小小剪影
  ctx.fillStyle = "#0d1424";
  ctx.beginPath();
  ctx.ellipse(w * 0.16, h * 0.685, w * 0.014, h * 0.03, 0, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(w * 0.16, h * 0.65, w * 0.009, 0, TAU);
  ctx.fill();
}

/** 樱雨（春限）：老樱 + 石灯笼 + 花吹雪 */
function drawSakura(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  // 地面
  ctx.fillStyle = "rgba(26,14,26,0.9)";
  ctx.fillRect(0, h * 0.86, w, h * 0.14);
  // 石灯笼
  const lx = w * 0.24;
  const ly = h * 0.8;
  ctx.fillStyle = "#241820";
  ctx.fillRect(lx - 7, ly, 14, h * 0.07);
  ctx.fillRect(lx - 13, ly - 8, 26, 9);
  ctx.beginPath();
  ctx.moveTo(lx - 16, ly - 8);
  ctx.lineTo(lx + 16, ly - 8);
  ctx.lineTo(lx, ly - 26);
  ctx.closePath();
  ctx.fill();
  // 灯笼里的暖光
  const flick = 0.7 + 0.25 * Math.sin(t * 2.6);
  ctx.globalCompositeOperation = "lighter";
  const lg = ctx.createRadialGradient(lx, ly - 14, 1, lx, ly - 14, 18);
  lg.addColorStop(0, `rgba(255,205,140,${(0.7 * flick).toFixed(3)})`);
  lg.addColorStop(1, "rgba(255,205,140,0)");
  ctx.fillStyle = lg;
  ctx.fillRect(lx - 18, ly - 32, 36, 36);
  ctx.globalCompositeOperation = "source-over";
  // 老樱（右侧）
  const tx = w * 0.72;
  ctx.strokeStyle = "#1e1018";
  ctx.lineWidth = w * 0.018;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(tx, h * 0.9);
  ctx.quadraticCurveTo(tx - w * 0.03, h * 0.6, tx - w * 0.06, h * 0.42);
  ctx.moveTo(tx - w * 0.035, h * 0.62);
  ctx.quadraticCurveTo(tx + w * 0.06, h * 0.5, tx + w * 0.12, h * 0.4);
  ctx.stroke();
  // 花冠（几团半透明的粉）
  const blobs: [number, number, number][] = [
    [tx - w * 0.09, h * 0.36, w * 0.11],
    [tx - w * 0.02, h * 0.3, w * 0.13],
    [tx + w * 0.1, h * 0.34, w * 0.1],
    [tx + w * 0.02, h * 0.22, w * 0.09],
    [tx + w * 0.16, h * 0.28, w * 0.07],
  ];
  for (const [bx, by, br] of blobs) {
    const sway = Math.sin(t * 0.9 + bx) * 2;
    const g = ctx.createRadialGradient(bx + sway, by, br * 0.2, bx + sway, by, br);
    g.addColorStop(0, "rgba(244,184,200,0.5)");
    g.addColorStop(0.7, "rgba(232,150,170,0.26)");
    g.addColorStop(1, "rgba(232,150,170,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(bx + sway, by, br, 0, TAU);
    ctx.fill();
  }
  // 枝上零星亮瓣
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 14; i++) {
    const a = 0.3 + 0.3 * Math.sin(t * 1.8 + i * 1.3);
    ctx.fillStyle = `rgba(255,214,224,${a.toFixed(3)})`;
    const bx = tx - w * 0.1 + ((i * 97) % 100) / 100 * w * 0.28;
    const by = h * 0.2 + ((i * 61) % 100) / 100 * h * 0.2;
    ctx.beginPath();
    ctx.arc(bx, by, 1.6, 0, TAU);
    ctx.fill();
  }
  ctx.globalCompositeOperation = "source-over";
}

/** 荷风（夏限）：荷池 + 白荷 + 蜻蜓 + 萤火 */
function drawLotus(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  // 池面
  ctx.fillStyle = "rgba(8,32,34,0.95)";
  ctx.fillRect(0, h * 0.68, w, h * 0.32);
  // 月光在水面
  ctx.globalCompositeOperation = "lighter";
  const mg = ctx.createLinearGradient(0, h * 0.68, 0, h);
  mg.addColorStop(0, "rgba(184,224,208,0.14)");
  mg.addColorStop(1, "rgba(184,224,208,0)");
  ctx.fillStyle = mg;
  ctx.fillRect(0, h * 0.68, w, h * 0.32);
  ctx.globalCompositeOperation = "source-over";
  // 荷叶
  const leaves: [number, number, number, number][] = [
    [w * 0.2, h * 0.78, w * 0.13, -0.15],
    [w * 0.42, h * 0.84, w * 0.16, 0.1],
    [w * 0.72, h * 0.8, w * 0.14, -0.08],
    [w * 0.88, h * 0.88, w * 0.11, 0.2],
  ];
  for (const [lx, ly, lr, rot] of leaves) {
    const bob = Math.sin(t * 1.2 + lx) * 2;
    ctx.save();
    ctx.translate(lx, ly + bob);
    ctx.rotate(rot);
    ctx.fillStyle = "#12443c";
    ctx.beginPath();
    ctx.ellipse(0, 0, lr, lr * 0.38, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "rgba(184,224,208,0.25)";
    ctx.lineWidth = 1;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(i * 0.5) * lr * 0.9, Math.sin(i * 0.5) * lr * 0.34);
      ctx.stroke();
    }
    // 叶心水珠
    ctx.fillStyle = `rgba(220,250,240,${(0.5 + 0.3 * Math.sin(t * 2 + lx)).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(lr * 0.2, -lr * 0.05, 2, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  // 白荷（中央偏右，半开）
  const fx = w * 0.58;
  const fy = h * 0.66;
  const open = 0.5 + 0.5 * Math.sin(t * 0.6);
  ctx.save();
  ctx.translate(fx, fy);
  const petalsN = 7;
  for (let i = 0; i < petalsN; i++) {
    const a = -Math.PI / 2 + (i - (petalsN - 1) / 2) * 0.36;
    ctx.save();
    ctx.rotate(a * (0.8 + open * 0.2));
    const pg = ctx.createLinearGradient(0, 0, 0, -h * 0.1);
    pg.addColorStop(0, "rgba(250,230,235,0.95)");
    pg.addColorStop(1, "rgba(244,190,205,0.75)");
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-w * 0.016, -h * 0.06, 0, -h * 0.095);
    ctx.quadraticCurveTo(w * 0.016, -h * 0.06, 0, 0);
    ctx.fill();
    ctx.restore();
  }
  // 花心微光
  ctx.globalCompositeOperation = "lighter";
  const fg = ctx.createRadialGradient(0, -h * 0.02, 1, 0, -h * 0.02, 20);
  fg.addColorStop(0, `rgba(255,240,190,${(0.4 + 0.25 * open).toFixed(3)})`);
  fg.addColorStop(1, "rgba(255,240,190,0)");
  ctx.fillStyle = fg;
  ctx.beginPath();
  ctx.arc(0, -h * 0.02, 20, 0, TAU);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";
  ctx.restore();
  // 蜻蜓绕荷盘旋
  const da = t * 0.9;
  const dx = fx + Math.cos(da) * w * 0.16;
  const dy = fy - h * 0.12 + Math.sin(da * 2) * h * 0.03;
  ctx.fillStyle = "#9bd4c0";
  ctx.beginPath();
  ctx.ellipse(dx, dy, 6, 1.6, Math.cos(da) * 0.5, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = "rgba(200,240,230,0.5)";
  ctx.lineWidth = 1;
  const wing = Math.sin(t * 24) * 0.6;
  ctx.beginPath();
  ctx.ellipse(dx - 2, dy - 3, 5, 2, -0.6 + wing, 0, TAU);
  ctx.ellipse(dx + 2, dy - 3, 5, 2, 0.6 - wing, 0, TAU);
  ctx.stroke();
}

/** 海上月（秋限）：满月 + 银路 + 小舟 */
function drawMoonrise(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const hor = h * 0.62;
  const mx = w * 0.5;
  const my = h * 0.3 - Math.sin(t * 0.12) * h * 0.02;
  // 月晕
  const halo = ctx.createRadialGradient(mx, my, w * 0.05, mx, my, w * 0.5);
  halo.addColorStop(0, "rgba(232,240,250,0.5)");
  halo.addColorStop(0.3, "rgba(210,225,245,0.18)");
  halo.addColorStop(1, "rgba(210,225,245,0)");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, w, h);
  // 满月
  ctx.beginPath();
  ctx.fillStyle = "#eef4fc";
  ctx.arc(mx, my, w * 0.085, 0, TAU);
  ctx.fill();
  // 月面纹理
  ctx.fillStyle = "rgba(190,205,228,0.5)";
  ctx.beginPath();
  ctx.arc(mx - w * 0.025, my - w * 0.02, w * 0.014, 0, TAU);
  ctx.arc(mx + w * 0.03, my + w * 0.025, w * 0.01, 0, TAU);
  ctx.arc(mx + w * 0.005, my + w * 0.04, w * 0.007, 0, TAU);
  ctx.fill();
  // 海面
  ctx.fillStyle = "rgba(10,24,44,0.9)";
  ctx.fillRect(0, hor, w, h - hor);
  // 月光银路
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 14; i++) {
    const y = hor + 4 + i * 9;
    const spread = i * w * 0.014;
    const a = 0.2 - i * 0.012 + 0.06 * Math.sin(t * 1.6 + i * 0.7);
    ctx.fillStyle = `rgba(225,238,252,${Math.max(0.02, a).toFixed(3)})`;
    ctx.fillRect(mx - w * 0.045 - spread, y, w * 0.09 + spread * 2, 1.6);
  }
  ctx.globalCompositeOperation = "source-over";
  // 一叶小舟剪影
  const bx = w * 0.3 + Math.sin(t * 0.4) * 8;
  const by = hor + h * 0.1 + Math.sin(t * 1.4) * 2.5;
  ctx.fillStyle = "#081428";
  ctx.beginPath();
  ctx.moveTo(bx - w * 0.06, by);
  ctx.quadraticCurveTo(bx, by + h * 0.03, bx + w * 0.06, by);
  ctx.quadraticCurveTo(bx, by + h * 0.014, bx - w * 0.06, by);
  ctx.fill();
  // 舟上人影 + 一盏小灯
  ctx.beginPath();
  ctx.arc(bx + w * 0.01, by - h * 0.028, w * 0.012, 0, TAU);
  ctx.fill();
  ctx.fillRect(bx + w * 0.004, by - h * 0.02, w * 0.012, h * 0.02);
  const lamp = 0.6 + 0.35 * Math.sin(t * 3);
  ctx.globalCompositeOperation = "lighter";
  const lgp = ctx.createRadialGradient(bx - w * 0.035, by - h * 0.01, 0.5, bx - w * 0.035, by - h * 0.01, 12);
  lgp.addColorStop(0, `rgba(255,214,150,${(0.75 * lamp).toFixed(3)})`);
  lgp.addColorStop(1, "rgba(255,214,150,0)");
  ctx.fillStyle = lgp;
  ctx.fillRect(bx - w * 0.06, by - h * 0.04, w * 0.05, h * 0.06);
  ctx.globalCompositeOperation = "source-over";
  ctx.beginPath();
  ctx.fillStyle = `rgba(255,224,170,${(0.5 + 0.4 * lamp).toFixed(3)})`;
  ctx.arc(bx - w * 0.035, by - h * 0.01, 2, 0, TAU);
  ctx.fill();
  // 远处山影
  ctx.fillStyle = "rgba(8,16,32,0.8)";
  ctx.beginPath();
  ctx.moveTo(0, hor);
  ctx.quadraticCurveTo(w * 0.12, hor - h * 0.06, w * 0.22, hor);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(w * 0.8, hor);
  ctx.quadraticCurveTo(w * 0.9, hor - h * 0.05, w, hor - h * 0.01);
  ctx.lineTo(w, hor);
  ctx.closePath();
  ctx.fill();
}

/** 围炉（冬限）：石炉 + 火 + 水壶 + 窗外雪 */
function drawHearth(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  // 木地板
  ctx.fillStyle = "rgba(34,20,12,0.9)";
  ctx.fillRect(0, h * 0.78, w, h * 0.22);
  ctx.strokeStyle = "rgba(70,44,26,0.6)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const y = h * 0.8 + i * h * 0.04;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  // 窗（左上，窗外落雪）
  const wx = w * 0.16;
  const wy = h * 0.26;
  ctx.fillStyle = "#0c1626";
  ctx.fillRect(wx - w * 0.08, wy - h * 0.11, w * 0.16, h * 0.22);
  ctx.strokeStyle = "#3a2a1a";
  ctx.lineWidth = 3;
  ctx.strokeRect(wx - w * 0.08, wy - h * 0.11, w * 0.16, h * 0.22);
  ctx.beginPath();
  ctx.moveTo(wx, wy - h * 0.11);
  ctx.lineTo(wx, wy + h * 0.11);
  ctx.moveTo(wx - w * 0.08, wy);
  ctx.lineTo(wx + w * 0.08, wy);
  ctx.stroke();
  // 窗内远山与月
  ctx.fillStyle = "rgba(232,240,250,0.8)";
  ctx.beginPath();
  ctx.arc(wx + w * 0.04, wy - h * 0.05, 6, 0, TAU);
  ctx.fill();
  ctx.fillStyle = "rgba(30,44,66,0.9)";
  ctx.beginPath();
  ctx.moveTo(wx - w * 0.08, wy + h * 0.11);
  ctx.lineTo(wx - w * 0.02, wy + h * 0.02);
  ctx.lineTo(wx + w * 0.05, wy + h * 0.11);
  ctx.closePath();
  ctx.fill();
  // 窗台积雪
  ctx.fillStyle = "rgba(235,242,250,0.9)";
  ctx.fillRect(wx - w * 0.085, wy + h * 0.105, w * 0.17, 4);
  // 石炉（中下）
  const hx = w * 0.56;
  const hy = h * 0.8;
  ctx.fillStyle = "#2a2420";
  ctx.beginPath();
  ctx.ellipse(hx, hy + 8, w * 0.13, h * 0.035, 0, 0, TAU);
  ctx.fill();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    ctx.fillStyle = i % 2 ? "#3a322c" : "#322a24";
    ctx.beginPath();
    ctx.ellipse(hx + Math.cos(a) * w * 0.1, hy + Math.sin(a) * h * 0.022, w * 0.022, h * 0.016, a, 0, TAU);
    ctx.fill();
  }
  // 柴
  ctx.strokeStyle = "#4a3620";
  ctx.lineWidth = w * 0.014;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(hx - w * 0.06, hy);
  ctx.lineTo(hx + w * 0.06, hy - h * 0.015);
  ctx.moveTo(hx - w * 0.05, hy - h * 0.012);
  ctx.lineTo(hx + w * 0.05, hy + h * 0.005);
  ctx.stroke();
  // 火（多层摇曳）
  const fl = (sc: number, hue: string, ph: number) => {
    const sway = Math.sin(t * 7 + ph) * w * 0.006;
    const hgt = h * 0.075 * sc * (1 + 0.14 * Math.sin(t * 9 + ph));
    ctx.fillStyle = hue;
    ctx.beginPath();
    ctx.moveTo(hx - w * 0.035 * sc, hy - h * 0.005);
    ctx.quadraticCurveTo(hx - w * 0.02 * sc + sway, hy - hgt * 0.6, hx + sway, hy - hgt);
    ctx.quadraticCurveTo(hx + w * 0.02 * sc + sway, hy - hgt * 0.6, hx + w * 0.035 * sc, hy - h * 0.005);
    ctx.closePath();
    ctx.fill();
  };
  ctx.globalCompositeOperation = "lighter";
  fl(1.25, "rgba(255,120,50,0.5)", 0);
  fl(0.95, "rgba(255,170,70,0.75)", 1.3);
  fl(0.6, "rgba(255,220,130,0.9)", 2.1);
  // 整屋暖光
  const room = ctx.createRadialGradient(hx, hy - h * 0.04, 10, hx, hy - h * 0.04, w * 0.55);
  room.addColorStop(0, `rgba(255,170,90,${(0.2 + 0.06 * Math.sin(t * 6)).toFixed(3)})`);
  room.addColorStop(1, "rgba(255,170,90,0)");
  ctx.fillStyle = room;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = "source-over";
  // 三脚水壶
  const kx = hx + w * 0.16;
  const ky = hy - h * 0.005;
  ctx.fillStyle = "#1e1a18";
  ctx.beginPath();
  ctx.ellipse(kx, ky, w * 0.035, h * 0.026, 0, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(kx, ky - h * 0.02, w * 0.02, Math.PI, TAU);
  ctx.fill();
  // 壶嘴蒸汽
  ctx.strokeStyle = "rgba(230,225,215,0.3)";
  ctx.lineWidth = 1.6;
  for (let i = 0; i < 2; i++) {
    const sx = kx + w * 0.03 + i * 4;
    ctx.beginPath();
    ctx.moveTo(sx, ky - h * 0.03);
    ctx.quadraticCurveTo(sx + 5 + Math.sin(t * 2 + i) * 4, ky - h * 0.07, sx + Math.sin(t * 1.6 + i) * 6, ky - h * 0.11);
    ctx.stroke();
  }
}

const SCENE_DRAW: Record<SceneKey, (c: CanvasRenderingContext2D, w: number, h: number, t: number) => void> = {
  harbor: drawHarbor,
  lighthouse: drawLighthouse,
  forest: drawForest,
  lantern: drawLantern,
  spring: drawSpring,
  sea: drawSea,
  whale: drawWhale,
  stars: drawStars,
  cave: drawCave,
  meadow: drawMeadow,
  rain: drawRain,
  dawn: drawDawn,
  village: drawVillage,
  bridge: drawBridge,
  field: drawField,
  snow: drawSnow,
  cloudsea: drawCloudsea,
  sakura: drawSakura,
  lotus: drawLotus,
  moonrise: drawMoonrise,
  hearth: drawHearth,
};

/* ---------- 互动彩蛋：一次性粒子爆发 ---------- */

export function burstFx(scene: SceneKey, w: number, h: number): Particle[] {
  const ps: Particle[] = [];
  const R = (a: number, b: number) => a + Math.random() * (b - a);
  const push = (p: Partial<Particle> & { kind: Particle["kind"] }) =>
    ps.push({ x: 0, y: 0, vx: 0, vy: 0, r: 2, phase: R(0, TAU), speed: R(0.6, 1.4), ...p });

  switch (scene) {
    case "lighthouse":
      for (let i = 0; i < 20; i++)
        push({ kind: "spark", x: w * 0.5, y: h * 0.3, vx: R(-2, 2), vy: R(-2, 2), r: R(1.5, 3), life: 1 });
      break;
    case "forest":
    case "lantern":
      for (let i = 0; i < 22; i++)
        push({ kind: "firefly", x: R(w * 0.2, w * 0.8), y: R(h * 0.5, h * 0.9), r: R(1.4, 2.8), speed: R(1, 2) });
      break;
    case "spring":
    case "cave":
      for (let i = 0; i < 4; i++)
        push({ kind: "ripple", x: R(w * 0.3, w * 0.7), y: h * (scene === "cave" ? 0.82 : 0.72), speed: R(0.8, 1.4) });
      break;
    case "sea":
    case "bridge":
      for (let i = 0; i < 16; i++)
        push({ kind: "spark", x: R(w * 0.25, w * 0.75), y: h * 0.72, vx: R(-1.4, 1.4), vy: R(-3, -1), r: R(1, 2.4), life: 1 });
      break;
    case "whale":
      for (let i = 0; i < 22; i++)
        push({ kind: "spark", x: w * 0.45, y: h * 0.6, vx: R(-2.5, 2.5), vy: R(-4.5, -1.5), r: R(1.2, 2.6), life: 1 });
      for (let i = 0; i < 8; i++)
        push({ kind: "bubble", x: R(w * 0.35, w * 0.55), y: h * 0.75, r: R(1.5, 3.5) });
      break;
    case "stars":
    case "meadow":
      push({ kind: "shooting", x: R(w * 0.1, w * 0.4), y: R(h * 0.05, h * 0.2), vx: 7, vy: 3.4, life: 1 });
      break;
    case "harbor":
    case "dawn":
      for (let i = 0; i < 3; i++)
        push({ kind: "gull", x: R(-w * 0.1, w * 0.3), y: R(h * 0.1, h * 0.3), speed: R(0.6, 1.1) });
      break;
    case "rain":
      for (let i = 0; i < 40; i++)
        push({ kind: "rain", x: R(0, w), y: R(-h * 0.2, 0), vy: R(6, 9), life: 1 });
      break;
    case "village":
      for (let i = 0; i < 14; i++)
        push({ kind: "ember", x: R(w * 0.35, w * 0.6), y: h * 0.5, vx: R(-0.6, 0.6), vy: R(0.5, 1.4), r: R(1.2, 2.4), life: 1 });
      break;
    case "field":
      for (let i = 0; i < 30; i++)
        push({ kind: "pollen", x: R(0, w), y: R(h * 0.5, h), vx: R(-0.5, 0.5), vy: R(0.4, 1.2), r: R(1, 2.4), life: 1 });
      break;
    case "snow":
      for (let i = 0; i < 34; i++)
        push({ kind: "snowflake", x: R(0, w), y: R(-h * 0.15, 0), vy: R(1.2, 3), r: R(1, 2.6), life: 1 });
      break;
    case "cloudsea":
      for (let i = 0; i < 5; i++)
        push({ kind: "gull", x: R(-w * 0.1, w * 0.4), y: R(h * 0.08, h * 0.26), speed: R(0.6, 1.2) });
      break;
    case "sakura":
      for (let i = 0; i < 26; i++)
        push({ kind: "petal", x: R(0, w), y: R(-h * 0.1, h * 0.5), vy: R(1, 2.4), r: R(2.4, 4.6), life: 1 });
      break;
    case "lotus":
      for (let i = 0; i < 4; i++)
        push({ kind: "ripple", x: R(w * 0.3, w * 0.7), y: h * 0.82, speed: R(0.8, 1.4) });
      break;
    case "moonrise":
      push({ kind: "shooting", x: R(w * 0.1, w * 0.4), y: R(h * 0.05, h * 0.2), vx: 7, vy: 3.2, life: 1 });
      for (let i = 0; i < 10; i++)
        push({ kind: "glow", x: R(w * 0.2, w * 0.8), y: R(h * 0.6, h * 0.85), r: R(1, 2), life: 1 });
      break;
    case "hearth":
      for (let i = 0; i < 20; i++)
        push({ kind: "ember", x: R(w * 0.42, w * 0.7), y: h * 0.76, vx: R(-0.8, 0.8), vy: R(1, 2.6), r: R(1.2, 2.6), life: 1 });
      break;
  }
  return ps;
}

/* ---------- 粒子绘制 ---------- */

function drawParticles(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, dt: number, ps: Particle[]) {
  for (const p of ps) {
    if (p.kind === "firefly") {
      p.x += Math.sin(t * p.speed + p.phase) * 0.4;
      p.y += Math.cos(t * p.speed * 0.8 + p.phase) * 0.3;
      const a = 0.3 + 0.45 * Math.sin(t * 2.2 * p.speed + p.phase);
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = `rgba(255,214,130,${Math.max(0.05, a).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, TAU);
      ctx.fill();
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
      g.addColorStop(0, `rgba(255,214,130,${(a * 0.35).toFixed(3)})`);
      g.addColorStop(1, "rgba(255,214,130,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 4, 0, TAU);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
    } else if (p.kind === "star") {
      const a = 0.25 + 0.5 * Math.sin(t * 1.6 * p.speed + p.phase);
      ctx.fillStyle = `rgba(235,240,250,${Math.max(0.05, a).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, TAU);
      ctx.fill();
    } else if (p.kind === "bubble") {
      p.y -= 0.5 * p.speed;
      p.x += Math.sin(t * 2 + p.phase) * 0.4;
      if (p.y < h * 0.3) p.y = h * 0.95;
      ctx.strokeStyle = "rgba(160,200,240,0.3)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r + 1.5, 0, TAU);
      ctx.stroke();
    } else if (p.kind === "ripple") {
      p.phase += dt * 0.8 * p.speed;
      const rr = (p.phase % 1) * w * 0.16;
      const a = 0.3 * (1 - (p.phase % 1));
      ctx.strokeStyle = `rgba(180,220,230,${a.toFixed(3)})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, rr, rr * 0.3, 0, 0, TAU);
      ctx.stroke();
    } else if (p.kind === "gull") {
      p.x += p.speed;
      if (p.x > w + 20) p.x = -20;
      const flap = Math.sin(t * 6 + p.phase) * 4;
      ctx.strokeStyle = "rgba(240,235,225,0.5)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(p.x - 6, p.y - flap);
      ctx.quadraticCurveTo(p.x, p.y + 3, p.x, p.y);
      ctx.quadraticCurveTo(p.x, p.y + 3, p.x + 6, p.y - flap);
      ctx.stroke();
    } else if (p.kind === "shooting") {
      p.x += p.vx;
      p.y += p.vy;
      const life = p.life ?? 0;
      ctx.globalCompositeOperation = "lighter";
      const g = ctx.createLinearGradient(p.x, p.y, p.x - p.vx * 9, p.y - p.vy * 9);
      g.addColorStop(0, `rgba(255,240,205,${(0.85 * life).toFixed(3)})`);
      g.addColorStop(1, "rgba(255,240,205,0)");
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 9, p.y - p.vy * 9);
      ctx.stroke();
      ctx.fillStyle = `rgba(255,245,220,${(0.9 * life).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, TAU);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
    } else if (p.kind === "rain") {
      p.y += (p.vy || 5) * dt * 60;
      p.x += dt * 40;
      const bounded = p.life === undefined;
      if (p.y > h * 0.92) {
        if (bounded) {
          p.y = -10;
          p.x = rand(0, w);
        } else if (p.life !== undefined) p.life = 0;
      }
      const a = bounded ? 0.22 : 0.3 * Math.max(0, p.life ?? 0);
      ctx.strokeStyle = `rgba(190,214,230,${a.toFixed(3)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - 2.4, p.y + 8);
      ctx.stroke();
    } else if (p.kind === "glow") {
      p.x += Math.sin(t * 0.7 * p.speed + p.phase) * 0.25;
      p.y += Math.cos(t * 0.55 * p.speed + p.phase) * 0.2;
      const a = 0.22 + 0.28 * Math.sin(t * 1.8 * p.speed + p.phase);
      ctx.globalCompositeOperation = "lighter";
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4.5);
      g.addColorStop(0, `rgba(150,225,210,${Math.max(0.04, a).toFixed(3)})`);
      g.addColorStop(1, "rgba(150,225,210,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 4.5, 0, TAU);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
    } else if (p.kind === "ember") {
      p.y -= (p.vy || 0.5) * dt * 30;
      p.x += Math.sin(t * 1.5 + p.phase) * 0.4;
      const bounded = p.life === undefined;
      if (p.y < h * 0.15) {
        if (bounded) {
          p.y = h * 0.6 + rand(0, h * 0.2);
          p.x = rand(0, w);
        } else if (p.life !== undefined) p.life = 0;
      }
      const a = bounded ? 0.3 + 0.3 * Math.sin(t * 3 + p.phase) : 0.6 * Math.max(0, p.life ?? 0);
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = `rgba(255,170,90,${Math.max(0.05, a).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, TAU);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
    } else if (p.kind === "pollen") {
      p.y -= (p.vy || 0.5) * dt * 14;
      p.x += Math.sin(t * 0.9 * p.speed + p.phase) * 0.5;
      const bounded = p.life === undefined;
      if (p.y < h * 0.25) {
        if (bounded) {
          p.y = h * 0.95;
          p.x = rand(0, w);
        } else if (p.life !== undefined) p.life = 0;
      }
      const a = bounded ? 0.3 + 0.3 * Math.sin(t * 2 + p.phase) : 0.7 * Math.max(0, p.life ?? 0);
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = `rgba(255,215,140,${Math.max(0.05, a).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, TAU);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
    } else if (p.kind === "snowflake") {
      p.y += (p.vy || 1) * dt * 26;
      p.x += Math.sin(t * 0.8 + p.phase) * 0.5;
      const bounded = p.life === undefined;
      if (p.y > h * 0.95) {
        if (bounded) {
          p.y = -8;
          p.x = rand(0, w);
        } else if (p.life !== undefined) p.life = 0;
      }
      const a = bounded ? 0.5 + 0.3 * Math.sin(t * 1.4 + p.phase) : 0.8 * Math.max(0, p.life ?? 0);
      ctx.fillStyle = `rgba(235,240,250,${Math.max(0.1, a).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, TAU);
      ctx.fill();
    } else if (p.kind === "petal") {
      // 樱瓣：慢落 + 横摆 + 翻转
      p.y += (p.vy || 0.8) * dt * 30;
      p.x += Math.sin(t * 1.3 + p.phase) * 0.9;
      const rot = t * 1.8 + p.phase;
      const petalBounded = p.life === undefined;
      if (p.y > h * 0.94) {
        if (petalBounded) {
          p.y = -8;
          p.x = rand(0, w);
        } else if (p.life !== undefined) p.life = 0;
      }
      const pa = petalBounded ? 0.85 : 0.9 * Math.max(0, p.life ?? 0);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(rot);
      ctx.scale(1, 0.45 + 0.55 * Math.abs(Math.sin(rot * 1.4)));
      ctx.fillStyle = `rgba(244,184,200,${pa.toFixed(3)})`;
      ctx.beginPath();
      ctx.moveTo(0, -p.r);
      ctx.quadraticCurveTo(p.r, 0, 0, p.r);
      ctx.quadraticCurveTo(-p.r, 0, 0, -p.r);
      ctx.fill();
      ctx.restore();
    } else {
      // spark（burst 火花：受重力、随生命淡出）
      p.vx *= 0.985;
      p.vy = p.vy * 0.985 + 30 * dt;
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;
      const life = p.life ?? 1;
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = `rgba(255,224,170,${(0.7 * Math.max(0, life)).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * Math.max(0.2, life), 0, TAU);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
    }
  }
}

export function drawScene(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  dt: number,
  scene: SceneKey,
  ps: Particle[]
) {
  // burst 粒子生命周期衰减与清理
  for (let i = ps.length - 1; i >= 0; i--) {
    const p = ps[i];
    if (p.life !== undefined) {
      p.life -= dt * 0.85;
      if (p.life <= 0) ps.splice(i, 1);
    }
  }
  gradient(ctx, w, h, PALETTES[scene]);
  SCENE_DRAW[scene](ctx, w, h, t);
  drawParticles(ctx, w, h, t, dt, ps);
}
