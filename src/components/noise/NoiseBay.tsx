import { useEffect, useRef, useState } from "react";
import { audio, type NoiseLayerId } from "../../lib/audio";
import { buzz } from "../../lib/haptics";
import { sleepTimer } from "../../lib/sleepTimer";
import { BrookIcon, BugIcon, ClockIcon, FireIcon, MoonIcon, RainIcon, WindIcon } from "../shared/icons";

const LAYERS: { id: NoiseLayerId; name: string; icon: React.ReactNode }[] = [
  { id: "rain", name: "细雨", icon: <RainIcon size={16} /> },
  { id: "tide", name: "潮汐", icon: <WindIcon size={16} className="rotate-90" /> },
  { id: "wind", name: "林风", icon: <WindIcon size={16} /> },
  { id: "fire", name: "篝火", icon: <FireIcon size={16} /> },
  { id: "brook", name: "山涧", icon: <BrookIcon size={16} /> },
  { id: "cricket", name: "虫夜", icon: <BugIcon size={16} /> },
];

const PRESETS: { name: string; levels: Partial<Record<NoiseLayerId, number>> }[] = [
  { name: "雨夜书房", levels: { rain: 62, fire: 20 } },
  { name: "海边黄昏", levels: { tide: 72, wind: 18 } },
  { name: "林间清晨", levels: { wind: 46, brook: 38, cricket: 14 } },
  { name: "篝火夜话", levels: { fire: 66, cricket: 34, wind: 12 } },
];

const SLEEP_OPTIONS = [0, 15, 30, 45, 60];

export default function NoiseBay() {
  const [levels, setLevels] = useState<Record<NoiseLayerId, number>>(() => ({
    rain: 0,
    tide: 0,
    wind: 0,
    fire: 0,
    brook: 0,
    cricket: 0,
  }));
  const [sleep, setSleep] = useState(sleepTimer.get());
  const levelsRef = useRef(levels);
  levelsRef.current = levels;

  /* 挂载时读回引擎状态（切页不丢混音） */
  useEffect(() => {
    const next = { ...levelsRef.current };
    (Object.keys(next) as NoiseLayerId[]).forEach((id) => {
      next[id] = Math.round(audio.getNoiseLevel(id) * 100);
    });
    setLevels(next);
  }, []);

  const setLayer = (id: NoiseLayerId, v: number) => {
    audio.unlock();
    setLevels((s) => ({ ...s, [id]: v }));
    audio.setNoise(id, v / 100);
    if (v > 0) buzz(4);
  };

  const applyPreset = (p: (typeof PRESETS)[number]) => {
    audio.unlock();
    const next = { rain: 0, tide: 0, wind: 0, fire: 0, brook: 0, cricket: 0 };
    (Object.keys(p.levels) as NoiseLayerId[]).forEach((id) => {
      next[id] = p.levels[id] ?? 0;
    });
    setLevels(next);
    (Object.keys(next) as NoiseLayerId[]).forEach((id) => audio.setNoise(id, next[id] / 100));
    audio.playChime(3);
    buzz(8);
  };

  const allOff = () => {
    setLevels({ rain: 0, tide: 0, wind: 0, fire: 0, brook: 0, cricket: 0 });
    audio.stopAllNoise(0.6);
  };

  const anyOn = Object.values(levels).some((v) => v > 0);

  /* 睡眠倒计时（模块级单例：切到别的岛区也照常走） */
  useEffect(
    () =>
      sleepTimer.subscribe((s) => {
        setSleep(s);
        setLevels((prev) => {
          const next = { ...prev };
          (Object.keys(next) as NoiseLayerId[]).forEach((id) => {
            next[id] = Math.round(audio.getNoiseLevel(id) * 100);
          });
          return next;
        });
      }),
    []
  );

  const chooseSleep = (m: number) => {
    if (m === 0) {
      sleepTimer.stop();
    } else {
      sleepTimer.start(m);
      audio.unlock();
      audio.pluck(523.25, 0.12);
      buzz(6);
    }
  };

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const selectedSleep = sleep.left !== null ? Math.round(sleep.total / 60) : 0;

  return (
    <div className="relative flex h-full flex-col gap-3 overflow-hidden px-5 pb-2 pt-2">
      {/* 夜色渐暗层 */}
      <div
        className="pointer-events-none absolute inset-0 z-20 bg-abyss transition-opacity duration-1000"
        style={{ opacity: sleep.dim }}
      />

      <div className="flex items-center justify-between">
        <p className="text-[11px] tracking-[0.3em] text-fog/55">声息 · 调一杯今夜的背景</p>
        <button
          onClick={allOff}
          disabled={!anyOn}
          className="h-9 rounded-full border border-paper/12 px-4 text-xs tracking-widest text-fog/70 transition-all active:scale-95 disabled:opacity-30"
        >
          全部熄灭
        </button>
      </div>

      {/* 预设夜色 */}
      <div className="flex shrink-0 gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {PRESETS.map((p) => (
          <button
            key={p.name}
            onClick={() => applyPreset(p)}
            className="h-10 shrink-0 rounded-full border border-apricot/25 bg-ink/40 px-4 text-xs tracking-[0.18em] text-apricot/85 transition-all hover:bg-ink/60 active:scale-95"
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* 六层声音 */}
      <div className="grid min-h-0 flex-1 grid-cols-2 content-start gap-x-4 gap-y-3 overflow-y-auto pt-1">
        {LAYERS.map((l) => (
          <div key={l.id} className="rounded-2xl border border-paper/8 bg-ink/40 px-4 py-3">
            <div className="flex items-center justify-between">
              <span
                className={`flex items-center gap-1.5 text-sm transition-colors duration-300 ${
                  levels[l.id] > 0 ? "text-paper" : "text-fog/60"
                }`}
              >
                <span className={levels[l.id] > 0 ? "text-apricot" : "text-fog/50"}>{l.icon}</span>
                {l.name}
              </span>
              <span className="text-[11px] tabular-nums text-apricot/80">{levels[l.id] > 0 ? levels[l.id] : "–"}</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={levels[l.id]}
              onChange={(e) => setLayer(l.id, Number(e.target.value))}
              className="slider mt-2.5"
              style={{ opacity: levels[l.id] > 0 ? 1 : 0.45 }}
              aria-label={`${l.name}音量`}
            />
          </div>
        ))}
      </div>

      {/* 伴你入眠 */}
      <div className="panel shrink-0 rounded-2xl px-5 py-3.5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm text-paper/85">
            <MoonIcon size={16} className="text-mist" />
            伴你入眠
          </span>
          {sleep.left !== null && (
            <span className="flex items-center gap-1.5 text-sm tabular-nums text-mist">
              <ClockIcon size={15} />
              {fmt(sleep.left)}
            </span>
          )}
        </div>
        <div className="mt-2.5 flex gap-2">
          {SLEEP_OPTIONS.map((m) => (
            <button
              key={m}
              onClick={() => chooseSleep(m)}
              className={`h-10 flex-1 rounded-full border text-xs tracking-widest transition-all active:scale-95 ${
                selectedSleep === m ? "border-mist/60 bg-mist/12 text-mist" : "border-paper/10 text-fog/60"
              }`}
            >
              {m === 0 ? "关闭" : `${m}分`}
            </button>
          ))}
        </div>
        <p className="mt-2 text-center text-[10px] tracking-[0.24em] text-fog/40">
          {sleep.left !== null ? "声音会像退潮一样，轻轻消失" : "定个时间，声音陪你到睡着"}
        </p>
      </div>
    </div>
  );
}
