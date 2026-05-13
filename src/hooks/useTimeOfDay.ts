import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export type TimePeriod = 'morning' | 'afternoon' | 'evening';

const PERIOD_ORDER: TimePeriod[] = ['morning', 'afternoon', 'evening'];

function getPeriodFromHour(hour: number): TimePeriod {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  return 'evening';
}

function getPeriodDisplayName(period: TimePeriod): string {
  switch (period) {
    case 'morning': return 'Morning';
    case 'afternoon': return 'Afternoon';
    case 'evening': return 'Evening';
  }
}

function getNextPeriod(period: TimePeriod): TimePeriod | null {
  const idx = PERIOD_ORDER.indexOf(period);
  return idx < PERIOD_ORDER.length - 1 ? PERIOD_ORDER[idx + 1] : null;
}

function getPreviousPeriod(period: TimePeriod): TimePeriod | null {
  const idx = PERIOD_ORDER.indexOf(period);
  return idx > 0 ? PERIOD_ORDER[idx - 1] : null;
}

export const PERIOD_DISPLAY: Record<TimePeriod, {
  title: string;
  emoji: string;
  subtitle: string;
}> = {
  morning: {
    title: 'Morning Briefing',
    emoji: '☀️',
    subtitle: 'Start the day right',
  },
  afternoon: {
    title: 'Afternoon Briefing',
    emoji: '🌤',
    subtitle: 'Midday check-in',
  },
  evening: {
    title: 'Evening Briefing',
    emoji: '🌙',
    subtitle: 'Wind down for the night',
  },
};

export function useTimeOfDay() {
  const [searchParams] = useSearchParams();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const override = searchParams.get('tod') as TimePeriod | null;
  const hour = now.getHours();
  const currentPeriod = override && PERIOD_ORDER.includes(override) ? override : getPeriodFromHour(hour);

  return {
    currentPeriod,
    periodName: getPeriodDisplayName(currentPeriod),
    nextPeriod: getNextPeriod(currentPeriod),
    previousPeriod: getPreviousPeriod(currentPeriod),
    display: PERIOD_DISPLAY[currentPeriod],
    isLastPeriod: getNextPeriod(currentPeriod) === null,
    hour,
  };
}
