import type { ComponentType } from "react";
import { motion } from "framer-motion";
import type { NpcKind } from "../../lib/story";
import { NPCS } from "../../lib/story";

/** 六位 NPC 的手绘风立绘（SVG）—— 呼吸浮动 + 眨眼 + 说话声纹 */

function KeeperFace() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full">
      <circle cx="50" cy="52" r="34" fill="#e8b98a" />
      <path d="M32 44q6-4 12-1M56 43q6-3 12 1" stroke="#6b4a30" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <g className="npc-eye">
        <path d="M34 50q4 3.4 8 0M58 50q4 3.4 8 0" stroke="#4a3220" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      </g>
      <ellipse cx="33" cy="58" rx="5" ry="3" fill="rgba(224,120,100,0.4)" />
      <ellipse cx="67" cy="58" rx="5" ry="3" fill="rgba(224,120,100,0.4)" />
      <path d="M28 62q4 20 22 20t22-20q-6 8-11 6-4 5-11 5t-11-5q-5 2-11-6Z" fill="#f2ead8" />
      <path d="M38 66q5 3 12 3t12-3" stroke="#d8ccb4" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M20 34q30-18 60 0-8-14-30-14t-30 14Z" fill="#5c4632" />
      <rect x="26" y="30" width="48" height="5" rx="2.5" fill="#7a5c3e" />
    </svg>
  );
}

function FoxFace() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full">
      <path d="M24 34 16 10l22 12Z" fill="#e8874a" />
      <path d="M76 34 84 10 62 22Z" fill="#e8874a" />
      <path d="M24 30l-4-12 12 7Z" fill="#5c3a24" />
      <path d="M76 30l4-12-12 7Z" fill="#5c3a24" />
      <path d="M50 22c20 0 32 14 32 30 0 18-14 30-32 30S18 70 18 52c0-16 12-30 32-30Z" fill="#f09a5c" />
      <path d="M50 46c10 0 18 8 18 18 0 10-8 16-18 16s-18-6-18-16c0-10 8-18 18-18Z" fill="#fdf3e3" />
      <g className="npc-eye">
        <path d="M34 50q4-4 8 0M58 50q4-4 8 0" stroke="#4a2c18" strokeWidth="2.8" fill="none" strokeLinecap="round" />
      </g>
      <ellipse cx="50" cy="60" rx="4" ry="3.2" fill="#3c2414" />
      <path d="M50 63v4q-3 3-6 1.6M50 67q3 1.4 6-1.6" stroke="#3c2414" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <ellipse cx="30" cy="58" rx="4.5" ry="2.6" fill="rgba(232,135,74,0.45)" />
      <ellipse cx="70" cy="58" rx="4.5" ry="2.6" fill="rgba(232,135,74,0.45)" />
      <circle cx="82" cy="78" r="7" fill="#ffd98c" className="npc-lantern-dot" />
      <circle cx="82" cy="78" r="11" fill="rgba(255,217,140,0.28)" />
    </svg>
  );
}

function WhaleFace() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full">
      <path d="M14 62c0-20 16-34 36-34s34 13 34 31c0 16-14 26-33 26H26c-7 0-12-5-12-11Z" fill="#7fa3c4" />
      <path d="M14 62c0-20 16-34 36-34 8 0 15 2 21 6-9 3-30 6-38 14-6 6-8 12-7 18-4-2-12-2-12-4Z" fill="rgba(255,255,255,0.14)" />
      <path d="M82 52q12-8 10 2-2 8-10 6Z" fill="#6d92b4" />
      <path d="M26 76q20 8 44 0" stroke="rgba(255,255,255,0.35)" strokeWidth="2" fill="none" strokeLinecap="round" />
      <g className="npc-eye">
        <circle cx="36" cy="56" r="3.4" fill="#16283a" />
        <circle cx="35" cy="55" r="1.1" fill="#eaf4ff" />
      </g>
      <path d="M28 66q5 4 10 2" stroke="#16283a" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <ellipse cx="24" cy="63" rx="4" ry="2.4" fill="rgba(240,170,160,0.5)" />
      <g stroke="#bfe0f2" strokeWidth="2.4" strokeLinecap="round" fill="none" className="npc-spout">
        <path d="M52 22v-6" />
        <path d="M46 16q-3-4 1-6M58 16q3-4-1-6" />
      </g>
    </svg>
  );
}

function StargirlFace() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full">
      <path d="M50 14c22 0 34 16 34 34 0 6-2 12-4 16-2-10-6-14-8-24-6 4-26 6-38 0-4 10-6 16-8 24-2-4-4-10-4-16 0-18 12-34 28-34Z" fill="#3a3560" />
      <ellipse cx="50" cy="56" rx="26" ry="25" fill="#f7e3cc" />
      <path d="M26 44q10-12 24-12t24 12q-8-4-14-2-6-4-10-1-6-3-12 0-6-1-12 3Z" fill="#3a3560" />
      <g className="npc-eye">
        <circle cx="40" cy="58" r="4.6" fill="#2c2450" />
        <circle cx="60" cy="58" r="4.6" fill="#2c2450" />
        <circle cx="41.5" cy="56.5" r="1.6" fill="#fff" />
        <circle cx="61.5" cy="56.5" r="1.6" fill="#fff" />
      </g>
      <path d="M45 70q5 4 10 0" stroke="#a86a58" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <ellipse cx="33" cy="66" rx="4.5" ry="2.6" fill="rgba(240,160,140,0.5)" />
      <ellipse cx="67" cy="66" rx="4.5" ry="2.6" fill="rgba(240,160,140,0.5)" />
      <path
        d="M68 26l2.4 5 5.4.7-4 3.8 1 5.4-4.8-2.6-4.8 2.6 1-5.4-4-3.8 5.4-.7Z"
        fill="#f5d9a0"
        className="npc-star-pin"
      />
    </svg>
  );
}

