import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { audio } from "../../lib/audio";
import { buzz } from "../../lib/haptics";
import { detectMood, replyTo } from "../../lib/poems";
import {
  DELAYS,
  formatLeft,
  openAtFor,
  timeAgo,
  type DelayKind,
  type SealedLetter,
} from "../../lib/letters";
import { api } from "../../lib/api";
import { pickBottleNote } from "../../lib/bottles";
import { BottleIcon, EnvelopeIconLike, SendIcon } from "./treehole-icons";
import FireflyWall from "./FireflyWall";

type Phase = "idle" | "absorb" | "reply" | "dissolve";
type Mode = "heart" | "letter" | "bottle" | "wall";

interface Firefly {
  id: number;
  x: number;
  y: number;
  delay: number;
}

interface ExitVec {
  tx: number;
  ty: number;
  rot: number;
  d: number;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

const QUICK_MOODS = ["有点累", "睡不着", "想一个人", "有点烦", "还好，随便聊聊"];

const SPOTS: [number, number][] = [
  [24, 34], [42, 20], [60, 28], [32, 50], [54, 46], [72, 42],
];

export default function Treehole() {
  const [mode, setMode] = useState<Mode>("heart");

  /* ---------- 心里话 ---------- */
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [whisper, setWhisper] = useState("");
  const [reply, setReply] = useState("");
  const [revealed, setRevealed] = useState(0);
  const [exits, setExits] = useState<ExitVec[]>([]);
  const [fireflies, setFireflies] = useState<Firefly[]>([]);
  const [lanterns, setLanterns] = useState<{ id: number; word: string; dx: number }[]>([]);
  const flyId = useRef(0);
  const timers = useRef<number[]>([]);
  const tokenRef = useRef(0);

  /* ---------- 回声信 ---------- */
  const [letters, setLetters] = useState<SealedLetter[]>([]);
  const [draft, setDraft] = useState("");
  const [delayKind, setDelayKind] = useState<DelayKind>("5m");
  const [sealing, setSealing] = useState(false);
  const [openLetter, setOpenLetter] = useState<SealedLetter | null>(null);
  const [openReveal, setOpenReveal] = useState(0);
  const [dissolving, setDissolving] = useState(false);
  const [openExits, setOpenExits] = useState<ExitVec[]>([]);
  const [now, setNow] = useState(Date.now());

  /* ---------- 漂流瓶 ---------- */
  const [bottleText, setBottleText] = useState("");
  const [throwing, setThrowing] = useState(0);
  const [thrownCount, setThrownCount] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const lastNote = useRef<string | undefined>(undefined);

  const [toast, setToast] = useState<{ msg: string; key: number } | null>(null);
  const dueCount = useRef(0);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  /* 挂载时从本机存档读回信封 */
  useEffect(() => {
    let alive = true;
    api.letter.list().then((ls) => {
      if (alive && ls.length) setLetters(ls);
    });
    return () => {
      alive = false;
    };
  }, []);

  /* 信的倒计时 */
  useEffect(() => {
    dueCount.current = letters.filter((l) => l.openAt <= Date.now()).length;
    if (!letters.length) return;
    const id = window.setInterval(() => {
      const n = Date.now();
      setNow(n);
      const due = letters.filter((l) => l.openAt <= n).length;
      if (due > dueCount.current && audio.hasContext) {
        audio.playChime(3);
        buzz(10);
      }
      dueCount.current = due;
    }, 1000);
    return () => window.clearInterval(id);
  }, [letters]);

  /* 拆信后逐字浮现 */
  useEffect(() => {
    if (!openLetter) return;
    setOpenReveal(0);
    setDissolving(false);
    setOpenExits([]);
    const total = openLetter.text.length;
    const id = window.setInterval(() => {
      setOpenReveal((n) => {
        if (n >= total) {
          window.clearInterval(id);
          return n;
        }
        return n + 1;
      });
    }, 85);
    return () => window.clearInterval(id);
  }, [openLetter]);

  const showToast = (msg: string) => {
    const key = Date.now();
    setToast({ msg, key });
    window.setTimeout(() => setToast((t) => (t && t.key === key ? null : t)), 2100);
  };

  /* ---------- 心里话：提交 ---------- */
  const submit = (e?: React.FormEvent, preset?: string) => {
    e?.preventDefault();
    const value = (preset ?? text).trim();
    if (!value) return;
    const token = ++tokenRef.current;
    clearTimers();

    setWhisper(value);
    setText("");
    setPhase("absorb");
    setReply("");
    setRevealed(0);
    audio.unlock();
    audio.pluck(392, 0.28);

    later(() => {
      if (token !== tokenRef.current) return;
      const r = replyTo(value);
      setReply(r);
      setPhase("reply");
      audio.playChime(4);

      const interval = window.setInterval(() => {
        setRevealed((n) => {
          if (n >= r.length) {
            window.clearInterval(interval);
            return n;
          }
          return n + 1;
        });
      }, 95);
      timers.current.push(interval as unknown as number);

      later(() => {
        if (token !== tokenRef.current) return;
        setExits(
          Array.from({ length: r.length }, () => ({
            tx: rand(-90, 90),
            ty: rand(-150, -40),
            rot: rand(-100, 100),
            d: rand(0, 0.4),
          }))
        );
        setPhase("dissolve");
        audio.playWindBurst(1.9);

        later(() => {
          if (token !== tokenRef.current) return;
          const mood = detectMood(value);
          setPhase("idle");
          setWhisper("");
          setReply("");
          setFireflies((f) => [
            ...f.slice(-11),
            { id: ++flyId.current, x: rand(8, 92), y: rand(4, 58), delay: rand(0, 3) },
          ]);
          later(() => setFireflies((f) => f.slice(1)), 6800);
          setLanterns((ls) => [...ls.slice(-3), { id: ++flyId.current, word: mood, dx: rand(-10, 10) }]);
        }, 2000);
      }, r.length * 95 + 3400);
    }, 1180);
  };

  /* ---------- 回声信 ---------- */
  const seal = () => {
    const value = draft.trim();
    if (!value || sealing) return;
    audio.unlock();
    setSealing(true);
    audio.woodKnock();
    buzz(16);
    window.setTimeout(() => audio.woodKnock(), 260);
    window.setTimeout(() => audio.woodKnock(), 520);
    const letter: SealedLetter = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      text: value,
      createdAt: Date.now(),
      openAt: openAtFor(delayKind),
    };
    window.setTimeout(() => {
      api.letter.save(letter);
      setLetters((ls) => [...ls, letter]);
      setSealing(false);
      setDraft("");
      audio.playChime(3);
      const label = DELAYS.find((d) => d.id === delayKind)?.label ?? "";
      showToast(`${label}，树上的信封会亮起`);
    }, 900);
  };

