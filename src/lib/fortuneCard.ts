import type { Fortune } from "./poems";

/** 把一支签画成暮色卡片（1080×1440），下载为 PNG */
export async function downloadFortuneCard(f: Fortune): Promise<void> {
  try {
    await (document as Document & { fonts?: FontFaceSet }).fonts?.ready;
  } catch {
    /* 字体未就绪也用系统字体画 */
  }

  const W = 1080;
  const H = 1440;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#060d12");
  sky.addColorStop(0.42, "#0b1a22");
  sky.addColorStop(0.66, "#132e38");
  sky.addColorStop(0.82, "#274450");
  sky.addColorStop(0.93, "#8a7263");
  sky.addColorStop(1, "#b3875f");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W / 2, H * 1.02, 60, W / 2, H * 1.02, W * 0.9);
  glow.addColorStop(0, "rgba(244,196,143,0.5)");
  glow.addColorStop(1, "rgba(244,196,143,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  for (let i = 0; i < 150; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H * 0.62;
    const r = 0.6 + Math.random() * 1.8;
    ctx.beginPath();
    ctx.fillStyle = `rgba(244,236,221,${(0.15 + Math.random() * 0.55).toFixed(2)})`;
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#08151b";
  ctx.beginPath();
  ctx.moveTo(0, H);
  ctx.lineTo(0, H * 0.93);
  ctx.bezierCurveTo(W * 0.15, H * 0.885, W * 0.24, H * 0.868, W * 0.38, H * 0.865);
  ctx.bezierCurveTo(W * 0.52, H * 0.862, W * 0.6, H * 0.848, W * 0.72, H * 0.852);
  ctx.bezierCurveTo(W * 0.86, H * 0.857, W * 0.94, H * 0.9, W, H * 0.93);
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fill();

  const lx = W * 0.66;
  const ly = H * 0.845;
  const lg = ctx.createRadialGradient(lx, ly, 2, lx, ly, 90);
  lg.addColorStop(0, "rgba(255,217,160,0.9)");
  lg.addColorStop(1, "rgba(255,217,160,0)");
  ctx.fillStyle = lg;
  ctx.beginPath();
  ctx.arc(lx, ly, 90, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.fillStyle = "#ffd9a0";
  ctx.arc(lx, ly, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(143,176,189,0.85)";
  ctx.font = "300 34px 'Noto Sans SC', sans-serif";
  ctx.fillText("治 愈 光 屿 · 今 日 签", W / 2, 150);
  ctx.strokeStyle = "rgba(244,196,143,0.35)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 250, 186);
  ctx.lineTo(W / 2 + 250, 186);
  ctx.stroke();

  ctx.fillStyle = "#f4ecdd";
  ctx.shadowColor = "rgba(244,196,143,0.55)";
  ctx.shadowBlur = 42;
  ctx.font = "116px 'ZCOOL XiaoWei', serif";
  ctx.fillText(f.sign, W / 2, 430);
  ctx.shadowBlur = 0;

  ctx.fillStyle = "rgba(163,193,214,0.95)";
  ctx.font = "300 42px 'Noto Sans SC', sans-serif";
  ctx.fillText(`「${f.poem}」`, W / 2, 540);

  for (let i = 0; i < 5; i++) {
    const x = W / 2 + (i - 2) * 44;
    const lit = i < f.light;
    ctx.beginPath();
    ctx.fillStyle = lit ? "rgba(255,227,174,0.95)" : "rgba(244,236,221,0.16)";
    if (lit) {
      ctx.shadowColor = "rgba(255,214,150,0.8)";
      ctx.shadowBlur = 18;
    }
    ctx.arc(x, 640, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  ctx.fillStyle = "rgba(143,176,189,0.6)";
  ctx.font = "300 26px 'Noto Sans SC', sans-serif";
  ctx.fillText("光 量", W / 2, 700);

  const rowY = 850;
  ctx.textAlign = "left";
  const tag = (text: string, x: number, y: number, color: string) => {
    ctx.font = "500 38px 'Noto Sans SC', sans-serif";
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.4;
    ctx.strokeRect(x, y - 44, 62, 62);
    ctx.fillText(text, x + 12, y + 2);
  };
  ctx.font = "300 40px 'Noto Sans SC', sans-serif";
  ctx.fillStyle = "rgba(244,236,221,0.9)";
  tag("宜", W * 0.16, rowY, "rgba(244,196,143,0.9)");
  ctx.fillText(f.good, W * 0.16 + 92, rowY);
  tag("忌", W * 0.16, rowY + 96, "rgba(229,163,172,0.9)");
  ctx.fillText(f.avoid, W * 0.16 + 92, rowY + 96);

  const now = new Date();
  const week = "日一二三四五六"[now.getDay()];
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(143,176,189,0.75)";
  ctx.font = "300 30px 'Noto Sans SC', sans-serif";
  ctx.fillText(`${now.getMonth() + 1} 月 ${now.getDate()} 日 · 周${week}`, W * 0.16, H * 0.965);

  ctx.save();
  ctx.translate(W * 0.82, H * 0.952);
  ctx.rotate(0.08);
  ctx.fillStyle = "#c05a45";
  ctx.fillRect(-34, -34, 68, 68);
  ctx.fillStyle = "#f4ecdd";
  ctx.font = "44px 'ZCOOL XiaoWei', serif";
  ctx.textAlign = "center";
  ctx.fillText("屿", 0, 16);
  ctx.restore();

  const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, "image/png"));
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `光屿签-${f.sign}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}
