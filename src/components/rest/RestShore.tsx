import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { audio } from "../../lib/audio";
import { buzz } from "../../lib/haptics";
import { HandShakeIcon, MoonIcon, PauseIcon, PlayIcon, ResetIcon, SheepIcon, WaveIcon } from "../shared/icons";

interface PhaseDef {
  label: string;
  tip: string;
  dur: number;
  scale: number;
  color: string;
}

interface PatternDef {
  id: string;
  name: string;
  note: string;
  phases: PhaseDef[];
}

const PATTERNS: PatternDef[] = [
  {
    id: "p478",
    name: "4-7-8",
    note: "助眠经典",
    phases: [
      { label: "吸气", tip: "用鼻子轻轻吸气", dur: 4, scale: 1.34, color: "#f4c48f" },
      { label: "屏息", tip: "温柔地停一停", dur: 7, scale: 1.34, color: "#a3c1d6" },
      { label: "呼气", tip: "慢慢地，全部呼出", dur: 8, scale: 1, color: "#aecaa4" },
    ],
  },
  {
    id: "box",
    name: "方块",
    note: "找回稳定",
    phases: [
      { label: "吸气", tip: "平稳地吸满", dur: 4, scale: 1.34, color: "#f4c48f" },
      { label: "屏息", tip: "稳稳地停住", dur: 4, scale: 1.34, color: "#a3c1d6" },
      { label: "呼气", tip: "均匀地呼出", dur: 4, scale: 1, color: "#aecaa4" },
      { label: "屏息", tip: "安静地等待", dur: 4, scale: 1, color: "#c9b8d9" },
    ],
  },
  {
    id: "c55",
    name: "同频",
    note: "5-5 共振",
    phases: [
      { label: "吸气", tip: "深深地吸", dur: 5, scale: 1.34, color: "#f4c48f" },
      { label: "呼气", tip: "缓缓地放", dur: 5, scale: 1, color: "#aecaa4" },
    ],
  },
];

const SHEEP_LINES: [number, string][] = [
  [1, "第一只羊，轻轻跳过去了"],
  [5, "羊群排着队，一只接一只"],
  [10, "金色的那只也跳过去了，好兆头"],
  [20, "眼皮有点沉了吧，没关系"],
  [30, "你可能已经睡着了……我帮你接着数"],
];

function SheepSprite({ gold }: { gold: boolean }) {
  const body = gold ? "#f2d8a4" : "#e9e5da";
  return (
    <svg viewBox="0 0 90 60" className="h-14 w-20">
      {gold && <ellipse cx="45" cy="50" rx="26" ry="8" fill="rgba(242,216,164,0.25)" />}
      <path d="M28 40v10M56 40v10" stroke="#8a7a6a" strokeWidth="3.5" strokeLinecap="round" />
      <ellipse cx="42" cy="30" rx="24" ry="16" fill={body} />
      <circle cx="30" cy="22" r="8" fill={body} />
      <circle cx="42" cy="17" r="9" fill={body} />
      <circle cx="54" cy="22" r="8" fill={body} />
      <circle cx="66" cy="28" r="9" fill="#5c5048" />
      <circle cx="69" cy="26" r="1.6" fill="#1c1610" />
      <path d="M70 32q2 1.6 4 0.6" stroke="#1c1610" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <ellipse cx="60" cy="20" rx="4" ry="6" fill="#4a4038" transform="rotate(24 60 20)" />
    </svg>
  );
}

const R = 108;
const C = 2 * Math.PI * R;

function PhaseRing({ dur, color, runKey }: { dur: number; color: string; runKey: string }) {
  const [offset, setOffset] = useState(C);
  useLayoutEffect(() => {
    setOffset(C);
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setOffset(0)));
    return () => cancelAnimationFrame(id);
  }, [runKey]);
  return (
    <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 240 240">
      <circle cx="120" cy="120" r={R} fill="none" stroke="rgba(244,236,221,0.08)" strokeWidth="2" />
      <circle
        cx="120"
        cy="120"
        r={R}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={C}
        strokeDashoffset={offset}
        style={{ transition: `stroke-dashoffset ${dur}s linear`, filter: `drop-shadow(0 0 6px ${color}88)` }}
      />
    </svg>
  );
}