  const tapEnvelope = (l: SealedLetter) => {
    buzz(6);
    if (Date.now() < l.openAt) {
      showToast("还没到时间，再等等它");
      audio.pluck(329.63, 0.12);
      return;
    }
    audio.unlock();
    audio.playWindBurst(0.6, 0.1);
    audio.playChime(2);
    setOpenLetter(l);
  };

  const dissolveOpen = () => {
    if (!openLetter || dissolving) return;
    setOpenExits(
      Array.from({ length: openLetter.text.length }, () => ({
        tx: rand(-80, 80),
        ty: rand(-150, -40),
        rot: rand(-100, 100),
        d: rand(0, 0.4),
      }))
    );
    setDissolving(true);
    audio.playWindBurst(1.9);
    const id = openLetter.id;
    window.setTimeout(() => {
      api.letter.remove(id);
      setLetters((ls) => ls.filter((x) => x.id !== id));
      setOpenLetter(null);
      setFireflies((f) => [
        ...f.slice(-11),
        { id: ++flyId.current, x: rand(8, 92), y: rand(4, 58), delay: rand(0, 3) },
      ]);
      audio.playChime(3);
    }, 2000);
  };

  const destroyLetter = (id: string) => {
    api.letter.remove(id);
    setLetters((ls) => ls.filter((x) => x.id !== id));
    setOpenLetter(null);
    showToast("信已化作海风，不留痕迹");
    audio.playWindBurst(0.9, 0.12);
  };