function EchoFace() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full">
      <defs>
        <radialGradient id="echoGlow" cx="50%" cy="46%" r="60%">
          <stop offset="0%" stopColor="rgba(180,255,235,0.5)" />
          <stop offset="100%" stopColor="rgba(80,180,160,0.05)" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="52" r="36" fill="url(#echoGlow)" />
      <path
        d="M50 18a32 32 0 1 0 32 32c0-2-1-4-3-4a26 26 0 1 1-26-26c2 0 4-1 4-3s-2-3-4-3h-3Z"
        fill="#8fd8c6"
      />
      <path
        d="M50 30a20 20 0 1 0 20 20c0-1.6-.8-3-2.4-3A15 15 0 1 1 52 32.5c1.6 0 2.5-1 2.2-2.5Z"
        fill="#5cb8a6"
      />
      <circle cx="50" cy="52" r="13" fill="#2c6e64" />
      <g className="npc-eye">
        <circle cx="45.5" cy="50" r="2.2" fill="#d8fff4" />
        <circle cx="54.5" cy="50" r="2.2" fill="#d8fff4" />
      </g>
      <path d="M46 56q4 3 8 0" stroke="#d8fff4" strokeWidth="2" fill="none" strokeLinecap="round" />
      <g stroke="rgba(216,255,244,0.5)" strokeWidth="1.6" fill="none">
        <path d="M22 44q-6 8 0 16" className="npc-wave" />
        <path d="M78 44q6 8 0 16" className="npc-wave" />
      </g>
    </svg>
  );
}

function GrannyFace() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full">
      <path d="M50 16c20 0 30 13 31 28-6-8-14-11-20-11-2-6-6-9-11-9s-9 3-11 9c-6 0-14 3-20 11 1-15 11-28 31-28Z" fill="#c8c4bc" />
      <circle cx="50" cy="18" r="7" fill="#b4b0a8" />
      <ellipse cx="50" cy="56" rx="25" ry="24" fill="#f2d4b0" />
      <g stroke="#8a6a4a" strokeWidth="2" fill="rgba(255,255,255,0.12)">
        <circle cx="40" cy="54" r="7" />
        <circle cx="60" cy="54" r="7" />
        <path d="M47 54h6" fill="none" />
      </g>
      <g className="npc-eye">
        <path d="M36.5 54q3.5-3.4 7 0M56.5 54q3.5-3.4 7 0" stroke="#5c4630" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      </g>
      <path d="M33 62q2 2.5 4 3M67 62q-2 2.5-4 3" stroke="#d8a87c" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M44 68q6 5 12 0" stroke="#b4685a" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <ellipse cx="34" cy="63" rx="4.5" ry="2.6" fill="rgba(232,150,120,0.45)" />
      <ellipse cx="66" cy="63" rx="4.5" ry="2.6" fill="rgba(232,150,120,0.45)" />
      <circle cx="82" cy="80" r="6.5" fill="#ffd98c" className="npc-lantern-dot" />
      <circle cx="82" cy="80" r="10" fill="rgba(255,217,140,0.28)" />
    </svg>
  );
}

const FACES: Record<NpcKind, ComponentType> = {
  keeper: KeeperFace,
  fox: FoxFace,
  whale: WhaleFace,
  stargirl: StargirlFace,
  echo: EchoFace,
  granny: GrannyFace,
};

interface Props {
  kind: NpcKind;
  speaking: boolean;
}

/** NPC 台词卡：立绘 + 名牌 + 说话时的声纹条 */
export default function NpcCard({ kind, speaking }: Props) {
  const npc = NPCS[kind];
  const Face = FACES[kind];
  return (
    <motion.div
      initial={{ opacity: 0, x: -18 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center gap-3"
    >
      <div className="npc-float relative shrink-0">
        <div
          className="h-16 w-16 overflow-hidden rounded-full border-2 sm:h-[72px] sm:w-[72px]"
          style={{
            borderColor: `${npc.hue}66`,
            background: "radial-gradient(circle at 35% 28%, #1d3442, #0c1a22)",
            boxShadow: `0 0 24px ${npc.hue}33`,
          }}
        >
          <Face />
        </div>
        {speaking && (
          <span
            className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-abyss"
            style={{ background: npc.hue, boxShadow: `0 0 10px ${npc.hue}` }}
          />
        )}
      </div>
      <div className="flex flex-col gap-1">
        <span
          className="w-fit rounded-full px-3 py-1 text-[12px] tracking-[0.24em]"
          style={{ color: npc.hue, background: `${npc.hue}14`, border: `1px solid ${npc.hue}44` }}
        >
          {npc.name}
          <span className="ml-2 text-[10px] opacity-60">{npc.title}</span>
        </span>
        <span className="flex items-end gap-[3px] pl-1" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="eq-bar w-[3px] rounded-full"
              style={{
                background: npc.hue,
                height: 6 + (i % 2) * 4,
                opacity: speaking ? 0.9 : 0.25,
                animationPlayState: speaking ? "running" : "paused",
                animationDelay: `${i * 0.12}s`,
              }}
            />
          ))}
        </span>
      </div>
    </motion.div>
  );
}
