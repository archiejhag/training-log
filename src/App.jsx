import { useState } from 'react';
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
import TrainingLog from './components/TrainingLog';

/* App owns:
   1. which view is on screen ('home' or the training-log detail screen)
   2. which day is being edited (selectedDate)
   3. which week the strip is showing (weekOffset: 0 = current, -1 = last, …)
   4. wiring the data hook to the components
   All persistence lives in useTrainingLog; all date maths in lib/date. */

export default function App() {
  const today = todayKey();
  const yesterday = yesterdayKey();
  const { getDay, setTier, setReason, setExercises, prefs, setPref } = useTrainingLog();

  const [view, setView] = useState('home'); // 'home' | 'log'
  const [selectedDate, setSelectedDate] = useState(today);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = this week, negative = past

  const week = weekKeysForOffset(weekOffset);
  const day = getDay(selectedDate);
  const isToday = selectedDate === today;

  const showCatchUp =
    getDay(yesterday).tier == null && prefs.catchUpDismissedFor !== yesterday;

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
      <main className="app">
        {view === 'home' ? (
          <>
            <p className="eyebrow">Training Log</p>
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

            <WeeklyView
              week={week}
              weekOffset={weekOffset}
              onWeekChange={changeWeek}
              getDay={getDay}
              today={today}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          </>
        ) : (
          <TrainingLog
            dateLabel={weekdayName(selectedDate)}
            exercises={day.exercises}
            onChange={(exercises) => setExercises(selectedDate, exercises)}
            onBack={() => setView('home')}
          />
        )}
      </main>
    </div>
  );
}
