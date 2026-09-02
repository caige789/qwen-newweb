/** 手绘风格线性图标 —— 统一 1.6 描边、圆头 */

interface IconProps {
  size?: number;
  className?: string;
}

const base = (size?: number) => ({
  width: size ?? 22,
  height: size ?? 22,
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export function FlowerIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" opacity="0.9" />
      <path d="M12 9.8c-2.6 0-3.4-2.1-2.5-4.2.9 1.1 1.7 1.5 2.5 1.5s1.6-.4 2.5-1.5c.9 2.1.1 4.2-2.5 4.2Z" />
      <path d="M12 14.2c2.6 0 3.4 2.1 2.5 4.2-.9-1.1-1.7-1.5-2.5-1.5s-1.6.4-2.5 1.5c-.9-2.1-.1-4.2 2.5-4.2Z" />
      <path d="M9.8 12c0-2.6-2.1-3.4-4.2-2.5 1.1.9 1.5 1.7 1.5 2.5s-.4 1.6-1.5 2.5c2.1.9 4.2.1 4.2-2.5Z" />
      <path d="M14.2 12c0 2.6 2.1 3.4 4.2 2.5-1.1-.9-1.5-1.7-1.5-2.5s.4-1.6 1.5-2.5c-2.1-.9-4.2-.1-4.2 2.5Z" />
    </svg>
  );
}

export function TreeIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 21v-6" />
      <path d="M12 15c0-1.8-1-2.6-2.2-3.4M12 12.5c0-1.6.9-2.4 2-3.1" />
      <path d="M6.5 10.5C4.6 10.5 3 9 3 7s1.6-3.5 3.5-3.5c.3-1.4 1.7-2.5 3.4-2.5 1.2 0 2.3.5 2.9 1.4.5-.5 1.3-.9 2.2-.9 1.9 0 3.5 1.5 3.5 3.4 0 .3 0 .5-.1.8 1.2.5 2.1 1.7 2.1 3.2 0 1.9-1.6 3.6-3.5 3.6H6.5Z" />
    </svg>
  );
}

export function WaveIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M3 12c1.5 0 1.5-3 3-3s1.5 6 3 6 1.5-9 3-9 1.5 12 3 12 1.5-6 3-6 1.5 0 3 0" />
    </svg>
  );
}

export function MoonIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M19.5 14.2A8 8 0 0 1 9.8 4.5a8 8 0 1 0 9.7 9.7Z" />
      <path d="M15 4.5h.01M18.5 8h.01" strokeWidth="2.2" />
    </svg>
  );
}

export function RainIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M7 14a5 5 0 1 1 .8-9.9A6 6 0 0 1 19 8.5 4 4 0 0 1 18 14H7Z" />
      <path d="M8.5 17l-1 2.6M12.5 17l-1 2.6M16.5 17l-1 2.6" />
    </svg>
  );
}

export function SoundOnIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M4 9.5v5h3l4.5 3.8V5.7L7 9.5H4Z" />
      <path d="M15 9c1.6 1.6 1.6 4.4 0 6M17.5 6.5c3 3 3 8 0 11" />
    </svg>
  );
}

export function SoundOffIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M4 9.5v5h3l4.5 3.8V5.7L7 9.5H4Z" />
      <path d="M15.5 9.5 20 14M20 9.5 15.5 14" />
    </svg>
  );
}

export function WindIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M3 8.5h9.5a2.5 2.5 0 1 0-2.4-3.2" />
      <path d="M3 12.5h14.5a2.6 2.6 0 1 1-2.5 3.3" />
      <path d="M3 16.5h7" />
    </svg>
  );
}

export function FireIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 3.5c.4 3-1.2 4.4-2.6 6C7.9 11.2 7 12.8 7 14.5a5 5 0 0 0 10 0c0-1.4-.5-2.6-1.2-3.7-.4 1-.9 1.6-1.8 2.2.3-2.8-.6-6.8-2-9.5Z" />
      <path d="M12 19.5a2.4 2.4 0 0 1-2.4-2.4c0-1.2.9-2 2.4-3.4 1.5 1.4 2.4 2.2 2.4 3.4A2.4 2.4 0 0 1 12 19.5Z" />
    </svg>
  );
}

export function BrookIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M4 8c2 0 2-1.8 4-1.8S10 8 12 8s2-1.8 4-1.8S18 8 20 8" />
      <path d="M4 13c2 0 2-1.8 4-1.8s2 1.8 4 1.8 2-1.8 4-1.8 2 1.8 4 1.8" />
      <path d="M4 18c2 0 2-1.8 4-1.8s2 1.8 4 1.8 2-1.8 4-1.8 2 1.8 4 1.8" />
    </svg>
  );
}

export function BugIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 21a6 6 0 0 0 6-6v-3a6 6 0 1 0-12 0v3a6 6 0 0 0 6 6Z" />
      <path d="M12 21v-9M8 8.5 6.5 6M16 8.5 17.5 6M6 13H3.5M20.5 13H18M7 17.5 5 19M17 17.5l2 1.5" />
    </svg>
  );
}

