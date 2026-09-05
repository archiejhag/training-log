import { useState, useEffect, useMemo } from 'react';
import './App.css';
import { useTrainingLog } from './hooks/useTrainingLog';
import { useAuth } from './hooks/useAuth';
import { useSync } from './hooks/useSync';
import { useFriends } from './hooks/useFriends';
import { useProfile } from './hooks/useProfile';
import { getFriendDays, friendNotifications } from './lib/friends';
import {
  todayKey,
  yesterdayKey,
  parseKey,
  weekKeysForOffset,
  weekdayIndex,
  weekdayName,
} from './lib/date';
import { newId } from './lib/id';
import { busyStretch, reasonPattern, isReEntry } from './lib/insights';
import CatchUp from './components/CatchUp';
import BusyNudge from './components/BusyNudge';
import ReasonPatternNote from './components/ReasonPatternNote';
import FriendNotifications from './components/FriendNotifications';
import CheckIn from './components/CheckIn';
import WeeklyView from './components/WeeklyView';
import MonthView from './components/MonthView';
import SeasonView from './components/SeasonView';
import TrainingLog from './components/TrainingLog';
import Settings from './components/Settings';
import FriendLog from './components/FriendLog';
import FriendsScreen from './components/FriendsScreen';
import UsernameSetup from './components/UsernameSetup';
import NotificationsScreen from './components/NotificationsScreen';
import { FriendsIcon, BellIcon } from './components/Icons';

/* App owns:
   1. which view is on screen ('home' or the training-log detail screen)
   2. which day is being edited (selectedDate)
   3. which week the strip is showing (weekOffset: 0 = current, -1 = last, …)
   4. wiring the data hook to the components
   All persistence lives in useTrainingLog; all date maths in lib/date. */

