import type { SVGProps } from 'react';

const paths = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </>
  ),
  students: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.6-3.2 3.2-5 6.5-5s5.9 1.8 6.5 5" />
      <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8" />
      <path d="M18.5 15.4c.8 1 1.3 2.5 1.5 4.6" />
    </>
  ),
  profile: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20c.8-4 4-6 7.5-6s6.7 2 7.5 6" />
    </>
  ),
  academics: (
    <>
      <path d="m4 19 8-14 8 14" />
      <path d="M6 19h12" />
      <path d="M9 15h6" />
    </>
  ),
  course: (
    <>
      <path d="M4 5c2.5 0 4.5.8 8 3.2C15.5 5.8 17.5 5 20 5v11c-2.5 0-4.5.8-8 3.2C8.5 16.8 6.5 16 4 16z" />
      <path d="M12 8.2V19" />
    </>
  ),
  curriculum: (
    <>
      <rect x="4" y="4" width="16" height="4" rx="1" />
      <rect x="4" y="10" width="16" height="4" rx="1" />
      <rect x="4" y="16" width="16" height="4" rx="1" />
    </>
  ),
  staff: (
    <>
      <rect x="8" y="2" width="8" height="14" rx="2" />
      <path d="M5 22c.7-3.5 3.3-5.5 7-5.5s6.3 2 7 5.5" />
    </>
  ),
  enrollment: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M9 15l2 2 4-4" />
    </>
  ),
  attendance: (
    <>
      <path d="M8 3v3M16 3v3" />
      <rect x="4" y="4" width="16" height="17" rx="2" />
      <path d="M4 9h16" />
      <path d="m9 15 2 2 4-4" />
    </>
  ),
  grades: (
    <>
      <path d="M4 20V6a2 2 0 0 1 2-2h12" />
      <path d="M4 20a2 2 0 0 0 2 2h12v-2" />
      <path d="m9 13 2 2 4-5" />
    </>
  ),
  assessment: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="0.5" fill="currentColor" />
    </>
  ),
  timetable: (
    <>
      <rect x="4" y="5" width="16" height="16" rx="2" />
      <path d="M4 10h16M4 15h16M8 3v4M16 3v4" />
    </>
  ),
  finance: (
    <>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18" />
      <path d="M12 13.5a1.5 1.5 0 1 0 1.5 1.5" />
    </>
  ),
  documents: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 17h6" />
    </>
  ),
  notifications: (
    <>
      <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
      <path d="M10 19a2.2 2.2 0 0 0 4 0" />
    </>
  ),
  announcements: (
    <>
      <path d="m4 12 14 8V4L4 12z" />
      <path d="M9 12h5" />
      <path d="M4 12 2 9M4 12l-2 3" />
    </>
  ),
  reports: (
    <>
      <path d="M4 20V10M10 20V4M16 20v-7M21 20H3" />
    </>
  ),
  evaluation: (
    <>
      <path d="m12 3 2.3 6.6L21 12l-6.7 2.4L12 21l-2.3-6.6L3 12l6.7-2.4z" />
      <path d="m18.5 3 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" />
    </>
  ),
  admin: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.5-2.3 1a7 7 0 0 0-1.7-1L14.5 3h-5l-.4 2.5a7 7 0 0 0-1.7 1l-2.3-1-2 3.5 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.5 2.3-1a7 7 0 0 0 1.7 1l.4 2.5h5l.4-2.5a7 7 0 0 0 1.7-1l2.3 1 2-3.5-2-1.5c.07-.33.1-.66.1-1z" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.6-3.2 3.2-5 6.5-5s5.9 1.8 6.5 5" />
      <circle cx="17" cy="9" r="2.8" />
      <path d="M16.5 15.2c2.2.3 4 1.6 4.7 3.8" />
    </>
  ),
  roles: (
    <>
      <path d="M6 8a6 6 0 0 1 12 0v4a2 2 0 0 0 2 2H4a2 2 0 0 0 2-2z" />
      <path d="M12 18v3" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  bell: (
    <>
      <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
      <path d="M10 19a2.2 2.2 0 0 0 4 0" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M2 12s3.5-7 10-7c1.6 0 3 .4 4.3 1M22 12s-3.5 7-10 7c-1.6 0-3-.4-4.3-1" />
      <path d="m4 4 16 16" />
    </>
  ),
  logout: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" />
    </>
  ),
  chevronDown: <path d="m6 9 6 6 6-6" />,
  chevronLeft: <path d="m15 18-6-6 6-6" />,
  chevronRight: <path d="m9 18 6-6-6-6" />,
  chevronsLeft: (
    <>
      <path d="m11 17-5-5 5-5" />
      <path d="m18 17-5-5 5-5" />
    </>
  ),
  chevronsRight: (
    <>
      <path d="m13 17 5-5-5-5" />
      <path d="m6 17 5-5-5-5" />
    </>
  ),
  menu: (
    <>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </>
  ),
  panelLeft: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  x: (
    <>
      <path d="M18 6 6 18M6 6l12 12" />
    </>
  ),
  edit: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    </>
  ),
  check: <path d="m5 13 4 4L19 7" />,
  checkCircle: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.5 2.5 5-5.5" />
    </>
  ),
  alertCircle: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 16.5v.5" />
    </>
  ),
  alertTriangle: (
    <>
      <path d="M12 3 2.5 20h19z" />
      <path d="M12 10v4M12 17v.5" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8v.5" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12M7 10l5 5 5-5" />
      <path d="M4 21h16" />
    </>
  ),
  upload: (
    <>
      <path d="M12 21V9M7 14l5-5 5 5" />
      <path d="M4 3h16" />
    </>
  ),
  refresh: (
    <>
      <path d="M21 12a9 9 0 1 1-2.6-6.3" />
      <path d="M21 3v6h-6" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  mapPin: (
    <>
      <path d="M12 21s-6-5.3-6-10a6 6 0 0 1 12 0c0 4.7-6 10-6 10z" />
      <circle cx="12" cy="11" r="2.2" />
    </>
  ),
  dollar: (
    <>
      <path d="M12 3v18" />
      <path d="M16 6.5C16 5 14.2 4 12 4S8 5 8 6.5c0 3.8 8 1.8 8 5.5 0 1.8-1.8 3-4 3s-4-1.2-4-3" />
    </>
  ),
  graduationCap: (
    <>
      <path d="m2 9 10-4 10 4-10 4z" />
      <path d="M6 11v4c0 1.7 2.7 3 6 3s6-1.3 6-3v-4" />
      <path d="M22 9v5" />
    </>
  ),
  book: (
    <>
      <path d="M4 5c2.5 0 4.5.8 8 3.2C15.5 5.8 17.5 5 20 5v11c-2.5 0-4.5.8-8 3.2C8.5 16.8 6.5 16 4 16z" />
      <path d="M12 8.2V19" />
    </>
  ),
  clipboard: (
    <>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3H9z" />
      <path d="M9 12h6M9 16h4" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 5 6v5c0 4.5 3 8.5 7 10 4-1.5 7-5.5 7-10V6z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  arrowUpRight: <path d="M7 17 17 7M8 7h9v9" />,
  sparkle: (
    <>
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
      <path d="M19 4v3M20.5 5.5h-3" />
    </>
  ),
  home: (
    <>
      <path d="m3 10 9-7 9 7" />
      <path d="M5 9v11h14V9" />
    </>
  ),
  send: (
    <>
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22l-4-9-9-4z" />
    </>
  ),
  inbox: (
    <>
      <path d="M4 4h16l2 9a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5z" />
      <path d="M4 4h16l2 9" />
    </>
  ),
  filter: (
    <>
      <path d="M3 6h18M6 12h12M10 18h4" />
    </>
  ),
  more: (
    <>
      <circle cx="5" cy="12" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="19" cy="12" r="1" fill="currentColor" />
    </>
  ),
  refund: (
    <>
      <path d="M3 8h12a5 5 0 0 1 0 10H7" />
      <path d="m7 14-3 3 3 3" />
    </>
  ),
} as const;

export type IconName = keyof typeof paths;

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
}

export function Icon({ name, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}