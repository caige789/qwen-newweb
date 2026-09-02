import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { audio } from "../../lib/audio";
import { buzz } from "../../lib/haptics";
import { drawDailyFortune, drawFortune, type Fortune } from "../../lib/poems";
import { downloadFortuneCard } from "../../lib/fortuneCard";
import { getSolarTerm, daysToNextTerm, SEASON_NAMES } from "../../lib/solarTerms";
import { useShake } from "../../hooks/useShake";
import { DownloadIcon, HandShakeIcon, LanternIcon, XIcon } from "../shared/icons";

type Mode = "daily" | "shake";
type Stage = "can" | "shaking" | "slip";

/** 签纸：签文 + 宜忌 + 光量 + 节气印 */
function PaperSlip({ fortune, term, termPoem, isDaily }: { fortune: Fortune; term: string; termPoem: string; isDaily: boolean }) {
  return (
    <div className="paper-slip w-full max-w-[300px] rounded-2xl px-7 py-7 text-center">
      <p className="text-[10px] tracking-[0.4em] text-[#8a7a5c]">治 愈 光 屿</p>
      <p className={`mt-4 font-display text-4xl tracking-[0.2em] text-[#2e3230] ${isDaily ? "text-glow" : ""}`}>{fortune.sign}</p>
      <p className="mt-3 text-sm leading-7 text-[#5a5648]">「{fortune.poem}」</p>
      {/* 光量 */}
      <div className="mt-4 flex items-center justify-center gap-1.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="h-2.5 w-2.5 rounded-full"
            style={{
              background: i < fortune.light ? "#e8996a" : "rgba(138,122,92,0.2)",
              boxShadow: i < fortune.light ? "0 0 8px rgba(232,153,106,0.6)" : "none",
            }}
          />
        ))}
        <span className="ml-2 text-[10px] tracking-[0.3em] text-[#8a7a5c]">光量</span>
      </div>
      <div className="mt-4 space-y-2 border-t border-[#8a7a5c]/25 pt-3.5 text-left text-[13px] leading-6">
        <p className="text-[#4a6a4a]">
          <span className="mr-3 inline-block h-5 w-5 rounded-[4px] bg-[#6a8a62] text-center font-display text-[11px] leading-5 text-[#f4ecdd]">宜</span>
          {fortune.good}
        </p>
        <p className="text-[#8a5a4a]">
          <span className="mr-3 inline-block h-5 w-5 rounded-[4px] bg-[#b06a52] text-center font-display text-[11px] leading-5 text-[#f4ecdd]">忌</span>
          {fortune.avoid}
        </p>
      </div>
      {/* 节气印 */}
      <div className="mt-4 flex items-center justify-center gap-2.5 border-t border-[#8a7a5c]/25 pt-3.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] bg-[#c05a45] font-display text-sm leading-none text-[#f4ecdd] shadow-[0_2px_8px_rgba(192,90,69,0.4)] rotate-[-4deg]">
          {term}
        </span>
        <p className="text-left text-[11px] leading-5 text-[#8a7a5c]">
          {isDaily ? "今日节气 · " : "岛上正值 · "}
          {termPoem}
        </p>
      </div>
    </div>
  );
}