export function ClockIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function MusicBoxIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M9 18.5V6.8c0-.5.3-.9.8-1l8-2c.7-.2 1.2.3 1.2 1v11.7" />
      <circle cx="6.5" cy="18.5" r="2.5" />
      <circle cx="16.5" cy="16.5" r="2.5" />
    </svg>
  );
}

export function StopIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="6.5" y="6.5" width="11" height="11" rx="2.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function LanternIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M9 4.5h6M12 4.5v1.5" />
      <path d="M12 6c-3.6 0-5.5 2.2-5.5 5.5S8.4 17 12 17s5.5-2.2 5.5-5.5S15.6 6 12 6Z" />
      <path d="M12 6c-1.6 1.6-2.4 3.4-2.4 5.5S10.4 15.4 12 17c1.6-1.6 2.4-3.4 2.4-5.5S13.6 7.6 12 6Z" opacity="0.65" />
      <path d="M10 17v1.4a2 2 0 0 0 4 0V17M12 20.4v.6" />
    </svg>
  );
}

export function SendIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M4.5 12 19 5.5c.6-.3 1.2.4.9 1L13.5 19c-.3.6-1.2.6-1.5-.1l-1.4-4.2a.9.9 0 0 0-.6-.6L4.6 12.7" />
    </svg>
  );
}

export function PlayIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M8.5 5.8v12.4c0 .8.9 1.3 1.6.9l9.4-6.2c.6-.4.6-1.4 0-1.8L10.1 4.9c-.7-.4-1.6.1-1.6.9Z" />
    </svg>
  );
}

export function PauseIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M8.5 5.5v13M15.5 5.5v13" strokeWidth="2.2" />
    </svg>
  );
}

export function ResetIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M4.5 9a8 8 0 1 1-1 5" />
      <path d="M4 4.5V9h4.5" />
    </svg>
  );
}

export function SparkIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 3.5c.6 4.4 2.4 6.2 6.8 6.8-4.4.6-6.2 2.4-6.8 6.8-.6-4.4-2.4-6.2-6.8-6.8 4.4-.6 6.2-2.4 6.8-6.8Z" />
      <path d="M18.5 15.5c.3 1.8 1 2.6 2.8 2.9-1.8.3-2.5 1-2.8 2.8-.3-1.8-1-2.5-2.8-2.8 1.8-.3 2.5-1.1 2.8-2.9Z" />
    </svg>
  );
}

export function HandShakeIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M9 4.5 6 7.5a2 2 0 0 0 0 2.8l.2.2" />
      <path d="M15 4.5l4.2 4.2a1.8 1.8 0 0 1 0 2.6 1.9 1.9 0 0 1-2.7 0" />
      <path d="M9 4.5 13.5 3l4 3-3 3a1.7 1.7 0 0 0 2.4 2.4" />
      <path d="M6.5 10.8 4 13.3a1.8 1.8 0 0 0 2.6 2.6l.4.4a1.8 1.8 0 0 0 2.6 2.6l.4.4a1.8 1.8 0 0 0 2.6 2.6" />
    </svg>
  );
}

/** 岛志（航海日志） */
export function NoteIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M6 3.5h9.5L19 7v13.5H6Z" />
      <path d="M15 3.5V7h3.5" />
      <path d="M9 11h7M9 14.5h7M9 18h4" />
    </svg>
  );
}

export function DownloadIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 4v10M8 10.5 12 14.5l4-4" />
      <path d="M4.5 16.5v2a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5v-2" />
    </svg>
  );
}

export function XIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function BottleIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M10 3.5h4M10.5 3.5v3.2c0 1.5-3 2.6-3 6v6a2 2 0 0 0 2 2h5a2 2 0 0 0 2-2v-6c0-3.4-3-4.5-3-6V3.5" />
      <path d="M9.5 14.5h5" opacity="0.7" />
    </svg>
  );
}

export function SheepIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M6.5 14.5a3.2 3.2 0 0 1 .6-6.3 4 4 0 0 1 7.5-1.1 3.6 3.6 0 0 1 3.9 3.5 3 3 0 0 1-.9 5.9H9a3 3 0 0 1-2.5-2Z" />
      <path d="M18.5 10.5c1.4-.3 2.5.4 2.5 1.6s-1.1 1.9-2.5 1.6M9.5 16.5v2.5M14.5 16.5v2.5" />
    </svg>
  );
}

export function ScrollIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M6 4.5h11a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-13Z" />
      <path d="M6 4.5a2 2 0 0 0-2 2V8h4" />
      <path d="M10 9h6M10 12.5h6M10 16h3.5" />
    </svg>
  );
}

export function CompassIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m15.5 8.5-2 5-5 2 2-5Z" />
    </svg>
  );
}

export function ChevronLeftIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M14.5 5.5 8 12l6.5 6.5" />
    </svg>
  );
}
