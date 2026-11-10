type P = { size?: number; className?: string };
const base = (size: number) => ({
  width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
  strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true,
});

export const Check = ({ size = 18, className }: P) => (
  <svg {...base(size)} strokeWidth={3.2} className={className}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
);
export const Arrow = ({ size = 18, className }: P) => (
  <svg {...base(size)} strokeWidth={2.6} className={className}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
export const Back = ({ size = 16, className }: P) => (
  <svg {...base(size)} strokeWidth={2.6} className={className}><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
);
export const Lock = ({ size = 18, className }: P) => (
  <svg {...base(size)} strokeWidth={2.2} className={className}>
    <rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);
export const Play = ({ size = 22, className }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
    <path d="M8 5v14l11-7z" />
  </svg>
);
export const Download = ({ size = 20, className }: P) => (
  <svg {...base(size)} strokeWidth={2} className={className}><path d="M12 4v11M7 11l5 5 5-5M5 20h14" /></svg>
);
export const Upload = ({ size = 18, className }: P) => (
  <svg {...base(size)} strokeWidth={2.6} className={className}><path d="M12 16V5M7 9l5-5 5 5M5 20h14" /></svg>
);
