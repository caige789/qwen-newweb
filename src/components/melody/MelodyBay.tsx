import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { audio, PENTATONIC } from "../../lib/audio";
import { buzz } from "../../lib/haptics";
import { MusicBoxIcon, PauseIcon, PlayIcon, SparkIcon, StopIcon, WindIcon } from "../shared/icons";

const KEYS = ["a", "s", "d", "f", "g", "h", "j", "k"];

function Switch({ on, onToggle, label, icon }: { on: boolean; onToggle: () => void; label: string; icon?: React.ReactNode }) {
  return (
    <button onClick={onToggle} className="flex h-11 items-center gap-3" role="switch" aria-checked={on} aria-label={label}>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors duration-300 ${
          on ? "border-apricot/60 bg-apricot/30" : "border-fog/25 bg-deep"
        }`}
      >
        <span
          className={`absolute top-0.5 h-[18px] w-[18px] rounded-full transition-all duration-300 ${
            on ? "left-[22px] bg-apricot shadow-[0_0_12px_rgba(244,196,143,0.7)]" : "left-0.5 bg-fog/50"
          }`}
        />
      </span>
      <span className={`flex items-center gap-1.5 text-sm transition-colors ${on ? "text-paper" : "text-fog/60"}`}>
        {icon}
        {label}
      </span>
    </button>
  );
}

interface Note {
  time: number;
  idx: number;
}

export default function MelodyBay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [musicOn, setMusicOn] = useState(audio.musicOn);
  const [windOn, setWindOn] = useState(audio.windOn);
  const [volume, setVolume] = useState(Math.round(audio.volume * 100));
  const [pulses, setPulses] = useState<{ id: number; key: number }[]>([]);
  const pulseId = useRef(0);

  const [notes, setNotes] = useState<Note[]>([]);
  const [recOn, setRecOn] = useState(false);
  const [playing, setPlaying] = useState(false);
  const recStart = useRef(0);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  /* ---------- 频谱画布 ---------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      w = r.width;
      h = r.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const freq = new Uint8Array(128);
    let raf = 0;
    const BARS = 42;

    const draw = (now: number) => {
      const t = now / 1000;
      ctx2d.clearRect(0, 0, w, h);
      const has = audio.hasContext && audio.getFrequencyData(freq);
      let energy = 0;

      for (let i = 0; i < BARS; i++) {
        const x = (w / (BARS + 1)) * (i + 1);
        let v: number;
        if (has) {
          const idx = Math.floor((i / BARS) * 60);
          v = freq[idx] / 255;
        } else {
          v = 0.12 + 0.1 * Math.sin(t * 1.3 + i * 0.45) + 0.05 * Math.sin(t * 0.6 + i * 0.2);
        }
        energy += v;
        const bh = Math.max(3, v * (h - 18));
        const hueT = i / BARS;
        const r = Math.round(244 - hueT * 15);
        const g = Math.round(196 - hueT * 33);
        const b = Math.round(143 + hueT * 29);
        const alpha = 0.28 + v * 0.6;
        ctx2d.fillStyle = `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
        const bw = 3.2;
        const y = h - 8 - bh;
        ctx2d.beginPath();
        ctx2d.roundRect(x - bw / 2, y, bw, bh, 2);
        ctx2d.fill();
        if (v > 0.32) {
          ctx2d.fillStyle = `rgba(255,233,196,${(v * 0.8).toFixed(3)})`;
          ctx2d.beginPath();
          ctx2d.arc(x, y - 3, 1.6, 0, Math.PI * 2);
          ctx2d.fill();
        }
      }

      const glow = ctx2d.createLinearGradient(0, h - 10, 0, h);
      glow.addColorStop(0, `rgba(244,196,143,${(0.05 + (energy / BARS) * 0.2).toFixed(3)})`);
      glow.addColorStop(1, "rgba(244,196,143,0)");
      ctx2d.fillStyle = glow;
      ctx2d.fillRect(0, h - 10, w, 10);

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  /* ---------- 点按发声 ---------- */
  const tap = (freq: number, idx: number) => {
    audio.pluck(freq);
    buzz(5);
    const id = ++pulseId.current;
    setPulses((p) => [...p.slice(-5), { id, key: idx }]);
    window.setTimeout(() => setPulses((p) => p.filter((x) => x.id !== id)), 750);
    if (recOn) {
      setNotes((n) => (n.length >= 32 ? n : [...n, { time: (performance.now() - recStart.current) / 1000, idx }]));
    }
  };

  /* ---------- 键盘弹奏 ---------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const el = e.target as HTMLElement | null;
      if (el && ["INPUT", "TEXTAREA"].includes(el.tagName)) return;
      const idx = KEYS.indexOf(e.key.toLowerCase());
      if (idx >= 0) tap(PENTATONIC[idx].freq, idx);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recOn]);

  /* ---------- 录制 / 回放 / 即兴 ---------- */
  const startRec = () => {
    setNotes([]);
    setRecOn(true);
    recStart.current = performance.now();
    audio.pluck(587.33, 0.12);
  };
  const stopRec = () => {
    setRecOn(false);
    audio.pluck(392, 0.12);
  };

  const play = () => {
    if (playing || notes.length === 0) return;
    audio.unlock();
    setPlaying(true);
    const t0 = audio.now + 0.12;
    notes.forEach((n) => audio.musicBox(PENTATONIC[n.idx].freq, t0 + n.time));
    const total = notes[notes.length - 1].time + 1.5;
    timers.current.push(window.setTimeout(() => setPlaying(false), total * 1000));
  };

  const improvise = () => {
    if (recOn || playing) return;
    audio.unlock();
    const seq: Note[] = [];
    let idx = Math.random() < 0.5 ? 0 : 5;
    let t = 0.25;
    const count = 12 + Math.floor(Math.random() * 5);
    for (let i = 0; i < count; i++) {
      const roll = Math.random();
      const step = roll < 0.5 ? (Math.random() < 0.5 ? -1 : 1) : roll < 0.75 ? (Math.random() < 0.5 ? -2 : 2) : 0;
      idx = Math.max(0, Math.min(7, idx + step));
      const dur = [0.3, 0.3, 0.3, 0.45, 0.6][Math.floor(Math.random() * 5)];
      seq.push({ time: t, idx });
      t += dur;
    }
    seq.push({ time: t, idx: 0 });
    setNotes(seq);
    setPlaying(true);
    const t0 = audio.now + 0.12;
    seq.forEach((n) => audio.musicBox(PENTATONIC[n.idx].freq, t0 + n.time, 0.9));
    const total = seq[seq.length - 1].time + 1.6;
    timers.current.push(window.setTimeout(() => setPlaying(false), total * 1000));
  };

  const total = notes.length ? notes[notes.length - 1].time : 0;

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden px-5 pb-2 pt-2">
      <canvas ref={canvasRef} className="h-20 w-full shrink-0 sm:h-24" aria-hidden />

      {/* 音符星空（钢琴卷帘） */}
      <div className="relative mx-auto h-16 w-full max-w-sm shrink-0 overflow-hidden rounded-2xl border border-paper/8 bg-abyss/50">
        {notes.map((n, i) => (
          <span
            key={`${n.time}-${i}`}
            className="absolute h-2 w-2 -translate-y-1/2 rounded-full"
            style={{
              left: `${8 + (n.time / Math.max(total, 1)) * 84}%`,
              top: `${88 - n.idx * 10.5}%`,
              background: PENTATONIC[n.idx].color,
              boxShadow: `0 0 8px ${PENTATONIC[n.idx].color}88`,
            }}
          />
        ))}
        {playing && total > 0 && (
          <span
            className="absolute top-1 bottom-1 w-px bg-apricot/80 shadow-[0_0_10px_rgba(244,196,143,0.8)]"
            style={{ animation: `sweep ${total + 0.3}s linear forwards` }}
          />
        )}
        {notes.length === 0 && (
          <p className="absolute inset-0 flex items-center justify-center text-[11px] tracking-[0.28em] text-fog/40">
            音符星空 · 录一段，或让它即兴
          </p>
        )}
      </div>
      <style>{`@keyframes sweep{from{left:6%}to{left:94%}}`}</style>

      {/* 音石 */}
      <div className="mx-auto grid w-full max-w-sm flex-1 grid-cols-4 content-center gap-x-3 gap-y-4">
        {PENTATONIC.map((n, i) => (
          <div key={n.name} className="relative flex flex-col items-center gap-1.5">
            <motion.button
              whileTap={{ scale: 0.86 }}
              onPointerDown={() => tap(n.freq, i)}
              className="relative flex h-14 w-14 items-center justify-center rounded-full transition-shadow duration-300 sm:h-16 sm:w-16"
              style={{
                background: `radial-gradient(circle at 34% 30%, ${n.color}55, ${n.color}22 60%, ${n.color}0d)`,
                border: `1px solid ${n.color}66`,
                boxShadow: `0 0 22px ${n.color}2e, inset 0 0 14px ${n.color}1f`,
              }}
              aria-label={`音石 ${n.name}`}
            >
              <span className="font-display text-base" style={{ color: n.color }}>
                {n.name}
              </span>
              {pulses.filter((p) => p.key === i).map((p) => (
                <span
                  key={p.id}
                  className="pad-pop pointer-events-none absolute inset-0 rounded-full"
                  style={{ border: `1.5px solid ${n.color}` }}
                />
              ))}
            </motion.button>
            <span className="hidden text-[10px] tracking-widest text-fog/35 sm:block">{KEYS[i].toUpperCase()}</span>
          </div>
        ))}
      </div>

      {/* 八音盒操作 */}
      <div className="mx-auto flex w-full max-w-sm shrink-0 items-center justify-center gap-2.5">
        <button
          onClick={recOn ? stopRec : startRec}
          disabled={playing}
          className={`flex h-11 items-center gap-1.5 rounded-full border px-4 text-xs tracking-widest transition-all active:scale-95 disabled:opacity-35 ${
            recOn
              ? "border-rose/60 bg-rose/12 text-rose shadow-[0_0_14px_rgba(229,163,172,0.25)]"
              : "border-paper/12 text-fog/75"
          }`}
        >
          {recOn ? <StopIcon size={14} /> : <MusicBoxIcon size={15} />}
          {recOn ? `录制中 · ${notes.length}` : "录一段"}
        </button>
        <button
          onClick={play}
          disabled={playing || recOn || notes.length === 0}
          className="flex h-11 items-center gap-1.5 rounded-full border border-apricot/45 bg-apricot/10 px-4 text-xs tracking-widest text-apricot transition-all active:scale-95 disabled:opacity-35"
        >
          {playing ? <PauseIcon size={14} /> : <PlayIcon size={14} />}
          播放
        </button>
        <button
          onClick={improvise}
          disabled={playing || recOn}
          className="flex h-11 items-center gap-1.5 rounded-full border border-mist/40 bg-mist/8 px-4 text-xs tracking-widest text-mist transition-all active:scale-95 disabled:opacity-35"
        >
          <SparkIcon size={14} />
          即兴一曲
        </button>
      </div>

      {/* 控制 */}
      <div className="panel shrink-0 rounded-2xl px-5 py-3.5">
        <div className="flex items-center justify-between gap-2">
          <Switch
            on={musicOn}
            label="和弦背景"
            onToggle={() => {
              if (musicOn) audio.stopMusic();
              else audio.startMusic();
              setMusicOn(!musicOn);
            }}
          />
          <Switch
            on={windOn}
            label="环境风声"
            icon={<WindIcon size={15} />}
            onToggle={() => {
              if (windOn) audio.stopWind();
              else audio.startWind();
              setWindOn(!windOn);
            }}
          />
        </div>
        <div className="mt-2.5 flex items-center gap-3">
          <span className="text-xs tracking-[0.2em] text-fog/60">音量</span>
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={(e) => {
              const v = Number(e.target.value);
              setVolume(v);
              audio.setVolume(v / 100);
            }}
            className="slider"
            aria-label="音量"
          />
          <span className="w-9 text-right text-xs text-apricot/85">{volume}</span>
        </div>
        <p className="mt-2 text-center text-[11px] tracking-[0.18em] text-fog/45">
          宫 · 商 · 角 · 徵 · 羽 —— 点一点，听石头唱歌{notes.length > 0 ? ` · 已存 ${notes.length} 颗音符` : ""}
        </p>
      </div>
    </div>
  );
}
