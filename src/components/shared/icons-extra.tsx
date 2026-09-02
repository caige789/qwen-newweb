/** 补充小图标（治愈花园天气栏等） */

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

export function SunLikeIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
    </svg>
  );
}

export { FlowerIcon, HandShakeIcon, MoonIcon, RainIcon, SparkIcon, WindIcon } from "./icons";
