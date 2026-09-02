import { motion } from "framer-motion";
import { FlowerIcon, MoonIcon, RainIcon, TreeIcon, WaveIcon } from "./icons";

export type TabId = "heal" | "tree" | "melody" | "noise" | "rest";

export const TABS: { id: TabId; label: string; icon: (p: { size?: number }) => React.ReactNode }[] = [
  { id: "heal", label: "治愈", icon: (p) => <FlowerIcon {...p} /> },
  { id: "tree", label: "树洞", icon: (p) => <TreeIcon {...p} /> },
  { id: "melody", label: "音律", icon: (p) => <WaveIcon {...p} /> },
  { id: "noise", label: "声息", icon: (p) => <RainIcon {...p} /> },
  { id: "rest", label: "小憩", icon: (p) => <MoonIcon {...p} /> },
];

interface Props {
  tab: TabId;
  onChange: (t: TabId) => void;
}

export default function TabBar({ tab, onChange }: Props) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40">
      <div className="mx-auto max-w-md px-3 pb-[max(env(safe-area-inset-bottom),10px)] pt-2 bg-gradient-to-t from-abyss via-abyss/85 to-transparent">
        <div className="flex items-stretch justify-between rounded-full border border-apricot/12 bg-ink/70 px-1.5 py-1.5 shadow-[0_-8px_40px_rgba(3,8,11,0.5)]">
          {TABS.map((t) => {
            const active = t.id === tab;
            return (
              <motion.button
                key={t.id}
                onClick={() => onChange(t.id)}
                whileTap={{ scale: 0.9 }}
                className="relative flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 rounded-full"
                aria-label={t.label}
                aria-current={active ? "page" : undefined}
              >
                {active && (
                  <motion.span
                    layoutId="tab-halo"
                    className="absolute inset-x-2 top-1 bottom-1 rounded-full bg-apricot/10 ring-1 ring-apricot/25"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <span
                  className={`relative transition-colors duration-300 ${
                    active ? "text-apricot drop-shadow-[0_0_10px_rgba(244,196,143,0.55)]" : "text-fog/70"
                  }`}
                >
                  {t.icon({ size: 20 })}
                </span>
                <span
                  className={`relative text-[11px] tracking-[0.16em] transition-colors duration-300 ${
                    active ? "text-paper" : "text-fog/55"
                  }`}
                >
                  {t.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
