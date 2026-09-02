import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import { AnimatePresence, motion } from "framer-motion";
import AmbientBackground from "./components/shared/AmbientBackground";
import TabBar, { type TabId } from "./components/shared/TabBar";
import TouchRipple from "./components/shared/TouchRipple";
import Intro from "./components/intro/Intro";
import HealGarden from "./components/heal/HealGarden";
import Treehole from "./components/treehole/Treehole";
import MelodyBay from "./components/melody/MelodyBay";
import NoiseBay from "./components/noise/NoiseBay";
import RestShore from "./components/rest/RestShore";
import FortuneDrawer from "./components/fortune/FortuneDrawer";
import StarObservatory, { type Constellation } from "./components/observatory/StarObservatory";
import StoryBook from "./components/story/StoryBook";
import IslandNotes from "./components/shared/IslandNotes";
import { audio } from "./lib/audio";
import { api } from "./lib/api";
import { useDayPhase } from "./hooks/useDayPhase";
import { getSolarTerm } from "./lib/solarTerms";
import { useWeather } from "./hooks/useWeather";
import WeatherChip from "./components/shared/WeatherChip";
import { LanternIcon, NoteIcon, ScrollIcon, SoundOffIcon, SoundOnIcon, SparkIcon } from "./components/shared/icons";

/** 一秒一秒在走的实时时钟 */
function LiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    <span className="font-display text-sm tracking-[0.12em] text-paper/90 tabular-nums">
      {p(now.getHours())}:{p(now.getMinutes())}
      <span className="text-fog/55">:{p(now.getSeconds())}</span>
    </span>
  );
}

type PageProps = { night?: boolean };

const PAGES: Record<TabId, ComponentType<PageProps>> = {
  heal: HealGarden,
  tree: Treehole,
  melody: MelodyBay,
  noise: NoiseBay,
  rest: RestShore,
};

export default function App() {
  const [entered, setEntered] = useState(false);
  const [tab, setTab] = useState<TabId>("heal");
  const [soundOn, setSoundOn] = useState(true);
  const [fortuneOpen, setFortuneOpen] = useState(false);
  const [skyOpen, setSkyOpen] = useState(false);
  const [storyOpen, setStoryOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [constellations, setConstellations] = useState<Constellation[]>([]);
  const { phase, greeting, label } = useDayPhase();
  const isNight = phase === "dusk" || phase === "evening" || phase === "night";
  const solarTerm = getSolarTerm();
  const weather = useWeather();

  /* 星座读档（IndexedDB）：刷新后点亮的星座还在 */
  useEffect(() => {
    let alive = true;
    api.constellation.list().then((cs) => {
      if (alive && cs.length) setConstellations(cs);
    });
    return () => {
      alive = false;
    };
  }, []);

  /* 观星台每次变化 → 同步落档（将来换云只改 api.ts） */
  const handleConstellations = (next: Constellation[]) => {
    setConstellations(next);
    api.constellation.replaceAll(next.map((c) => ({ ...c, createdAt: Date.now() })));
  };

  useEffect(() => {
    audio.setEnabled(soundOn);
  }, [soundOn]);

  const enter = () => {
    audio.unlock();
    audio.playEnterSwell();
    setEntered(true);
  };

  const switchTab = (t: TabId) => {
    if (t === tab) return;
    audio.pluck(587.33, 0.12);
    setTab(t);
  };

  const Page = PAGES[tab];

  return (
    <div className="relative flex h-dvh w-full flex-col overflow-hidden">
      <AmbientBackground phase={phase} wx={weather.wx?.kind ?? null} />
      <TouchRipple />

      {entered && (
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-20 shrink-0 px-5 pb-2 pt-[max(env(safe-area-inset-top),14px)]"
        >
          {/* 第一行：品牌 + 功能按钮 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-[5px] bg-ember/85 font-display text-sm text-abyss shadow-[0_0_14px_rgba(232,153,106,0.4)]">
                屿
              </span>
              <span className="font-display text-lg tracking-[0.24em] text-paper/90">治愈光屿</span>
            </div>
            <div className="flex items-center gap-2">
            {/* 灯语 · 分支故事 */}
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => {
                audio.unlock();
                audio.pluck(523.25, 0.12);
                setStoryOpen(true);
              }}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-apricot/45 bg-apricot/10 text-apricot shadow-[0_0_14px_rgba(244,196,143,0.25)] transition-colors"
              aria-label="读一段灯语故事"
              title="灯语 · 故事"
            >
              <ScrollIcon size={19} />
            </motion.button>
            {/* 观星台 */}
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => {
                audio.unlock();
                audio.twinkle();
                setSkyOpen(true);
              }}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-mist/40 bg-mist/8 text-mist transition-colors"
              aria-label="观星台"
              title="观星台"
            >
              <SparkIcon size={19} />
            </motion.button>
            {/* 光屿签 */}
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => {
                audio.unlock();
                audio.pluck(659.25, 0.12);
                setFortuneOpen(true);
              }}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-ember/45 bg-ember/10 text-ember shadow-[0_0_14px_rgba(232,153,106,0.2)] transition-colors"
              aria-label="摇一支光屿签"
              title="光屿签"
            >
              <LanternIcon size={19} />
            </motion.button>
            {/* 声音开关 */}
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => setSoundOn((s) => !s)}
              className={`flex h-11 w-11 items-center justify-center rounded-full border transition-colors duration-300 ${
                soundOn
                  ? "border-apricot/40 bg-apricot/10 text-apricot"
                  : "border-paper/12 bg-ink/40 text-fog/55"
              }`}
              aria-label={soundOn ? "关闭声音" : "打开声音"}
            >
              {soundOn ? <SoundOnIcon size={19} /> : <SoundOffIcon size={19} />}
            </motion.button>
            {/* 岛志 */}
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => {
                audio.unlock();
                audio.pluck(440, 0.1);
                setNotesOpen(true);
              }}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-paper/15 bg-ink/40 text-fog/75 transition-colors"
              aria-label="岛志与承诺"
              title="岛志"
            >
              <NoteIcon size={18} />
            </motion.button>
            </div>
          </div>

          {/* 第二行：实时时钟 · 时辰节气 · 此刻天气 */}
          <div className="mt-1.5 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <LiveClock />
              <span
                className="truncate rounded-full border border-mist/25 bg-mist/8 px-2.5 py-0.5 text-[10px] tracking-[0.16em] text-mist/80"
                title={`${label} · ${solarTerm.poem}`}
              >
                {greeting} · {solarTerm.name}
              </span>
            </div>
            <WeatherChip
              wx={weather.wx}
              loading={weather.loading}
              cityId={weather.cityId}
              onPick={weather.pick}
              onRefresh={weather.refresh}
            />
          </div>
        </motion.header>
      )}

      <main className="relative z-10 min-h-0 flex-1 pb-[96px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            className="h-full"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            {entered && <Page night={isNight} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {entered && <TabBar tab={tab} onChange={switchTab} />}

      <AnimatePresence>
        {!entered && <Intro onEnter={enter} phase={phase} greeting={greeting} wx={weather.wx} />}
      </AnimatePresence>

      <AnimatePresence>
        {entered && fortuneOpen && <FortuneDrawer onClose={() => setFortuneOpen(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {entered && skyOpen && (
          <StarObservatory
            onClose={() => setSkyOpen(false)}
            constellations={constellations}
            onChange={handleConstellations}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {entered && storyOpen && <StoryBook onClose={() => setStoryOpen(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {entered && notesOpen && <IslandNotes onClose={() => setNotesOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