interface BreathState {
  running: boolean;
  phaseIdx: number;
  phaseLeft: number;
  totalLeft: number;
  cycles: number;
}

const init = (mins: number): BreathState => ({
  running: false,
  phaseIdx: 0,
  phaseLeft: 0,
  totalLeft: mins * 60,
  cycles: 0,
});

export default function RestShore() {
  const [mode, setMode] = useState<"breath" | "sheep">("breath");

  /* ---------- 呼吸 ---------- */
  const [patId, setPatId] = useState("p478");
  const pattern = PATTERNS.find((p) => p.id === patId) ?? PATTERNS[0];
  const phases = pattern.phases;

  const [mins, setMins] = useState(3);
  const [st, setSt] = useState<BreathState>(init(3));
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [runKey, setRunKey] = useState(0);
  const [tideOn, setTideOn] = useState(false);
  const [hapticOn, setHapticOn] = useState(true);
  const hapticRef = useRef(hapticOn);
  hapticRef.current = hapticOn;

  /* ---------- 数羊 ---------- */
  const [sheepCount, setSheepCount] = useState(0);
  const [sheepRunning, setSheepRunning] = useState(false);
  const [sheep, setSheep] = useState<{ id: number; gold: boolean; w: number }[]>([]);
  const sheepIdRef = useRef(0);
  const sheepAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mode !== "sheep" || !sheepRunning) return;
    const id = window.setTimeout(
      () => {
        const w = sheepAreaRef.current?.offsetWidth ?? 340;
        const n = sheepCount + 1;
        setSheep((s) => [...s.slice(-3), { id: ++sheepIdRef.current, gold: n % 10 === 0, w }]);
        setSheepCount(n);
        window.setTimeout(() => audio.sheepBoing(0.85 + Math.random() * 0.35), 980);
        if (n % 10 === 0) window.setTimeout(() => audio.playChime(3), 1250);
        if (hapticRef.current) buzz(n % 10 === 0 ? 18 : 8);
      },
      sheepCount >= 30 ? 2600 : 1500
    );
    return () => window.clearTimeout(id);
  }, [mode, sheepRunning, sheepCount]);

  const sheepLine = SHEEP_LINES.find(([n]) => sheepCount >= n)?.[1] ?? "";

  /* 潮汐伴息 */
  useEffect(() => {
    if (tideOn && st.running && !finished) audio.setNoise("tide", 0.5);
    else audio.setNoise("tide", 0);
  }, [tideOn, st.running, finished]);

  /* 计时 */
  useEffect(() => {
    if (!st.running) return;
    const id = window.setInterval(() => {
      setSt((s) => {
        if (!s.running) return s;
        let { phaseIdx, phaseLeft, totalLeft, cycles } = s;
        totalLeft -= 1;
        phaseLeft -= 1;
        if (phaseLeft <= 0) {
          phaseIdx = (phaseIdx + 1) % phases.length;
          if (phaseIdx === 0) cycles += 1;
          phaseLeft = phases[phaseIdx].dur;
          audio.pluck(phaseIdx === 0 ? 659.25 : 440, 0.1);
          if (hapticRef.current) buzz(phases[phaseIdx].label === "吸气" ? 60 : 16);
          setRunKey((k) => k + 1);
        }
        return { ...s, phaseIdx, phaseLeft, totalLeft, cycles, running: totalLeft > 0 };
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [st.running, phases]);

  /* 结束 */
  useEffect(() => {
    if (started && !finished && st.totalLeft === 0) {
      setFinished(true);
      audio.playChime(5);
      audio.playWindBurst(2.6);
    }
  }, [st.totalLeft, started, finished]);

  const phase = phases[Math.min(st.phaseIdx, phases.length - 1)];
  const scale = !started || finished ? 1 : phase.scale;

  const start = () => {
    if (finished) return;
    if (!started) {
      setStarted(true);
      setSt((s) => ({ ...s, phaseLeft: phases[0].dur, phaseIdx: 0 }));
      setRunKey((k) => k + 1);
    }
    setSt((s) => ({ ...s, running: true }));
    audio.unlock();
    audio.pluck(523.25, 0.14);
    buzz(10);
  };
  const pause = () => setSt((s) => ({ ...s, running: false }));
  const reset = () => {
    setSt(init(mins));
    setStarted(false);
    setFinished(false);
  };
  const choose = (m: number) => {
    setMins(m);
    setSt(init(m));
    setStarted(false);
    setFinished(false);
  };
  const choosePattern = (id: string) => {
    if (started && !finished) return;
    setPatId(id);
    setSt(init(mins));
    setStarted(false);
    setFinished(false);
    audio.pluck(587.33, 0.1);
  };

  const mm = String(Math.floor(st.totalLeft / 60)).padStart(2, "0");
  const ss = String(st.totalLeft % 60).padStart(2, "0");

  return (
    <div className="relative flex h-full flex-col items-center overflow-hidden px-6 pb-2 pt-1">
      {/* 模式切换 */}
      <div className="flex shrink-0 gap-1 rounded-full border border-paper/10 bg-ink/50 p-1">
        <button
          onClick={() => setMode("breath")}
          className={`flex h-9 items-center gap-1.5 rounded-full px-4 text-xs tracking-[0.2em] transition-all duration-300 ${
            mode === "breath" ? "bg-apricot/15 text-apricot" : "text-fog/60"
          }`}
        >
          <MoonIcon size={13} />
          呼吸
        </button>
        <button
          onClick={() => setMode("sheep")}
          className={`flex h-9 items-center gap-1.5 rounded-full px-4 text-xs tracking-[0.2em] transition-all duration-300 ${
            mode === "sheep" ? "bg-apricot/15 text-apricot" : "text-fog/60"
          }`}
        >
          <SheepIcon size={14} />
          数羊
        </button>
      </div>

      {mode === "breath" && (
        <>
          <p className="mt-2 text-[11px] tracking-[0.3em] text-fog/55">
            小憩 · {pattern.name}呼吸 <span className="text-fog/35">（{pattern.note}）</span>
          </p>

          <div className="mt-2.5 flex shrink-0 gap-2">
            {PATTERNS.map((p) => (
              <button
                key={p.id}
                onClick={() => choosePattern(p.id)}
                disabled={started && !finished}
                className={`h-10 rounded-full border px-4 text-xs tracking-[0.18em] transition-all duration-300 disabled:opacity-35 ${
                  patId === p.id ? "border-mist/60 bg-mist/12 text-mist" : "border-paper/12 text-fog/70 active:scale-95"
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>

          {/* 呼吸圆 */}
          <div className="relative flex min-h-0 flex-1 items-center justify-center">
            <div className="relative h-[224px] w-[224px] sm:h-[264px] sm:w-[264px]">
              {started && !finished && st.running && (
                <PhaseRing key={`${runKey}`} dur={phase.dur} color={phase.color} runKey={String(runKey)} />
              )}
              <div
                className="absolute inset-[18px] rounded-full"
                style={{
                  transform: `scale(${scale})`,
                  transition: `transform ${started && !finished ? phase.dur : 1}s cubic-bezier(0.45, 0.05, 0.35, 1)`,
                }}
              >
                <div
                  className="flex h-full w-full items-center justify-center rounded-full"
                  style={{
                    background:
                      "radial-gradient(circle at 38% 32%, rgba(255,236,205,0.16), rgba(244,196,143,0.07) 55%, rgba(11,26,34,0.5))",
                    border: `1px solid ${phase.color}55`,
                    boxShadow: `0 0 60px ${phase.color}22, inset 0 0 50px rgba(244,196,143,0.06)`,
                  }}
                >
                  <div className="text-center">
                    <p className="font-display text-3xl tracking-[0.3em] pl-[0.3em]" style={{ color: phase.color }}>
                      {finished ? "好了" : !started ? "预备" : phase.label}
                    </p>
                    <p className="mt-1.5 text-[13px] tracking-wider text-paper/65">
                      {finished ? "" : !started ? `${mins} 分钟 · ${pattern.note}` : st.running ? phase.tip : "暂停一下"}
                    </p>
                    {started && !finished && <p className="mt-0.5 text-sm text-paper/75">{st.phaseLeft}</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-4 text-xs tracking-[0.2em] text-fog/65">
            <span>
              剩余 <span className="font-display text-base text-paper/90">{mm}:{ss}</span>
            </span>
            <span className="h-3 w-px bg-paper/15" />
            <span>
              第{" "}
              <span className="font-display text-base text-apricot">
                {st.cycles + (started && !finished && st.phaseIdx > 0 ? 1 : 0)}
              </span>{" "}
              次呼吸
            </span>
          </div>

          <div className="mt-3 flex shrink-0 gap-2">
            {[3, 5, 10].map((m) => (
              <button
                key={m}
                onClick={() => choose(m)}
                disabled={started && !finished}
                className={`h-11 rounded-full border px-5 text-sm tracking-widest transition-all duration-300 disabled:opacity-35 ${
                  mins === m ? "border-apricot/60 bg-apricot/15 text-apricot" : "border-paper/12 text-fog/70 active:scale-95"
                }`}
              >
                {m} 分钟
              </button>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-5 py-3.5">
            <button
              onClick={reset}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-paper/15 text-fog/70 transition-all active:scale-90"
              aria-label="重置"
            >
              <ResetIcon size={17} />
            </button>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={st.running ? pause : start}
              disabled={finished}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-apricot text-abyss shadow-[0_0_30px_rgba(244,196,143,0.45)] transition-colors disabled:opacity-40"
              aria-label={st.running ? "暂停" : "开始"}
            >
              {st.running ? <PauseIcon size={22} /> : <PlayIcon size={22} />}
            </motion.button>
            <button
              onClick={() => {
                setTideOn((t) => !t);
                buzz(6);
              }}
              className={`flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-300 active:scale-90 ${
                tideOn
                  ? "border-mist/60 bg-mist/12 text-mist shadow-[0_0_16px_rgba(163,193,214,0.25)]"
                  : "border-paper/15 text-fog/60"
              }`}
              aria-label="潮汐伴息"
            >
              <WaveIcon size={17} />
            </button>
            <button
              onClick={() => {
                setHapticOn((h) => !h);
                if (!hapticOn) buzz(20);
              }}
              className={`flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-300 active:scale-90 ${
                hapticOn
                  ? "border-rose/60 bg-rose/12 text-rose shadow-[0_0_16px_rgba(229,163,172,0.25)]"
                  : "border-paper/15 text-fog/60"
              }`}
              aria-label="呼吸触觉"
            >
              <HandShakeIcon size={17} />
            </button>
          </div>
          <p className="pb-1 text-[10px] tracking-[0.24em] text-fog/40">
            {tideOn ? "潮汐正陪着你呼吸" : hapticOn ? "吸气时，手心会轻轻震动" : "点小浪或手心，让身体陪你呼吸"}
          </p>
        </>
      )}

      {/* 数羊 */}
      {mode === "sheep" && (
        <div className="flex min-h-0 w-full flex-1 flex-col items-center pt-2">
          <div
            ref={sheepAreaRef}
            className="relative w-full flex-1 overflow-hidden rounded-3xl border border-paper/8 bg-abyss/25"
          >
            {/* 栅栏 */}
            <svg className="absolute bottom-[16%] left-1/2 h-24 w-28 -translate-x-1/2" viewBox="0 0 112 96" fill="none">
              <rect x="8" y="18" width="7" height="74" rx="3" fill="#2e2418" />
              <rect x="97" y="18" width="7" height="74" rx="3" fill="#2e2418" />
              <rect x="2" y="34" width="108" height="7" rx="3.5" fill="#3c2f20" />
              <rect x="2" y="62" width="108" height="7" rx="3.5" fill="#3c2f20" />
              <circle cx="56" cy="10" r="9" fill="#f4c48f" opacity="0.9" />
              <circle cx="56" cy="10" r="16" fill="rgba(244,196,143,0.15)" className="lantern" />
            </svg>
            {/* 草地 */}
            <div className="absolute inset-x-0 bottom-0 h-[14%] bg-gradient-to-t from-[#16241c] to-transparent" />

            <AnimatePresence>
              {sheep.map((s) => (
                <motion.div
                  key={s.id}
                  className="absolute bottom-[12%]"
                  initial={{ x: -90, y: 0, rotate: 0 }}
                  animate={{ x: s.w + 20, y: [0, -14, -70, -70, -14, 0], rotate: [0, -6, 0, 0, 6, 0] }}
                  transition={{ duration: 2.6, times: [0, 0.3, 0.43, 0.57, 0.72, 1], ease: "easeInOut" }}
                  onAnimationComplete={() => setSheep((l) => l.filter((x) => x.id !== s.id))}
                >
                  <SheepSprite gold={s.gold} />
                </motion.div>
              ))}
            </AnimatePresence>

            <div className="pointer-events-none absolute inset-x-0 top-6 text-center">
              <p className="font-display text-5xl text-paper/90 text-glow">{sheepCount}</p>
              <p className="mt-1 text-xs tracking-[0.3em] text-fog/60">
                {sheepCount ? `数到了第 ${sheepCount} 只羊` : "还没有羊跳过"}
              </p>
              <p className="mt-3 text-[11px] tracking-[0.2em] text-mist/75">{sheepLine}</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-5 py-3.5">
            <button
              onClick={() => {
                setSheepCount(0);
                setSheep([]);
                setSheepRunning(false);
              }}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-paper/15 text-fog/70 transition-all active:scale-90"
              aria-label="重置"
            >
              <ResetIcon size={17} />
            </button>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => {
                audio.unlock();
                if (sheepRunning) {
                  setSheepRunning(false);
                } else {
                  setSheepRunning(true);
                  audio.pluck(523.25, 0.12);
                }
              }}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-apricot text-abyss shadow-[0_0_30px_rgba(244,196,143,0.45)]"
              aria-label={sheepRunning ? "羊停一停" : "羊开始跳"}
            >
              {sheepRunning ? <PauseIcon size={22} /> : <PlayIcon size={22} />}
            </motion.button>
            <span className="w-11" />
          </div>
          <p className="pb-1 text-[10px] tracking-[0.24em] text-fog/40">不用数清楚，数着数着就好</p>
        </div>
      )}

      {/* 完成 */}
      <AnimatePresence>
        {finished && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-abyss/72 px-8 backdrop-blur-[2px]"
          >
            <motion.div
              initial={{ scale: 0.9, y: 16, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="panel w-full max-w-xs rounded-3xl px-7 py-8 text-center"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-apricot/15 text-apricot">
                <MoonIcon size={24} />
              </div>
              <p className="font-display text-2xl tracking-[0.2em] text-paper text-glow">你做得很好</p>
              <p className="mt-3 text-sm leading-6 text-fog/75">
                {st.cycles} 次呼吸，{mins} 分钟的平静，
                <br />
                岛上的风替你都记住了。
              </p>
              <button
                onClick={reset}
                className="mt-6 h-11 w-full rounded-full border border-apricot/50 text-sm tracking-[0.3em] text-apricot transition-all active:scale-95"
              >
                回到岛上
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
