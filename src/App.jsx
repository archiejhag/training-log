import { useState } from 'react';
import './App.css';
import { useTrainingLog } from './hooks/useTrainingLog';
import { todayKey, weekKeys, weekdayName } from './lib/date';
import CheckIn from './components/CheckIn';
import WeeklyView from './components/WeeklyView';
import TrainingLog from './components/TrainingLog';

/* App owns two things:
   1. which view is on screen ('home' or the training-log detail screen)
   2. wiring the data hook to the components
   All persistence lives in useTrainingLog; all date maths in lib/date. */

export default function App() {
  const today = todayKey();
  const week = weekKeys();
  const { getDay, setTier, setReason, setExercises } = useTrainingLog();

  const [view, setView] = useState('home'); // 'home' | 'log'
  const day = getDay(today);

  return (
    <div className="phone">
      <div className="app">
        {view === 'home' ? (
          <>
            <p className="eyebrow">Training Log</p>
            <h1>{weekdayName(today)}</h1>

            <CheckIn
              day={day}
              onTier={(tier) => setTier(today, tier)}
              onReason={(reason) => setReason(today, reason)}
              onOpenLog={() => setView('log')}
            />

            <WeeklyView week={week} getDay={getDay} today={today} />
          </>
        ) : (
          <TrainingLog
            dateLabel={weekdayName(today)}
            exercises={day.exercises}
            onChange={(exercises) => setExercises(today, exercises)}
            onBack={() => setView('home')}
          />
        )}
      </div>
    </div>
  );
}
