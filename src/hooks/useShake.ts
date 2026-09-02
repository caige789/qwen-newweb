import { useEffect, useRef, useState } from "react";

/**
 * 摇一摇检测（devicemotion）。
 * iOS 13+ 需要显式授权，返回 needPermission 与 request()。
 */
export function useShake(onShake: () => void, threshold = 15) {
  const [needPermission, setNeedPermission] = useState(false);
  const [granted, setGranted] = useState(false);
  const cb = useRef(onShake);
  cb.current = onShake;
  const last = useRef({ t: 0, shakeAt: 0 });

  const handler = (e: DeviceMotionEvent) => {
    const a = e.accelerationIncludingGravity;
    if (!a || a.x == null || a.y == null || a.z == null) return;
    const now = Date.now();
    if (now - last.current.t < 90) return;
    const speed = Math.abs(a.x) + Math.abs(a.y) + Math.abs(a.z);
    last.current.t = now;
    if (speed > threshold && now - last.current.shakeAt > 1400) {
      last.current.shakeAt = now;
      cb.current();
    }
  };

  const request = async () => {
    const DM = DeviceMotionEvent as unknown as {
      requestPermission?: () => Promise<string>;
    };
    try {
      if (typeof DM.requestPermission === "function") {
        const r = await DM.requestPermission();
        setGranted(r === "granted");
      } else {
        setGranted(true);
      }
    } catch {
      setGranted(false);
    }
  };

  useEffect(() => {
    const DM = DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> };
    if (typeof DM.requestPermission === "function") setNeedPermission(true);
    else setGranted(true);
  }, []);

  useEffect(() => {
    if (!granted) return;
    window.addEventListener("devicemotion", handler);
    return () => window.removeEventListener("devicemotion", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [granted]);

  return { needPermission, granted, request };
}
