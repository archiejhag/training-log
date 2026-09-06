/* Small line icons for the header bell and the bottom nav. currentColor
   throughout, so they pick up whatever the button's own color (dim /
   hover / active) is. */

function Icon({ children, ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

/* the daily mark: a board with a single chalk stroke on it */
export function TodayIcon(props) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <path d="M8 12h8" />
    </Icon>
  );
}

/* month / term: a small grid */
export function HistoryIcon(props) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="2.5" />
      <path d="M3.5 9h17M9 9v11.5M15 9v11.5" />
    </Icon>
  );
}

/* settings: three sliders */
export function SettingsIcon(props) {
  return (
    <Icon {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
      <circle cx="9" cy="7" r="2" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="2" fill="currentColor" stroke="none" />
      <circle cx="8" cy="17" r="2" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function FriendsIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19c0-3.3 2.5-5.5 5.5-5.5s5.5 2.2 5.5 5.5" />
      <path d="M16 8.2a2.8 2.8 0 1 1 0 5.4" />
      <path d="M15.5 13.6c2.4.3 4.3 2.2 4.3 5.4" />
    </svg>
  );
}

export function BellIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M6 10.5a6 6 0 0 1 12 0c0 3.4 1 5 1.8 6.1a.7.7 0 0 1-.6 1.1H4.8a.7.7 0 0 1-.6-1.1C5 15.5 6 13.9 6 10.5Z" />
      <path d="M9.7 20a2.4 2.4 0 0 0 4.6 0" />
    </svg>
  );
}