export default function App() {
  const today = todayKey();
  const yesterday = yesterdayKey();
  const {
    getDay,
    setTier,
    setReason,
    setReasonText,
    setType,
    setNote,
    setExercises,
    setFreeform,
    prefs,
    setPref,
    allData,
    replaceAll,
  } = useTrainingLog();

  const auth = useAuth();
  const sync = useSync({ user: auth.user, allData, replaceAll });
  const friends = useFriends(auth.user);
  const profile = useProfile(auth.user);

  const [view, setView] = useState('home'); // 'home' | 'log' | 'settings' | 'friends' | 'notifications' | 'friend'
  const [selectedDate, setSelectedDate] = useState(today);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = this week, negative = past
  const [historyMode, setHistoryMode] = useState('week'); // 'week' | 'month' | 'season'
  const [friendView, setFriendView] = useState(null); // { username, days } | null
  const [friendViewError, setFriendViewError] = useState(null);
  const [friendViewOrigin, setFriendViewOrigin] = useState('friends'); // where "Back" from a friend's log returns to

  // Opens a friend's log read-only. get_friend_days (RLS + a security
  // definer function) is what actually enforces "only if accepted" and
  // strips reason/note before this ever reaches the client. Reachable from
  // both the Friends screen and the Notifications screen, so remember
  // which one to send "Back" to.
  const openFriendLog = async (friendship) => {
    setFriendViewError(null);
    try {
      const days = await getFriendDays(friendship.friend_id);
      setFriendView({ username: friendship.friend_username, days });
      setFriendViewOrigin(view === 'notifications' ? 'notifications' : 'friends');
      setView('friend');
    } catch (e) {
      setFriendViewError(e.message ?? "Could not open that friend's log");
    }
  };

  // Which day starts the week, for every display that lays days out in a
  // row (weekly strip, month grid, term view). "same weekday" matching
  // (fillOptions, below) is a separate, unrelated use of weekdayIndex and
  // always keeps its Monday-based default regardless of this.
  const weekStart = prefs.weekStart === 'sunday' ? 'sunday' : 'monday';

  const week = weekKeysForOffset(weekOffset, weekStart);
  const day = getDay(selectedDate);
  const isToday = selectedDate === today;

  // Apply the saved theme. index.html already set it before paint; this keeps
  // it in sync when the toggle changes.
  useEffect(() => {
    const el = document.documentElement;
    if (prefs.theme === 'light') el.setAttribute('data-theme', 'light');
    else el.removeAttribute('data-theme');
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = prefs.theme === 'light' ? '#ecebe3' : '#2a2d2b';
  }, [prefs.theme]);

  // Seed a starting point for the "friend accepted" home-screen notice, once,
  // so shipping this doesn't dump every already-accepted friendship as if it
  // just happened.
  useEffect(() => {
    if (prefs.friendAcceptedSeenAt == null) {
      setPref('friendAcceptedSeenAt', new Date().toISOString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Every exercise name used before, most-recently-used first, deduped
  // case-insensitively (keeping the casing it was first typed in).
  const exerciseNames = useMemo(() => {
    const seen = new Set();
    const names = [];
    for (const key of Object.keys(allData.days).sort().reverse()) {
      for (const ex of allData.days[key].exercises ?? []) {
        const n = ex.name?.trim();
        if (n && !seen.has(n.toLowerCase())) {
          seen.add(n.toLowerCase());
          names.push(n);
        }
      }
    }
    return names;
  }, [allData]);

  // Quick-fill options for an empty training log, prior Trained-with-exercises
  // days only: the last matching *this weekday* (splits repeat weekly, not
  // day-to-day), then the most recent session overall. De-duped.
  const fillOptions = useMemo(() => {
    const before = Object.keys(allData.days)
      .sort()
      .reverse()
      .filter((k) => {
        const d = allData.days[k];
        return k < selectedDate && d.tier === 'trained' && (d.exercises?.length ?? 0) > 0;
      });

    const wd = weekdayIndex(selectedDate);
    const sameWeekday = before.find((k) => weekdayIndex(k) === wd);
    const mostRecent = before[0];

    const opts = [];
    const seen = new Set();
    const add = (key, title) => {
      if (!key || seen.has(key)) return;
      seen.add(key);
      const ex = allData.days[key].exercises;
      const n = `${ex.length} exercise${ex.length === 1 ? '' : 's'}`;
      opts.push({ title, detail: n, exercises: ex });
    };

    if (sameWeekday) {
      const weeks = Math.max(
        1,
        Math.round((parseKey(selectedDate) - parseKey(sameWeekday)) / 6.048e8),
      );
      add(
        sameWeekday,
        weeks === 1
          ? `Same as last ${weekdayName(sameWeekday)}`
          : `Last ${weekdayName(sameWeekday)} (${weeks}w ago)`,
      );
    }
    add(mostRecent, 'Repeat last session');
    return opts;
  }, [allData, selectedDate]);

  const presets = prefs.presets ?? [];
  const savePreset = (name, exercises) =>
    setPref('presets', [...presets, { id: newId(), name, exercises }]);
  const deletePreset = (id) =>
    setPref('presets', presets.filter((p) => p.id !== id));

  // Your weekly session intention. null = no bar, fall back to "X / 7 marked".
  const weeklyBar = prefs.weeklyBar ?? null;

  // "Rough stretch — want a smaller bar?" Pure reading of recent history;
  // shows only when a bar of 3+ is running well under rate amid a skip cluster.
  const busy = useMemo(
    () =>
      busyStretch(allData.days, {
        bar: weeklyBar,
        today,
        dismissedAt: prefs.busyNudgeSeenAt,
      }),
    [allData.days, weeklyBar, today, prefs.busyNudgeSeenAt],
  );

  const acceptBusyNudge = () => {
    setPref('weeklyBar', busy.suggestedBar);
    setPref('busyNudgeSeenAt', today);
  };
  const dismissBusyNudge = () => setPref('busyNudgeSeenAt', today);

  // A recurring skip reason, named once. Yields to the busy-stretch offer so
  // the two cards never show together.
  const reasonNote = useMemo(
    () =>
      reasonPattern(allData.days, {
        today,
        dismissedAt: prefs.reasonPatternSeenAt,
      }),
    [allData.days, today, prefs.reasonPatternSeenAt],
  );
  const showReasonNote = !busy.offer && reasonNote.show;
  const dismissReasonNote = () => setPref('reasonPatternSeenAt', today);

  const dismissAcceptedNotice = () =>
    setPref('friendAcceptedSeenAt', new Date().toISOString());

  // Drives the bell icon's unread count — same definition of "unread" the
  // notification cards themselves use, so the badge and the cards never
  // disagree about whether there's something to see.
  const { incoming: notifIncoming, newlyAccepted: notifNewlyAccepted } =
    friendNotifications(friends.friendships, prefs.friendAcceptedSeenAt);
  const notificationCount = notifIncoming.length + notifNewlyAccepted.length;

  // Settings -> "Clear all". Wipes the cloud copy first (if signed in),
  // then local — see useSync's clearRemote for why that order, and the
  // brief pause around it.
  const clearAllData = async () => {
    if (auth.status === 'in' && auth.user) {
      await sync.clearRemote(auth.user.id);
    }
    replaceAll({ days: {}, prefs: {} });
  };

  // One quiet line the day you come back after a week-plus away.
  const reEntry = useMemo(
    () => isReEntry(allData.days, { today }),
    [allData.days, today],
  );

  // Don't nag a brand-new user about "yesterday" — only offer catch-up once
  // there's some history to catch up to.
  const hasHistory = Object.keys(allData.days).length > 0;
  const showCatchUp =
    hasHistory &&
    getDay(yesterday).tier == null &&
    prefs.catchUpDismissedFor !== yesterday;

  const goToToday = () => {
    setSelectedDate(today);
    setWeekOffset(0);
  };

  // Move the strip a week at a time; never past the current week. Keep the
  // selected day on the same column so the check-in card stays in view.
  const changeWeek = (delta) => {
    const next = Math.min(0, weekOffset + delta);
    if (next === weekOffset) return;
    setWeekOffset(next);
    const nextWeek = weekKeysForOffset(next, weekStart);
    setSelectedDate(next === 0 ? today : nextWeek[weekdayIndex(selectedDate, weekStart)]);
  };

  const markYesterday = (tier, reason) => {
    setTier(yesterday, tier);
    if (reason) setReason(yesterday, reason);
    setPref('catchUpDismissedFor', yesterday);
  };

  return (
    <div className="phone">
      {/* Defined once, referenced by every .stroke / .mark via
          `filter: url(#chalk-edge)`. Turbulence makes noise; the
          displacement map uses that noise to nudge the shape's edge
          pixels around, turning a crisp box into a frayed chalk mark. */}
      <svg className="svg-defs" aria-hidden="true" focusable="false">
        <filter id="chalk-edge" x="-40%" y="-40%" width="180%" height="180%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.55"
            numOctaves="1"
            seed="7"
            stitchTiles="stitch"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="1"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>

      <main className="app">
        {auth.status === 'in' && profile.status === 'needed' ? (
          <UsernameSetup profile={profile} onSignOut={auth.signOut} />
        ) : view === 'home' ? (
          <>
            <div className="app-top">
              <p className="eyebrow">Training Log</p>
              <div className="top-actions">
                <button
                  type="button"
                  className="icon-btn"
                  aria-label="Friends"
                  onClick={() => setView('friends')}
                >
                  <FriendsIcon />
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={
                    notificationCount > 0
                      ? `Notifications (${notificationCount} unread)`
                      : 'Notifications'
                  }
                  onClick={() => setView('notifications')}
                >
                  <BellIcon />
                  {notificationCount > 0 && (
                    <span className="icon-badge" aria-hidden="true">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  className="settings-link"
                  onClick={() => setView('settings')}
                >
                  Settings
                </button>
              </div>
            </div>
            <div className="day-heading">
              <h1>{weekdayName(selectedDate)}</h1>
              {!isToday && (
                <button type="button" className="back-to-today" onClick={goToToday}>
                  Back to today
                </button>
              )}
            </div>

            {showCatchUp && (
              <CatchUp
                dateLabel={weekdayName(yesterday)}
                onMark={(tier) => markYesterday(tier)}
                onSkip={(reason) => markYesterday('skipped', reason)}
                onDismiss={() => setPref('catchUpDismissedFor', yesterday)}
              />
            )}

            {busy.offer && (
              <BusyNudge
                skips={busy.skips}
                suggestedBar={busy.suggestedBar}
                onAccept={acceptBusyNudge}
                onDismiss={dismissBusyNudge}
              />
            )}

            {showReasonNote && (
              <ReasonPatternNote
                reason={reasonNote.reason}
                count={reasonNote.count}
                onDismiss={dismissReasonNote}
              />
            )}

            <FriendNotifications
              friendships={friends.friendships}
              friendAcceptedSeenAt={prefs.friendAcceptedSeenAt}
              onRespond={friends.respond}
              onViewFriend={openFriendLog}
              onDismissAccepted={dismissAcceptedNotice}
            />

            <CheckIn
              day={day}
              isToday={isToday}
              reEntry={reEntry}
              dateLabel={weekdayName(selectedDate)}
              onTier={(tier) => setTier(selectedDate, tier)}
              onReason={(reason) => setReason(selectedDate, reason)}
              onReasonText={(text) => setReasonText(selectedDate, text)}
              onType={(type) => setType(selectedDate, type)}
              onNote={(note) => setNote(selectedDate, note)}
              onOpenLog={() => setView('log')}
            />

            {historyMode === 'week' ? (
              <WeeklyView
                week={week}
                weekOffset={weekOffset}
                onWeekChange={changeWeek}
                getDay={getDay}
                today={today}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                onErase={() => setTier(selectedDate, null)}
                bar={weeklyBar}
                onEditBar={() => setView('settings')}
                historyMode={historyMode}
                onHistoryMode={setHistoryMode}
              />
            ) : historyMode === 'month' ? (
              <MonthView
                getDay={getDay}
                today={today}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                weekStart={weekStart}
                historyMode={historyMode}
                onHistoryMode={setHistoryMode}
              />
            ) : (
              <SeasonView
                getDay={getDay}
                today={today}
                weekStart={weekStart}
                historyMode={historyMode}
                onHistoryMode={setHistoryMode}
              />
            )}
          </>
        ) : view === 'settings' ? (
          <Settings
            allData={allData}
            onImport={replaceAll}
            onClearAll={clearAllData}
            auth={auth}
            sync={sync}
            weeklyBar={weeklyBar}
            onWeeklyBar={(n) => setPref('weeklyBar', n)}
            weekStart={weekStart}
            onWeekStart={(w) => setPref('weekStart', w)}
            theme={prefs.theme === 'light' ? 'light' : 'dark'}
            onTheme={(t) => setPref('theme', t)}
            onBack={() => setView('home')}
          />
        ) : view === 'friends' ? (
          <FriendsScreen
            auth={auth}
            friends={friends}
            onViewFriend={openFriendLog}
            friendViewError={friendViewError}
            showSkipped={prefs.friendShowSkipped === true}
            onShowSkippedChange={(v) => setPref('friendShowSkipped', v)}
            onBack={() => setView('home')}
          />
        ) : view === 'notifications' ? (
          <NotificationsScreen
            friendships={friends.friendships}
            friendAcceptedSeenAt={prefs.friendAcceptedSeenAt}
            onRespond={friends.respond}
            onViewFriend={openFriendLog}
            onDismissAccepted={dismissAcceptedNotice}
            onBack={() => setView('home')}
          />
        ) : view === 'friend' && friendView ? (
          <FriendLog
            friend={friendView}
            today={today}
            weekStart={weekStart}
            onBack={() => setView(friendViewOrigin)}
          />
        ) : (
          <TrainingLog
            dateLabel={weekdayName(selectedDate)}
            exercises={day.exercises}
            freeform={day.freeform ?? ''}
            suggestions={exerciseNames}
            fillOptions={fillOptions}
            presets={presets}
            onSavePreset={savePreset}
            onDeletePreset={deletePreset}
            onChange={(exercises) => setExercises(selectedDate, exercises)}
            onFreeformChange={(text) => setFreeform(selectedDate, text)}
            onBack={() => setView('home')}
          />
        )}
      </main>
    </div>
  );
}
