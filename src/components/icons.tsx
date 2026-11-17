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
export const Grid = ({ size = 18, className }: P) => (
  <svg {...base(size)} strokeWidth={2} className={className}>
    <rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" />
    <rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" />
  </svg>
);
export const Film = ({ size = 18, className }: P) => (
  <svg {...base(size)} strokeWidth={2} className={className}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="M10 9.5v5l4.5-2.5z" />
  </svg>
);
export const Book = ({ size = 18, className }: P) => (
  <svg {...base(size)} strokeWidth={2} className={className}>
    <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v15H7.5A2.5 2.5 0 0 0 5 20.5z" /><path d="M5 20.5A2.5 2.5 0 0 0 7.5 21H19" />
  </svg>
);
export const People = ({ size = 18, className }: P) => (
  <svg {...base(size)} strokeWidth={2} className={className}>
    <circle cx="9" cy="8.5" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 5.200a3.5 3.5 0 0 1 0 6.600M18 14.600a6.5 6.5 0 0 1 3.5 5.4" />
  </svg>
);
export const Card = ({ size = 18, className }: P) => (
  <svg {...base(size)} strokeWidth={2} className={className}>
    <rect x="3" y="5.5" width="18" height="13" rx="2.5" /><path d="M3 10h18M7 15h3" />
  </svg>
);
export const Gear = ({ size = 18, className }: P) => (
  <svg {...base(size)} strokeWidth={2} className={className}>
    <path d="M4 7h9M17 7h3M4 12h3M11 12h9M4 17h11M19 17h1" /><circle cx="15" cy="7" r="2" /><circle cx="9" cy="12" r="2" /><circle cx="17" cy="17" r="2" />
  </svg>
);
export const Clock = ({ size = 18, className }: P) => (
  <svg {...base(size)} strokeWidth={2} className={className}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.500V12l3 2" /></svg>
);
export const Draft = ({ size = 18, className }: P) => (
  <svg {...base(size)} strokeWidth={2} className={className}>
    <path d="M14 3.500H7.500A2.5 2.5 0 0 0 5 6v12a2.5 2.5 0 0 0 2.5 2.500h9A2.5 2.5 0 0 0 19 18V8.500z" /><path d="M14 3.500v5h5" />
  </svg>
);
export const External = ({ size = 16, className }: P) => (
  <svg {...base(size)} strokeWidth={2.2} className={className}><path d="M9 6H6v12h12v-3M13 5h6v6M19 5l-8 8" /></svg>
);
export const SignOut = ({ size = 16, className }: P) => (
  <svg {...base(size)} strokeWidth={2.2} className={className}><path d="M10 5H6v14h4M14 8l4 4-4 4M18 12H9" /></svg>
);
