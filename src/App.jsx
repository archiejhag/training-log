import { useState } from 'react';
import './App.css';
import { useTrainingLog } from './hooks/useTrainingLog';
import { todayKey, yesterdayKey, weekKeys, weekdayName } from './lib/date';
import CatchUp from './components/CatchUp';
import CheckIn from './components/CheckIn';
import WeeklyView from './components/WeeklyView';
import TrainingLog from './components/TrainingLog';

/* App owns three things:
   1. which view is on screen ('home' or the training-log detail screen)
   2. which day is being edited (selectedDate — defaults to today, the strip
      can point it at any day this week)
   3. wiring the data hook to the components
   All persistence lives in useTrainingLog; all date maths in lib/date. */

export default function App() {
  const today = todayKey();
  const yesterday = yesterdayKey();
  const week = weekKeys();
  const { getDay, setTier, setReason, setExercises, prefs, setPref } = useTrainingLog();

  const [view, setView] = useState('home'); // 'home' | 'log'
  const [selectedDate, setSelectedDate] = useState(today);

  const day = getDay(selectedDate);
  const isToday = selectedDate === today;

  // Nudge to fill in yesterday — only while it's blank and not already
  // dismissed for this particular yesterday.
  const showCatchUp =
    getDay(yesterday).tier == null && prefs.catchUpDismissedFor !== yesterday;

  return (
    <div className="phone">
      <div className="app">
        {view === 'home' ? (
          <>
            <p className="eyebrow">Training Log</p>
            <div className="day-heading">
              <h1>{weekdayName(selectedDate)}</h1>
              {!isToday && (
                <button
                  type="button"
                  className="back-to-today"
                  onClick={() => setSelectedDate(today)}
                >
                  Back to today
                </button>
              )}
            </div>

            {showCatchUp && (
              <CatchUp
                dateLabel={weekdayName(yesterday)}
                onMark={(tier) => setTier(yesterday, tier)}
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
      </div>
    </div>
  );
}
