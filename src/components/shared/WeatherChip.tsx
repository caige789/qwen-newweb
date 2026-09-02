import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CITIES, type WeatherInfo, type WxKind } from "../../hooks/useWeather";
import { ResetIcon } from "./icons";

const KIND_COLOR: Record<WxKind, string> = {
  sun: "#f4c48f",
  cloud: "#a3c1d6",
  fog: "#8fb0bd",
  rain: "#9db8cc",
  snow: "#e8f0fa",
  storm: "#c9b8d9",
};

/** 手绘天气小图标 */
export function WxIcon({ kind, size = 15, className }: { kind: WxKind; size?: number; className?: string }) {
  const c = KIND_COLOR[kind];
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: c,
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
  };
  if (kind === "sun")
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="4.2" />
        <path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7" />
      </svg>
    );
  const cloud = <path d="M7 17.5a4.2 4.2 0 1 1 .9-8.3A5.2 5.2 0 0 1 18 10.6a3.7 3.7 0 0 1-.6 6.9H7Z" />;
  if (kind === "cloud") return <svg {...common}>{cloud}</svg>;
  if (kind === "rain")
    return (
      <svg {...common}>
        <path d="M7 15.5a4.2 4.2 0 1 1 .9-8.3A5.2 5.2 0 0 1 18 8.6a3.7 3.7 0 0 1-.6 6.9H7Z" />
        <path d="M8.5 18.5l-1 2.6M12.5 18.5l-1 2.6M16.5 18.5l-1 2.6" />
      </svg>
    );
  if (kind === "snow")
    return (
      <svg {...common}>
        <path d="M7 15.5a4.2 4.2 0 1 1 .9-8.3A5.2 5.2 0 0 1 18 8.6a3.7 3.7 0 0 1-.6 6.9H7Z" />
        <circle cx="9" cy="19.5" r="0.9" fill={c} stroke="none" />
        <circle cx="13" cy="21" r="0.9" fill={c} stroke="none" />
        <circle cx="16.5" cy="19" r="0.9" fill={c} stroke="none" />
      </svg>
    );
  if (kind === "fog")
    return (
      <svg {...common}>
        <path d="M4 9h13M6 12.5h14M4 16h11" />
      </svg>
    );
  return (
    <svg {...common}>
      <path d="M7 14.5a4.2 4.2 0 1 1 .9-8.3A5.2 5.2 0 0 1 18 7.6a3.7 3.7 0 0 1-.6 6.9h-1.9" />
      <path d="M12.5 13.5 10 18h3l-2 4.5" fill="none" />
    </svg>
  );
}

interface Props {
  wx: WeatherInfo | null;
  loading: boolean;
  cityId: string;
  onPick: (id: string) => void;
  onRefresh: () => void;
}

/** 顶栏天气胶囊：实时温度 + 城市，点开可换城市 / 刷新 */
export default function WeatherChip({ wx, loading, cityId, onPick, onRefresh }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <motion.button
        whileTap={{ scale: 0.94 }}
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 items-center gap-1.5 rounded-full border border-paper/14 bg-ink/50 px-3 text-xs text-paper/85 transition-colors hover:border-apricot/40"
        aria-label="实时天气，点击切换城市"
        title={wx ? `${wx.city} · ${wx.label} ${wx.temp}°C · 风速 ${wx.wind} km/h` : "实时天气"}
      >
        {loading && !wx ? (
          <span className="h-2 w-2 animate-pulse rounded-full bg-mist/70" />
        ) : wx ? (
          <>
            <WxIcon kind={wx.kind} size={15} />
            <span className="tabular-nums font-medium">
              {wx.temp}°<span className="text-fog/70">{wx.label}</span>
            </span>
            <span className="hidden max-w-[64px] truncate text-fog/60 sm:inline">{wx.city}</span>
          </>
        ) : (
          <span className="text-fog/55">天气 · 离线</span>
        )}
      </motion.button>

      {/* 城市选择 */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="panel absolute right-0 top-[calc(100%+8px)] z-50 w-60 rounded-2xl p-3.5"
            >
              <p className="mb-2.5 text-center text-[10px] tracking-[0.28em] text-fog/55">岛此刻看着哪里的天</p>
              <div className="grid grid-cols-3 gap-2">
                {CITIES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      onPick(c.id);
                      setOpen(false);
                    }}
                    className={`h-10 rounded-xl border text-xs tracking-wider transition-all active:scale-95 ${
                      cityId === c.id
                        ? "border-apricot/55 bg-apricot/12 text-apricot"
                        : "border-paper/12 text-fog/75"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  onPick("auto");
                  setOpen(false);
                }}
                className={`mt-2 h-10 w-full rounded-xl border text-xs tracking-[0.2em] transition-all active:scale-95 ${
                  cityId === "auto"
                    ? "border-apricot/55 bg-apricot/12 text-apricot"
                    : "border-paper/12 text-fog/75"
                }`}
              >
                {cityId === "auto" ? "正在用我的位置 ✓" : "用我的位置"}
              </button>
              <div className="mt-2.5 flex items-center justify-between border-t border-paper/10 pt-2.5">
                <span className="text-[10px] tracking-[0.2em] text-fog/45">每 10 分钟自动刷新</span>
                <button
                  onClick={onRefresh}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-paper/15 text-fog/70 transition-all hover:text-apricot active:scale-90"
                  aria-label="刷新天气"
                >
                  <ResetIcon size={14} />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
