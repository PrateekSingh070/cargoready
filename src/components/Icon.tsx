import type { ReactNode } from "react";

const paths = {
  plane: <path d="M22 2 9 15m13-13-8 20-5-7-7-5 20-8Z" />,
  route: (
    <>
      <circle cx="6" cy="18" r="2" />
      <circle cx="18" cy="6" r="2" />
      <path d="M8 18h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M9.5 3h5l.6 2.4 2 .9 2.2-.9 2.5 4.2-1.7 1.7v2l1.7 1.7-2.5 4.2-2.2-.9-2 .9-.6 2.4h-5l-.6-2.4-2-.9-2.2.9-2.5-4.2 1.7-1.7v-2L2.2 9.6l2.5-4.2 2.2.9 2-.9L9.5 3Z" />
    </>
  ),
  arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5m0-8h.01" />
    </>
  ),
  box: (
    <path d="m12 3 9 5v8l-9 5-9-5V8l9-5Zm0 9 9-4m-9 4L3 8m9 4v9m-5-16 9 5" />
  ),
  tag: <path d="M3 4h8l10 10-7 7L3 10V4Zm4 4h.01" />,
  check: <path d="M8 5H5v16h14V5h-3M8 3h8v4H8zM8 14l3 3 5-6" />,
  shield: (
    <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Zm0-15v5m0 4h.01" />
  ),
  close: <path d="m6 6 12 12M18 6 6 18" />,
  lock: (
    <>
      <rect x="5" y="10" width="14" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof paths;

export function Icon({ name }: { name: IconName }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}
