import { TodayIcon, HistoryIcon, FriendsIcon, SettingsIcon } from './Icons';

/* The persistent bottom nav. Four destinations; Today is the one you land
   on and the one the daily mark lives on. Notifications isn't here — it's
   the bell in the header, since it's a transient thing to clear, not a
   place you go. */

const TABS = [
  ['home', 'Today', TodayIcon],
  ['history', 'History', HistoryIcon],
  ['friends', 'Friends', FriendsIcon],
  ['settings', 'Settings', SettingsIcon],
];

export default function BottomNav({ active, onNavigate }) {
  return (
    <nav className="bottom-nav" aria-label="Main">
      {TABS.map(([id, label, Icon]) => (
        <button
          key={id}
          type="button"
          className={'nav-tab' + (active === id ? ' is-active' : '')}
          aria-current={active === id ? 'page' : undefined}
          onClick={() => onNavigate(id)}
        >
          <Icon />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
