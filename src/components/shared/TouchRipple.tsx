import { useEffect, useRef } from "react";

/** 全局触摸涟漪 —— 每次点按泛起一圈光晕 + 三粒星尘 */
export default function TouchRipple() {
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;

    const spawn = (e: PointerEvent) => {
      const { clientX: x, clientY: y } = e;

      const ring = document.createElement("span");
      ring.className = "ripple-ring";
      ring.style.cssText = `position:fixed;left:${x}px;top:${y}px;width:64px;height:64px;margin:-32px 0 0 -32px;border-radius:9999px;border:1.5px solid rgba(244,196,143,0.5);pointer-events:none;z-index:90;`;
      layer.appendChild(ring);

      const glow = document.createElement("span");
      glow.className = "ripple-glow";
      glow.style.cssText = `position:fixed;left:${x}px;top:${y}px;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:9999px;background:radial-gradient(circle,rgba(255,227,174,0.5),rgba(255,227,174,0));pointer-events:none;z-index:90;`;
      layer.appendChild(glow);

      for (let i = 0; i < 3; i++) {
        const s = document.createElement("span");
        const ang = Math.random() * Math.PI * 2;
        const dist = 22 + Math.random() * 26;
        s.className = "ripple-spark";
        s.style.cssText = `position:fixed;left:${x}px;top:${y}px;width:4px;height:4px;margin:-2px 0 0 -2px;border-radius:9999px;background:#ffe3ae;box-shadow:0 0 8px rgba(255,214,150,0.8);pointer-events:none;z-index:90;--sx:${Math.cos(ang) * dist}px;--sy:${Math.sin(ang) * dist - 14}px;`;
        layer.appendChild(s);
      }

      window.setTimeout(() => {
        ring.remove();
        glow.remove();
        layer.querySelectorAll(".ripple-spark").forEach((n) => n.remove());
      }, 850);
    };

    window.addEventListener("pointerdown", spawn, { passive: true });
    return () => window.removeEventListener("pointerdown", spawn);
  }, []);

  return <div ref={layerRef} className="pointer-events-none fixed inset-0 z-[90]" aria-hidden />;
}
