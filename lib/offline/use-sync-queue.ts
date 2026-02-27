"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getQueueCount } from "@/lib/offline/db";
import { syncQueuedExpenses, type SyncResult } from "@/lib/offline/sync";

export function useSyncQueue() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [queuedCount, setQueuedCount] = useState(0);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);

  const refreshQueueCount = useCallback(async () => {
    const count = await getQueueCount();
    setQueuedCount(count);
  }, []);

  const runSync = useCallback(async () => {
    setIsSyncing(true);
    const result = await syncQueuedExpenses();
    setLastSyncResult(result);
    await refreshQueueCount();
    setIsSyncing(false);
  }, [refreshQueueCount]);

  useEffect(() => {
    setIsOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    void refreshQueueCount();

    const onOnline = () => {
      setIsOnline(true);
      void runSync();
    };

    const onOffline = () => {
      setIsOnline(false);
    };

    const onServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type === "SYNC_NOW") {
        void runSync();
      }
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    navigator.serviceWorker?.addEventListener("message", onServiceWorkerMessage);

    const periodicCountRefresh = window.setInterval(() => {
      void refreshQueueCount();
    }, 4000);

    const periodicSync = window.setInterval(() => {
      if (navigator.onLine) {
        void runSync();
      }
    }, 15000);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      navigator.serviceWorker?.removeEventListener("message", onServiceWorkerMessage);
      window.clearInterval(periodicCountRefresh);
      window.clearInterval(periodicSync);
    };
  }, [refreshQueueCount, runSync]);

  const statusLabel = useMemo(() => {
    if (!isOnline) {
      return "Offline mode active";
    }
    if (isSyncing) {
      return "Syncing queued expenses";
    }
    if (lastSyncResult && lastSyncResult.synced > 0 && lastSyncResult.failed === 0) {
      return `Synced ${lastSyncResult.synced} expense(s)`;
    }
    return "Online";
  }, [isOnline, isSyncing, lastSyncResult]);

  return {
    isOnline,
    isSyncing,
    queuedCount,
    statusLabel,
    runSync,
    refreshQueueCount
  };
}
