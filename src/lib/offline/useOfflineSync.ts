"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { processOfflineQueue, offlineDb } from "./db";

function subscribeOnline(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getOnlineSnapshot(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

function getOnlineServerSnapshot(): boolean {
  return true;
}

export function useOfflineSync() {
  const isOnline = useSyncExternalStore(subscribeOnline, getOnlineSnapshot, getOnlineServerSnapshot);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const pendingCount = useLiveQuery(
    async () => {
      if (!offlineDb) return 0;
      return offlineDb.offlineQueue.where("status").equals("PENDING").count();
    },
    [],
    0
  );

  const syncNow = useCallback(async () => {
    if (!isOnline || isSyncing) return;
    setIsSyncing(true);
    try {
      await processOfflineQueue();
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing]);

  useEffect(() => {
    function handleOnline() {
      syncNow();
    }
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [syncNow]);

  return { isOnline, isSyncing, pendingCount: pendingCount ?? 0, syncNow };
}


