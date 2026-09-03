import { useState, useEffect, useMemo } from 'react';
import './App.css';
import { useTrainingLog } from './hooks/useTrainingLog';
import {
  todayKey,
  yesterdayKey,
  weekKeysForOffset,
  weekdayIndex,
  weekdayName,
} from './lib/date';
import CatchUp from './components/CatchUp';
import CheckIn from './components/CheckIn';
import WeeklyView from './components/WeeklyView';
import MonthView from './components/MonthView';
import TrainingLog from './components/TrainingLog';
import Settings from './components/Settings';

/* App owns:
   1. which view is on screen ('home' or the training-log detail screen)
   2. which day is being edited (selectedDate)
   3. which week the strip is showing (weekOffset: 0 = current, -1 = last, …)
   4. wiring the data hook to the components
   All persistence lives in useTrainingLog; all date maths in lib/date. */

export default function App() {
  const today = todayKey();
  const yesterday = yesterdayKey();
  const { getDay, setTier, setReason, setExercises, prefs, setPref, allData, replaceAll } =
    useTrainingLog();

  const [view, setView] = useState('home'); // 'home' | 'log' | 'settings'
  const [selectedDate, setSelectedDate] = useState(today);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = this week, negative = past
  const [historyMode, setHistoryMode] = useState('week'); // 'week' | 'month'

  const week = weekKeysForOffset(weekOffset);
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
    const nextWeek = weekKeysForOffset(next);
    setSelectedDate(next === 0 ? today : nextWeek[weekdayIndex(selectedDate)]);
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
        {view === 'home' ? (
          <>
            <div className="app-top">
              <p className="eyebrow">Training Log</p>
              <button
                type="button"
                className="settings-link"
                onClick={() => setView('settings')}
              >
                Settings
              </button>
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

            <CheckIn
              day={day}
              isToday={isToday}
              dateLabel={weekdayName(selectedDate)}
              onTier={(tier) => setTier(selectedDate, tier)}
              onReason={(reason) => setReason(selectedDate, reason)}
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
                historyMode={historyMode}
                onHistoryMode={setHistoryMode}
              />
            ) : (
              <MonthView
                getDay={getDay}
                today={today}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                historyMode={historyMode}
                onHistoryMode={setHistoryMode}
              />
            )}
          </>
        ) : view === 'settings' ? (
          <Settings
            allData={allData}
            onImport={replaceAll}
            theme={prefs.theme === 'light' ? 'light' : 'dark'}
            onTheme={(t) => setPref('theme', t)}
            onBack={() => setView('home')}
          />
        ) : (
          <TrainingLog
            dateLabel={weekdayName(selectedDate)}
            exercises={day.exercises}
            suggestions={exerciseNames}
            onChange={(exercises) => setExercises(selectedDate, exercises)}
            onBack={() => setView('home')}
          />
        )}
      </main>
    </div>
  );
}