  /* ---------- 漂流瓶 ---------- */
  const throwBottle = () => {
    const v = bottleText.trim();
    if (!v || throwing) return;
    audio.unlock();
    audio.corkPop();
    buzz(10);
    setBottleText("");
    setThrowing(Date.now());
    setThrownCount((c) => c + 1);
  };
  const pickBottle = () => {
    audio.unlock();
    audio.corkPop();
    buzz(6);
    const n = pickBottleNote(lastNote.current);
    lastNote.current = n;
    setPicked(n);
  };
  const returnBottle = () => {
    setPicked(null);
    audio.splash();
    buzz(5);
  };

  const switchMode = (m: Mode) => {
    if (m === mode) return;
    setMode(m);
    audio.pluck(m === "heart" ? 523.25 : m === "letter" ? 440 : 392, 0.1);
  };

  return (
    <div className="relative flex h-full flex-col overflow-hidden px-5 pb-3 pt-2">
      {/* 树与树洞 */}
      <div className="relative mx-auto h-[30%] min-h-[140px] w-full max-w-sm shrink-0">
        <svg viewBox="0 0 320 200" className="h-full w-full" fill="none">
          <ellipse cx="160" cy="74" rx="118" ry="62" fill="#12262f" />
          <ellipse cx="104" cy="92" rx="66" ry="44" fill="#16303a" />
          <ellipse cx="216" cy="90" rx="70" ry="46" fill="#16303a" />
          <ellipse cx="160" cy="52" rx="70" ry="36" fill="#1b3a45" />
          <circle cx="120" cy="58" r="4" fill="#aecaa4" opacity="0.5" />
          <circle cx="196" cy="44" r="3" fill="#f4c48f" opacity="0.5" />
          <circle cx="226" cy="76" r="3.4" fill="#e5a3ac" opacity="0.45" />
          <circle cx="88" cy="86" r="2.6" fill="#f4c48f" opacity="0.4" />
          <path d="M146 118 C143 146 138 168 128 192 L192 192 C182 168 177 146 174 118 Z" fill="#0e2029" />
          <ellipse cx="160" cy="146" rx="17" ry="22" fill="#060d12" />
          <ellipse cx="160" cy="146" rx="17" ry="22" stroke="rgba(244,196,143,0.4)" strokeWidth="1.4" />
          <ellipse cx="160" cy="146" rx="26" ry="32" fill="url(#hollowGlow)" className="lantern" />
          <defs>
            <radialGradient id="hollowGlow">
              <stop offset="0%" stopColor="rgba(255,222,164,0.4)" />
              <stop offset="60%" stopColor="rgba(255,222,164,0.12)" />
              <stop offset="100%" stopColor="rgba(255,222,164,0)" />
            </radialGradient>
          </defs>
          <ellipse cx="160" cy="193" rx="120" ry="7" fill="#0a171e" />
        </svg>

        {fireflies.map((f) => (
          <span
            key={f.id}
            className="firefly"
            style={{ left: `${f.x}%`, top: `${f.y}%`, animationDelay: `${f.delay}s, ${f.delay + 0.4}s` }}
          />
        ))}

        {/* 回声信：挂在树梢的信封 */}
        {mode === "letter" &&
          letters.map((l, i) => {
            const spot = SPOTS[i % SPOTS.length];
            const due = now >= l.openAt;
            return (
              <button
                key={l.id}
                onClick={() => tapEnvelope(l)}
                className="absolute z-10 -m-2 flex flex-col items-center p-2"
                style={{ left: `${spot[0]}%`, top: `${spot[1]}%` }}
                aria-label={due ? "信封亮了，点开看看" : "还没到时间的信封"}
              >
                <span className="block h-2 w-px bg-paper/25" />
                <span className={`env-sway block ${due ? "due-glow" : ""}`} style={{ animationDelay: `${(i % 5) * 0.7}s` }}>
                  <svg width="26" height="20" viewBox="0 0 26 20" fill="none">
                    <rect x="1" y="1" width="24" height="18" rx="3" fill={due ? "#f7ead0" : "#e6dac0"} stroke={due ? "#e8996a" : "#a8977a"} strokeWidth="1" />
                    <path d="m2.5 3.5 10.5 7.5 10.5-7.5" stroke={due ? "#e8996a" : "#a8977a"} strokeWidth="1" />
                    <circle cx="13" cy="13.5" r="3.2" fill="#c05a45" opacity="0.92" />
                  </svg>
                </span>
                <span className={`mt-0.5 whitespace-nowrap text-[9px] tracking-wider ${due ? "text-apricot" : "text-fog/55"}`}>
                  {formatLeft(l.openAt, now)}
                </span>
              </button>
            );
          })}
      </div>

      {/* 舞台 */}
      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center px-2 text-center">
        {/* 天灯 */}
        <AnimatePresence>
          {lanterns.map((l) => (
            <motion.div
              key={l.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onAnimationComplete={() => setLanterns((ls) => ls.filter((x) => x.id !== l.id))}
              className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2"
            >
              <div
                className="sky-lantern relative flex h-16 w-12 items-center justify-center"
                style={{ "--dx": `${l.dx}vw` } as React.CSSProperties}
              >
                <svg viewBox="0 0 48 64" className="absolute inset-0 h-full w-full">
                  <defs>
                    <radialGradient id={`lg-${l.id}`} cx="50%" cy="58%" r="62%">
                      <stop offset="0%" stopColor="#ffe9c0" />
                      <stop offset="55%" stopColor="#f4bd82" />
                      <stop offset="100%" stopColor="#cf8a58" />
                    </radialGradient>
                  </defs>
                  <path
                    d="M24 4 C34 4 41 14 41 30 C41 46 33 58 24 58 C15 58 7 46 7 30 C7 14 14 4 24 4 Z"
                    fill={`url(#lg-${l.id})`}
                    opacity="0.94"
                  />
                  <ellipse cx="24" cy="34" rx="13" ry="17" fill="rgba(255,240,205,0.5)" />
                  <rect x="19" y="56" width="10" height="4" rx="2" fill="#8a5a3c" />
                </svg>
                <span className="relative font-display text-lg text-[#7a4a2c]">{l.word}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* 心里话 */}
        {mode === "heart" && (
          <>
            {phase === "absorb" && whisper && (
              <p className="whisper-absorb max-w-[86%] text-lg leading-relaxed text-paper/90">「{whisper}」</p>
            )}

            {(phase === "reply" || phase === "dissolve") && (
              <p className="max-w-[88%] font-display text-[21px] leading-[2] tracking-wide text-apricot text-glow sm:text-2xl">
                {reply.split("").map((ch, i) => (
                  <span
                    key={i}
                    className={`char-float ${i < revealed ? "on" : ""} ${phase === "dissolve" ? "bye" : ""}`}
                    style={
                      phase === "dissolve" && exits[i]
                        ? ({
                            "--tx": `${exits[i].tx}px`,
                            "--ty": `${exits[i].ty}px`,
                            "--rot": `${exits[i].rot}deg`,
                            "--d": `${exits[i].d}s`,
                          } as React.CSSProperties)
                        : undefined
                    }
                  >
                    {ch}
                  </span>
                ))}
              </p>
            )}

            {phase === "idle" && !whisper && (
              <div className="space-y-3">
                <p className="font-display text-xl text-paper/85">把一句心里话，说给树洞听</p>
                <p className="text-xs tracking-[0.24em] text-fog/60">
                  {fireflies.length > 0
                    ? `已有 ${fireflies.length} 只萤火虫替你守着秘密`
                    : "说完就忘 · 岛上不留一句话"}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  {QUICK_MOODS.map((q) => (
                    <button
                      key={q}
                      onClick={() => submit(undefined, q)}
                      className="h-10 rounded-full border border-paper/12 bg-ink/40 px-4 text-xs tracking-widest text-fog/80 transition-all duration-300 hover:border-apricot/35 hover:text-apricot active:scale-95"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* 回声信 */}
        {mode === "letter" && !sealing && !openLetter && (
          <div className="space-y-3">
            <p className="font-display text-xl text-paper/85">
              {letters.length ? "信挂在树上，到点会亮起" : "写一封信，寄给稍后的自己"}
            </p>
            <p className="text-xs tracking-[0.24em] text-fog/60">
              {letters.length ? `共 ${letters.length} 封 · 轻点信封看看时间` : "封缄之后，它会挂在树梢上等时间"}
            </p>
          </div>
        )}

        {/* 封缄动画 */}
        {sealing && (
          <motion.div
            initial={{ scale: 1, rotate: 0, y: 0, opacity: 1 }}
            animate={{ scale: 0.5, rotate: -8, y: -40, opacity: 0 }}
            transition={{ duration: 0.88, ease: [0.5, 0, 0.6, 1] }}
            className="paper-slip relative w-60 rounded-xl px-5 py-6 text-left"
          >
            <p className="text-sm leading-6">{draft}</p>
            <motion.span
              initial={{ scale: 2.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.32, duration: 0.3, ease: "easeOut" }}
              className="absolute -bottom-3 -right-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#c05a45] font-display text-base text-[#f4ecdd] shadow-[0_4px_14px_rgba(192,90,69,0.5)]"
            >
              屿
            </motion.span>
          </motion.div>
        )}

        {/* 漂流瓶 */}
        {mode === "bottle" && !picked && (
          <div className="space-y-3">
            <p className="font-display text-xl text-paper/85">
              {thrownCount > 0 ? `已有 ${thrownCount} 只瓶子随波远去` : "写一句话，装进瓶子抛进海里"}
            </p>
            <p className="text-xs tracking-[0.24em] text-fog/60">也许某天，会被远方的人捡起</p>
            <button
              onClick={pickBottle}
              className="mx-auto flex h-12 items-center gap-2 rounded-full border border-mist/45 bg-mist/10 px-6 text-sm tracking-[0.2em] text-mist transition-all hover:bg-mist/16 active:scale-95"
            >
              <BottleIcon size={17} />
              捞一只漂流瓶
            </button>
          </div>
        )}

        {/* 捞到的瓶中信 */}
        {mode === "bottle" && picked && (
          <motion.div
            initial={{ opacity: 0, y: 16, rotate: -2 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            className="paper-slip w-64 rounded-2xl px-6 py-6"
          >
            <p className="text-center text-[11px] tracking-[0.28em] text-[#8a7a5c]">瓶中信</p>
            <p className="mt-3 text-center text-[15px] leading-7 text-[#2e3230]">{picked}</p>
            <button
              onClick={returnBottle}
              className="mt-4 h-10 w-full rounded-full bg-[#2e3230] text-xs tracking-[0.24em] text-[#f4ecdd] transition-transform active:scale-95"
            >
              放回海里
            </button>
          </motion.div>
        )}

        {/* 抛瓶动画 */}
        {throwing > 0 && (
          <motion.div
            key={throwing}
            className="pointer-events-none absolute bottom-[26%] left-[6%]"
            initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
            animate={{ x: 240, y: -46, rotate: 420, opacity: [1, 1, 0.8, 0] }}
            transition={{ duration: 1.8, ease: [0.3, 0.4, 0.6, 1] }}
            onAnimationComplete={() => {
              setThrowing(0);
              audio.splash();
            }}
          >
            <svg width="34" height="46" viewBox="0 0 34 46">
              <rect x="13" y="2" width="8" height="5" rx="1.5" fill="#8a6a4a" />
              <path d="M12 8h10c2 4 4 6 4 12v18a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4V20c0-6 2-8 4-12Z" fill="rgba(163,193,214,0.5)" stroke="rgba(220,235,245,0.6)" strokeWidth="1.2" />
              <rect x="12" y="24" width="10" height="8" rx="1" fill="#f4ecdd" transform="rotate(-8 17 28)" />
            </svg>
          </motion.div>
        )}
      </div>

      {/* 轻提示 */}
      <AnimatePresence>
        {toast && (
          <motion.p
            key={toast.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="pointer-events-none absolute bottom-[132px] left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full border border-paper/10 bg-abyss/80 px-4 py-2 text-xs tracking-[0.18em] text-paper/85"
          >
            {toast.msg}
          </motion.p>
        )}
      </AnimatePresence>

      {/* 萤火墙：覆盖在树与舞台之上（自己的萤火存在本机） */}
      {mode === "wall" && (
        <div className="absolute inset-x-0 top-0 bottom-[64px] z-10">
          <FireflyWall />
        </div>
      )}

      {/* 模式切换 + 输入 */}
      <div className="shrink-0 pb-1">
        <div className="mx-auto mb-2 flex w-fit rounded-full border border-paper/10 bg-ink/50 p-1">
          {(
            [
              { id: "heart", label: "心里话" },
              { id: "letter", label: `回声信${letters.length ? ` · ${letters.length}` : ""}` },
              { id: "bottle", label: "漂流瓶" },
              { id: "wall", label: "萤火墙" },
            ] as { id: Mode; label: string }[]
          ).map((m) => (
            <button
              key={m.id}
              onClick={() => switchMode(m.id)}
              className={`h-9 rounded-full px-3.5 text-xs tracking-[0.16em] transition-all duration-300 ${
                mode === m.id ? "bg-apricot/15 text-apricot" : "text-fog/60"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {mode === "heart" && (
          <form onSubmit={submit}>
            <div className="breath-input flex items-center gap-2 rounded-full bg-deep/80 py-2 pl-5 pr-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={40}
                placeholder="今天的心情是……"
                className="min-w-0 flex-1 bg-transparent text-base text-paper placeholder:text-fog/40 focus:outline-none"
                aria-label="写一句心里话"
              />
              <button
                type="submit"
                disabled={!text.trim()}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-apricot text-abyss transition-all duration-300 enabled:shadow-[0_0_18px_rgba(244,196,143,0.5)] enabled:active:scale-90 disabled:opacity-30"
                aria-label="说给树洞听"
              >
                <SendIcon size={19} />
              </button>
            </div>
            <p className="mt-2 text-center text-[11px] tracking-[0.2em] text-fog/45">回应来自岛上的风 · 阅后即焚</p>
          </form>
        )}

        {mode === "letter" && (
          <div>
            <div className="breath-input flex items-end gap-2 rounded-3xl bg-deep/80 p-3 pl-5">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={120}
                rows={2}
                placeholder="写给稍后的自己……"
                className="min-h-[52px] min-w-0 flex-1 resize-none bg-transparent text-base leading-6 text-paper placeholder:text-fog/40 focus:outline-none"
                aria-label="写一封回声信"
              />
              <button
                onClick={seal}
                disabled={!draft.trim()}
                className="flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-apricot px-4 text-sm tracking-[0.2em] text-abyss transition-all duration-300 enabled:shadow-[0_0_18px_rgba(244,196,143,0.5)] enabled:active:scale-90 disabled:opacity-30"
              >
                <EnvelopeIconLike size={16} />
                封缄
              </button>
            </div>
            <div className="mt-2 flex justify-center gap-1.5">
              {DELAYS.map((d) => (
                <button
                  key={d.id}
                  onClick={() => {
                    setDelayKind(d.id);
                    audio.pluck(494, 0.08);
                  }}
                  className={`h-9 rounded-full border px-3 text-[11px] tracking-wider transition-all active:scale-95 ${
                    delayKind === d.id
                      ? "border-apricot/55 bg-apricot/12 text-apricot"
                      : "border-paper/10 text-fog/60"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-center text-[11px] tracking-[0.18em] text-fog/45">
              信只留在这台设备的浏览器里 · 不上传 · 拆开即化作星光
            </p>
          </div>
        )}

        {mode === "bottle" && (
          <div>
            <div className="breath-input flex items-end gap-2 rounded-3xl bg-deep/80 p-3 pl-5">
              <textarea
                value={bottleText}
                onChange={(e) => setBottleText(e.target.value)}
                maxLength={80}
                rows={2}
                placeholder="写给远方某个人的话……"
                className="min-h-[52px] min-w-0 flex-1 resize-none bg-transparent text-base leading-6 text-paper placeholder:text-fog/40 focus:outline-none"
                aria-label="写一句给漂流瓶的话"
              />
              <button
                onClick={throwBottle}
                disabled={!bottleText.trim()}
                className="flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-mist px-4 text-sm tracking-[0.2em] text-abyss transition-all duration-300 enabled:shadow-[0_0_18px_rgba(163,193,214,0.45)] enabled:active:scale-90 disabled:opacity-30"
              >
                <BottleIcon size={16} />
                抛瓶
              </button>
            </div>
            <p className="mt-2 text-center text-[11px] tracking-[0.18em] text-fog/45">瓶子随波走 · 岛不记得瓶里的话</p>
          </div>
        )}
      </div>

      {/* 拆信 */}
      <AnimatePresence>
        {openLetter && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex items-center justify-center bg-abyss/78 px-7 backdrop-blur-[2px]"
          >
            <motion.div
              initial={{ scale: 0.92, y: 16, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.94, y: 10, opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="paper-slip w-full max-w-xs rounded-2xl px-6 py-6"
            >
              <p className="text-center text-[11px] tracking-[0.28em] text-[#8a7a5c]">来自{timeAgo(openLetter.createdAt)}的你</p>
              <p className="mt-4 min-h-[88px] text-center text-[17px] leading-8 text-[#2e3230]">
                {openLetter.text.split("").map((ch, i) => (
                  <span
                    key={i}
                    className={`char-float ${i < openReveal ? "on" : ""} ${dissolving ? "bye" : ""}`}
                    style={
                      dissolving && openExits[i]
                        ? ({
                            "--tx": `${openExits[i].tx}px`,
                            "--ty": `${openExits[i].ty}px`,
                            "--rot": `${openExits[i].rot}deg`,
                            "--d": `${openExits[i].d}s`,
                          } as React.CSSProperties)
                        : undefined
                    }
                  >
                    {ch}
                  </span>
                ))}
              </p>
              <div className="mt-5 flex gap-2.5">
                <button
                  onClick={dissolveOpen}
                  className="h-11 flex-1 rounded-full bg-[#2e3230] text-sm tracking-[0.24em] text-[#f4ecdd] transition-transform active:scale-95"
                >
                  化作星光
                </button>
                <button
                  onClick={() => destroyLetter(openLetter.id)}
                  className="h-11 rounded-full border border-[#c05a45]/50 px-4 text-sm tracking-widest text-[#c05a45] transition-transform active:scale-95"
                >
                  销毁
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
