import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CHANGELOG, PROMISES } from "../../lib/changelog";
import { audio } from "../../lib/audio";
import { buzz } from "../../lib/haptics";
import { NoteIcon, XIcon } from "./icons";

type Tab = "log" | "promise";

/** 岛志 —— 航海日志 + 岛上承诺 */
export default function IslandNotes({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("log");

  const switchTab = (t: Tab) => {
    if (t === tab) return;
    audio.pluck(t === "log" ? 523.25 : 440, 0.12);
    buzz(5);
    setTab(t);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-abyss/80 backdrop-blur-[3px] sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 30, opacity: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="panel relative flex max-h-[86dvh] w-full max-w-md flex-col rounded-t-3xl sm:rounded-3xl"
      >
        {/* 题头 */}
        <div className="flex items-center justify-between border-b border-paper/8 px-6 pb-3 pt-5">
          <div className="flex items-center gap-2.5 text-apricot">
            <NoteIcon size={19} />
            <span className="font-display text-xl tracking-[0.3em] pl-[0.3em] text-paper">岛志</span>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-paper/12 text-fog/70 transition-all active:scale-90"
            aria-label="合上岛志"
          >
            <XIcon size={16} />
          </button>
        </div>

        {/* 页签 */}
        <div className="flex gap-2 px-6 pt-3.5">
          <button
            onClick={() => switchTab("log")}
            className={`h-10 rounded-full border px-5 text-xs tracking-[0.24em] transition-all active:scale-95 ${
              tab === "log"
                ? "border-apricot/55 bg-apricot/12 text-apricot"
                : "border-paper/12 text-fog/60"
            }`}
          >
            航海日志
          </button>
          <button
            onClick={() => switchTab("promise")}
            className={`h-10 rounded-full border px-5 text-xs tracking-[0.24em] transition-all active:scale-95 ${
              tab === "promise"
                ? "border-apricot/55 bg-apricot/12 text-apricot"
                : "border-paper/12 text-fog/60"
            }`}
          >
            岛上承诺
          </button>
        </div>

        {/* 内容 */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-[max(env(safe-area-inset-bottom),20px)] pt-4">
          <AnimatePresence mode="wait">
            {tab === "log" ? (
              <motion.div
                key="log"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="relative"
              >
                <span className="absolute bottom-2 left-[13px] top-2 w-px bg-gradient-to-b from-apricot/40 via-paper/15 to-transparent" />
                {CHANGELOG.map((e, i) => (
                  <motion.div
                    key={e.v}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.08 * i, duration: 0.4 }}
                    className="relative mb-6 pl-10 last:mb-2"
                  >
                    {/* 卷印 */}
                    <span
                      className={`absolute left-0 top-0.5 flex h-7 w-7 items-center justify-center rounded-[6px] font-display text-[13px] ${
                        i === 0
                          ? "bg-ember text-abyss shadow-[0_0_14px_rgba(232,153,106,0.5)]"
                          : "bg-deep text-apricot/70 ring-1 ring-apricot/20"
                      }`}
                    >
                      {e.v.slice(1)}
                    </span>
                    <div className="flex items-baseline gap-2.5">
                      <span className="font-display text-lg tracking-[0.14em] text-paper">{e.title}</span>
                      <span className="text-[10px] tracking-[0.2em] text-fog/45">{e.date}</span>
                    </div>
                    <ul className="mt-1.5 space-y-1">
                      {e.items.map((it) => (
                        <li key={it} className="flex gap-2 text-[13px] leading-6 text-fog/80">
                          <span className="mt-[11px] h-1 w-1 shrink-0 rounded-full bg-apricot/50" />
                          {it}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
                <p className="pt-1 text-center text-[10px] tracking-[0.28em] text-fog/35">
                  —— 日志到此为止 · 下一页由时间写 ——
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="promise"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <p className="mb-4 text-[13px] leading-6 text-fog/70">
                  这座岛能亮很久，靠的不是功能，是下面这几句话。它们写给每个路过的人，也约束造岛的我们。
                </p>
                {PROMISES.map((p, i) => (
                  <motion.div
                    key={p.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.07 * i, duration: 0.4 }}
                    className="mb-4 rounded-2xl border border-paper/8 bg-ink/40 px-5 py-4"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-apricot/14 font-display text-[13px] text-apricot ring-1 ring-apricot/25">
                        {i + 1}
                      </span>
                      <span className="font-display text-base tracking-[0.2em] text-paper">{p.title}</span>
                    </div>
                    <p className="mt-2 text-[13px] leading-6 text-fog/75">{p.body}</p>
                  </motion.div>
                ))}
                <div className="flex items-center justify-center gap-3 pt-1">
                  <span className="h-px w-10 bg-paper/15" />
                  <span className="flex h-9 w-9 items-center justify-center rounded-[6px] bg-ember/90 font-display text-sm text-abyss shadow-[0_0_16px_rgba(232,153,106,0.4)]">
                    屿
                  </span>
                  <span className="h-px w-10 bg-paper/15" />
                </div>
                <p className="pb-1 pt-2 text-center text-[10px] tracking-[0.28em] text-fog/35">岛印为证 · 长期有效</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
