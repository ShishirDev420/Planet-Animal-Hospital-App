import { useState, useCallback, useEffect } from 'react';
import type { TimePeriod } from './useTimeOfDay';

const PERIOD_ORDER: TimePeriod[] = ['morning', 'afternoon', 'evening'];

function getStorageKey(uid: string): string {
  const today = new Date().toDateString();
  return `briefing_checkins_${uid}_${today}`;
}

function loadCompleted(uid: string): TimePeriod[] {
  try {
    const raw = localStorage.getItem(getStorageKey(uid));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((p): p is TimePeriod => PERIOD_ORDER.includes(p));
    return [];
  } catch {
    return [];
  }
}

function saveCompleted(uid: string, periods: TimePeriod[]) {
  localStorage.setItem(getStorageKey(uid), JSON.stringify(periods));
}

export function useCheckInStatus(uid: string, currentPeriod: TimePeriod) {
  const [completedPeriods, setCompletedPeriods] = useState<TimePeriod[]>(() => loadCompleted(uid));

  useEffect(() => {
    setCompletedPeriods(loadCompleted(uid));
  }, [uid]);

  const isPeriodComplete = useCallback((period: TimePeriod) => {
    return completedPeriods.includes(period);
  }, [completedPeriods]);

  const completePeriod = useCallback((period: TimePeriod) => {
    setCompletedPeriods(prev => {
      if (prev.includes(period)) return prev;
      const next = [...prev, period];
      saveCompleted(uid, next);
      return next;
    });
  }, [uid]);

  const periodIndex = PERIOD_ORDER.indexOf(currentPeriod);
  const completedUpTo = PERIOD_ORDER.filter(p => completedPeriods.includes(p));
  const allCurrentAndPriorComplete = PERIOD_ORDER
    .filter((_, i) => i <= periodIndex)
    .every(p => completedPeriods.includes(p));

  const currentIncompletePeriod: TimePeriod | null = (() => {
    for (const p of PERIOD_ORDER) {
      if (!completedPeriods.includes(p)) return p;
    }
    return null;
  })();

  const allComplete = PERIOD_ORDER.every(p => completedPeriods.includes(p));

  const progressPercent = Math.round((completedPeriods.length / PERIOD_ORDER.length) * 100);

  return {
    completedPeriods,
    isPeriodComplete,
    completePeriod,
    currentIncompletePeriod,
    allComplete,
    allCurrentAndPriorComplete,
    progressPercent,
    totalPeriods: PERIOD_ORDER.length,
    completedCount: completedPeriods.length,
  };
}
