/** 树洞页专用小图标 */
import { BottleIcon, SendIcon } from "../shared/icons";

export { BottleIcon, SendIcon };

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

/** 信封（封缄按钮用） */
export function EnvelopeIconLike({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
      <path d="m4.5 7.5 7.5 5.5 7.5-5.5" />
    </svg>
  );
}
