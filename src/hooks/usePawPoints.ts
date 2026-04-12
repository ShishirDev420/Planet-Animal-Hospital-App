import { useState, useEffect } from 'react';

interface PawPointsState {
  verifiedPoints: number;
  pendingPoints: number;
  pendingActions: string[];
}

export function usePawPoints() {
  const [state, setState] = useState<PawPointsState>(() => {
    const saved = localStorage.getItem('pawPointsState');
    if (saved) {
      return JSON.parse(saved);
    }
    // Migrate old state if exists
    const oldSaved = localStorage.getItem('pawPoints');
    if (oldSaved) {
      return { verifiedPoints: parseInt(oldSaved, 10), pendingPoints: 0, pendingActions: [] };
    }
    return { verifiedPoints: 4450, pendingPoints: 0, pendingActions: [] };
  });

  useEffect(() => {
    localStorage.setItem('pawPointsState', JSON.stringify(state));
  }, [state]);

  const addPoints = (amount: number, actionId: string) => {
    setState(prev => ({
      ...prev,
      pendingPoints: prev.pendingPoints + amount,
      pendingActions: [...prev.pendingActions, actionId]
    }));
  };

  return { ...state, addPoints };
}
