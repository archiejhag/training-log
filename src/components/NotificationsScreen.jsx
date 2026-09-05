import FriendNotifications from './FriendNotifications';

/* The Notifications tab: same cards the home screen shows inline, but on
   their own screen and always reachable — with an explicit "nothing yet"
   instead of the home screen's silence when there's no activity. */

export default function NotificationsScreen({
  friendships,
  friendAcceptedSeenAt,
  onRespond,
  onViewFriend,
  onDismissAccepted,
  onBack,
}) {
  return (
    <div className="settings-screen">
      <button type="button" className="back-btn" onClick={onBack}>
        &larr; Back
      </button>

      <p className="eyebrow">Training Log</p>
      <h1>Notifications</h1>

      <FriendNotifications
        friendships={friendships}
        friendAcceptedSeenAt={friendAcceptedSeenAt}
        onRespond={onRespond}
        onViewFriend={onViewFriend}
        onDismissAccepted={onDismissAccepted}
        emptyState={<p className="sub">No notifications yet.</p>}
      />
    </div>
  );
}
