import React from 'react';

/** Bộ icon Lucide (stroke 1.5), nhất quán toàn hệ thống ([UI] 7). */
type P = { size?: number; className?: string };
const base = (size = 14): React.SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

export const Icon = {
  plus: (p: P) => (
    <svg {...base(p.size)} className={`ico ${p.className ?? ''}`}><path d="M12 5v14M5 12h14" /></svg>
  ),
  trash: (p: P) => (
    <svg {...base(p.size)} className={`ico ${p.className ?? ''}`}><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>
  ),
  edit: (p: P) => (
    <svg {...base(p.size)} className={`ico ${p.className ?? ''}`}><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
  ),
  eye: (p: P) => (
    <svg {...base(p.size)} className={`ico ${p.className ?? ''}`}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
  ),
  play: (p: P) => (
    <svg {...base(p.size)} className={`ico ${p.className ?? ''}`}><path d="M6 4l14 8-14 8V4Z" /></svg>
  ),
  save: (p: P) => (
    <svg {...base(p.size)} className={`ico ${p.className ?? ''}`}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2ZM17 21v-8H7v8M7 3v5h8" /></svg>
  ),
  download: (p: P) => (
    <svg {...base(p.size)} className={`ico ${p.className ?? ''}`}><path d="M12 3v12m-5-5 5 5 5-5M5 21h14" /></svg>
  ),
  upload: (p: P) => (
    <svg {...base(p.size)} className={`ico ${p.className ?? ''}`}><path d="M12 21V9m-5 5 5-5 5 5M5 3h14" /></svg>
  ),
  copy: (p: P) => (
    <svg {...base(p.size)} className={`ico ${p.className ?? ''}`}><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
  ),
  sun: (p: P) => (
    <svg {...base(p.size)} className={`ico ${p.className ?? ''}`}><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
  ),
  moon: (p: P) => (
    <svg {...base(p.size)} className={`ico ${p.className ?? ''}`}><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" /></svg>
  ),
  target: (p: P) => (
    <svg {...base(p.size)} className={`ico ${p.className ?? ''}`}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></svg>
  ),
  pin: (p: P) => (
    <svg {...base(p.size)} className={`ico ${p.className ?? ''}`}><path d="M12 17v5M9 3h6l-1 7 3 3H7l3-3-1-7Z" /></svg>
  ),
  key: (p: P) => (
    <svg {...base(p.size)} className={`ico ${p.className ?? ''}`}><circle cx="7.5" cy="15.5" r="4.5" /><path d="M10.5 12.5 20 3m-3 3 2 2m-4 0 2 2" /></svg>
  ),
  zap: (p: P) => (
    <svg {...base(p.size)} className={`ico ${p.className ?? ''}`}><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" /></svg>
  ),
  list: (p: P) => (
    <svg {...base(p.size)} className={`ico ${p.className ?? ''}`}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
  ),
  bug: (p: P) => (
    <svg {...base(p.size)} className={`ico ${p.className ?? ''}`}><path d="M8 2l1.5 1.5M16 2l-1.5 1.5M12 20v-9M9 8h6a3 3 0 0 1 3 3v3a6 6 0 0 1-12 0v-3a3 3 0 0 1 3-3ZM6 13H2m20 0h-4M5 8 3 6m16 2 2-2M5 18l-2 2m16-2 2 2" /></svg>
  ),
  db: (p: P) => (
    <svg {...base(p.size)} className={`ico ${p.className ?? ''}`}><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" /></svg>
  ),
  vars: (p: P) => (
    <svg {...base(p.size)} className={`ico ${p.className ?? ''}`}><path d="M5 4c-2 4-2 12 0 16M19 4c2 4 2 12 0 16M9 9l6 6m0-6-6 6" /></svg>
  ),
  history: (p: P) => (
    <svg {...base(p.size)} className={`ico ${p.className ?? ''}`}><path d="M3 12a9 9 0 1 0 3-6.7L3 8m0-5v5h5M12 7v5l3 2" /></svg>
  ),
  menu: (p: P) => (
    <svg {...base(p.size)} className={`ico ${p.className ?? ''}`}><path d="M3 6h18M3 12h18M3 18h18" /></svg>
  ),
  x: (p: P) => (
    <svg {...base(p.size)} className={`ico ${p.className ?? ''}`}><path d="M18 6 6 18M6 6l12 12" /></svg>
  ),
  info: (p: P) => (
    <svg {...base(p.size)} className={`ico ${p.className ?? ''}`}><circle cx="12" cy="12" r="9" /><path d="M12 16v-4m0-4h.01" /></svg>
  ),
  check: (p: P) => (
    <svg {...base(p.size)} className={`ico ${p.className ?? ''}`}><path d="M20 6 9 17l-5-5" /></svg>
  ),
  alert: (p: P) => (
    <svg {...base(p.size)} className={`ico ${p.className ?? ''}`}><path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></svg>
  ),
};