export default function FortuneDrawer({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<Mode>("daily");
  const [stage, setStage] = useState<Stage>("can");
  const [fortune, setFortune] = useState<Fortune | null>(null);
  const [flyKey, setFlyKey] = useState(0);

  const daily = useMemo(() => drawDailyFortune(), []);
  const term = useMemo(() => getSolarTerm(), []);
  const dtn = useMemo(() => daysToNextTerm(), []);

  const draw = () => {
    if (stage === "shaking") return;
    audio.unlock();
    setStage("shaking");
    setFortune(null);
    setFlyKey((k) => k + 1);
    audio.woodKnock();
    window.setTimeout(() => audio.woodKnock(), 240);
    window.setTimeout(() => audio.woodKnock(), 500);
    buzz(12);
    window.setTimeout(() => {
      setFortune(drawFortune());
      setStage("slip");
      audio.playChime(3);
      buzz(18);
    }, 1150);
  };

  const { needPermission, granted, request } = useShake(() => {
    if (mode !== "shake") setMode("shake");
    draw();
  });
  void granted;
  void needPermission;

  const switchMode = (m: Mode) => {
    if (m === mode) return;
    audio.pluck(m === "daily" ? 523.25 : 440, 0.12);
    buzz(5);
    setMode(m);
    setStage("can");
    setFortune(null);
  };

  const openDaily = () => {
    audio.unlock();
    audio.playChime(3);
    audio.twinkle();
    buzz(14);
    setStage("slip");
  };

  const termPoem = `${SEASON_NAMES[term.season]} · ${term.poem}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-abyss/88 px-7 backdrop-blur-[3px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <button
        onClick={onClose}
        className="absolute right-5 top-[max(env(safe-area-inset-top),16px)] flex h-10 w-10 items-center justify-center rounded-full border border-paper/15 bg-ink/45 text-fog/70 transition-all active:scale-90"
        aria-label="关闭"
      >
        <XIcon size={17} />
      </button>

      {/* 页签 */}
      <div className="mb-5 flex rounded-full border border-paper/10 bg-ink/50 p-1">
        <button
          onClick={() => switchMode("daily")}
          className={`h-10 rounded-full px-6 text-xs tracking-[0.24em] transition-all duration-300 ${
            mode === "daily" ? "bg-apricot/15 text-apricot" : "text-fog/60"
          }`}
        >
          今日签
        </button>
        <button
          onClick={() => switchMode("shake")}
          className={`h-10 rounded-full px-6 text-xs tracking-[0.24em] transition-all duration-300 ${
            mode === "shake" ? "bg-apricot/15 text-apricot" : "text-fog/60"
          }`}
        >
          摇一签
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* ---------- 今日签 ---------- */}
        {mode === "daily" && (
          <motion.div
            key="daily"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="flex w-full flex-col items-center gap-5"
          >
            {stage !== "slip" ? (
              <>
                <p className="text-[11px] tracking-[0.32em] text-fog/55">
                  今日{term.name} · 距下一个节气还有 {dtn} 天
                </p>
                <p className="max-w-[280px] text-center font-display text-xl leading-9 text-paper/85">
                  同一天的签，
                  <br />
                  是岛给同一天的你的回信。
                </p>
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  onClick={openDaily}
                  className="flex h-14 items-center gap-2.5 rounded-full bg-apricot px-9 text-base tracking-[0.3em] pl-[2.2em] text-abyss shadow-[0_0_36px_rgba(244,196,143,0.45)]"
                >
                  <LanternIcon size={18} />
                  展开今日签
                </motion.button>
              </>
            ) : (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 40, rotate: -3 }}
                  animate={{ opacity: 1, y: 0, rotate: 0 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                  <PaperSlip fortune={daily} term={term.name} termPoem={termPoem} isDaily />
                </motion.div>
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => void downloadFortuneCard(daily)}
                  className="flex h-12 items-center gap-2 rounded-full border border-apricot/50 bg-apricot/12 px-6 text-sm tracking-[0.2em] text-apricot transition-all active:scale-95"
                >
                  <DownloadIcon size={16} />
                  存为卡片
                </motion.button>
                <p className="flex items-center gap-1.5 text-[10px] tracking-[0.24em] text-fog/40">
                  <LanternIcon size={12} />
                  明天，会是另一支签
                </p>
              </>
            )}
          </motion.div>
        )}

        {/* ---------- 摇一签 ---------- */}
        {mode === "shake" && stage !== "slip" && (
          <motion.div
            key="can"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="flex flex-col items-center gap-7"
          >
            <p className="text-[11px] tracking-[0.32em] text-fog/55">摇一签 · 此刻的岛想对你说</p>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={draw}
              className="relative flex h-56 w-40 flex-col items-center justify-end pb-6"
              aria-label="摇签"
            >
              {stage === "shaking" && (
                <span
                  key={flyKey}
                  className="stick-fly absolute left-[58%] top-6 h-24 w-1.5 origin-bottom rounded-full bg-[#d9b98a] shadow-[0_0_10px_rgba(217,185,138,0.5)]"
                />
              )}
              <div className="absolute left-[40%] top-4 h-28 w-1.5 -rotate-6 rounded-full bg-[#c9a976]" />
              <div className="absolute left-[50%] top-2 h-32 w-1.5 rotate-3 rounded-full bg-[#d9b98a]" />
              <div className="absolute left-[58%] top-5 h-24 w-1.5 rotate-12 rounded-full bg-[#bfa06a]" />
              <div
                className={`relative h-40 w-32 rounded-b-[26px] rounded-t-[10px] border border-[#8a6a45]/60 bg-gradient-to-b from-[#5c4632] to-[#3c2d1e] shadow-[0_18px_50px_rgba(0,0,0,0.5)] ${
                  stage === "shaking" ? "can-shake" : ""
                }`}
              >
                <div className="absolute inset-x-0 top-3 text-center font-display text-xl tracking-[0.3em] text-[#e8c99a]">
                  光屿签
                </div>
                <div className="absolute inset-x-6 top-12 border-t border-[#e8c99a]/25" />
                <div className="absolute inset-x-0 bottom-4 text-center text-[10px] tracking-[0.3em] text-[#e8c99a]/60">
                  轻点 · 或摇一摇
                </div>
              </div>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={draw}
              className="flex h-12 items-center gap-2 rounded-full bg-apricot px-8 text-sm tracking-[0.3em] pl-[2em] text-abyss shadow-[0_0_30px_rgba(244,196,143,0.4)]"
            >
              <HandShakeIcon size={16} />
              摇一签
            </motion.button>
            {needPermission && !granted && (
              <button
                onClick={() => void request()}
                className="text-[11px] tracking-[0.24em] text-fog/50 underline underline-offset-4"
              >
                开启摇一摇权限
              </button>
            )}
          </motion.div>
        )}

        {mode === "shake" && stage === "slip" && fortune && (
          <motion.div
            key="slip"
            initial={{ opacity: 0, y: 40, rotate: -3 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center gap-5"
          >
            <PaperSlip fortune={fortune} term={term.name} termPoem={termPoem} isDaily={false} />
            <div className="flex items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={() => void downloadFortuneCard(fortune)}
                className="flex h-12 items-center gap-2 rounded-full border border-apricot/50 bg-apricot/12 px-6 text-sm tracking-[0.2em] text-apricot transition-all active:scale-95"
              >
                <DownloadIcon size={16} />
                存为卡片
              </motion.button>
              <button
                onClick={draw}
                className="h-12 rounded-full border border-paper/15 px-6 text-sm tracking-[0.2em] text-fog/75 transition-all active:scale-95"
              >
                再摇一签
              </button>
            </div>
            <p className="flex items-center gap-1.5 text-[10px] tracking-[0.24em] text-fog/40">
              <LanternIcon size={12} />
              签文阅后不留，温柔带走就好
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
