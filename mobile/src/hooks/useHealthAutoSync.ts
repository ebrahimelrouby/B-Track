import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useHealthStore } from '@/store/health.store';
import { syncRecentHealthData } from '@/services/health/syncRecent';

const THROTTLE_MS = 15 * 60 * 1000;

export function useHealthAutoSync(enabled: boolean): void {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (!enabled) return;

    const maybeSync = () => {
      const { stepsAuthorized, lastSyncedAt, setLastSyncedAt } = useHealthStore.getState();
      if (!stepsAuthorized) return;
      if (lastSyncedAt && Date.now() - lastSyncedAt < THROTTLE_MS) return;
      setLastSyncedAt(Date.now());
      syncRecentHealthData().catch(() => {
        // Sync failures are silent — screens fall back to whatever was last
        // synced, and the next foreground/focus event retries.
      });
    };

    maybeSync();

    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (appState.current !== 'active' && next === 'active') maybeSync();
      appState.current = next;
    });

    return () => sub.remove();
  }, [enabled]);
}
