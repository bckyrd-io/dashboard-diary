import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from './AuthContext';
import { setSyncUser } from '../services/api';
import { initOfflineDb, isOfflineDbAvailable } from '../services/offline/db';
import { isOnline, subscribeNetwork } from '../services/offline/network';
import {
  clearOfflineData,
  offlineStorageReady,
} from '../services/offline/repository';
import {
  fullSync,
  getSyncStatus,
  retryFailedChanges,
  type SyncResult,
} from '../services/offline/sync';
import { Theme } from '../constants/Theme';

interface OfflineContextValue {
  online: boolean;
  syncing: boolean;
  pending: number;
  failed: number;
  lastSyncedAt: string | null;
  syncNow: () => Promise<SyncResult & { pulled: boolean }>;
  refreshStatus: () => Promise<void>;
  retryFailed: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextValue | null>(null);

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [online, setOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [pending, setPending] = useState(0);
  const [failed, setFailed] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const userRef = useRef(user);

  userRef.current = user;

  const refreshStatus = useCallback(async () => {
    if (!offlineStorageReady()) return;
    try {
      const status = await getSyncStatus();
      setPending(status.pending);
      setFailed(status.failed);
      setLastSyncedAt(status.lastSyncedAt);
    } catch {
      // Ignore status errors; they should never break the UI.
    }
  }, []);

  const syncNow = useCallback(async () => {
    const current = userRef.current;
    if (!current || !offlineStorageReady()) {
      return { sent: 0, failed: 0, pulled: false };
    }

    setSyncing(true);
    try {
      const result = await fullSync({ id: current.id, role: current.role });
      await refreshStatus();
      return result;
    } finally {
      setSyncing(false);
    }
  }, [refreshStatus]);

  const retryFailed = useCallback(async () => {
    if (!offlineStorageReady()) return;
    await retryFailedChanges();
    await syncNow();
  }, [syncNow]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (isOfflineDbAvailable()) {
        await initOfflineDb().catch(() => undefined);
      }
      const connected = await isOnline();
      if (mounted) setOnline(connected);
      await refreshStatus();
    })();

    const unsubscribe = subscribeNetwork((value) => {
      setOnline(value);
      if (value && userRef.current) {
        syncNow().catch(() => undefined);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [refreshStatus, syncNow]);

  useEffect(() => {
    if (loading) return;

    let cancelled = false;

    (async () => {
      if (!user) {
        setSyncUser(null);
        if (isOfflineDbAvailable()) {
          await clearOfflineData().catch(() => undefined);
        }
        if (!cancelled) {
          setPending(0);
          setFailed(0);
          setLastSyncedAt(null);
        }
        return;
      }

      setSyncUser({ id: user.id, role: user.role });
      if (isOfflineDbAvailable()) {
        await initOfflineDb().catch(() => undefined);
      }
      await syncNow().catch(() => undefined);
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.role, loading, syncNow]);

  const showPending = online && pending > 0 && !syncing;
  const showFailed = online && failed > 0 && !syncing;
  const bannerText = !online
    ? 'Offline — changes will sync when you reconnect'
    : showFailed
      ? `${failed} change${failed === 1 ? '' : 's'} failed to sync — open Settings to retry`
      : showPending
        ? `Syncing ${pending} change${pending === 1 ? '' : 's'}…`
        : null;

  return (
    <OfflineContext.Provider
      value={{
        online,
        syncing,
        pending,
        failed,
        lastSyncedAt,
        syncNow,
        refreshStatus,
        retryFailed,
      }}
    >
      <View style={styles.container}>
        {children}
        {bannerText ? (
          <View style={styles.banner} pointerEvents="none">
            <Text style={styles.bannerText}>{bannerText}</Text>
          </View>
        ) : null}
      </View>
    </OfflineContext.Provider>
  );
}

export function useOffline() {
  const ctx = useContext(OfflineContext);
  if (!ctx) throw new Error('useOffline must be used inside OfflineProvider');
  return ctx;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  banner: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    borderRadius: Theme.radius,
    backgroundColor: Theme.foreground,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  bannerText: { color: Theme.background, fontSize: 12, fontWeight: '600', textAlign: 'center' },
});
