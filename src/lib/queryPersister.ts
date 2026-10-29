import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { get, set, del } from "idb-keyval";

// Menyimpan salinan data bacaan di perangkat (IndexedDB) agar tetap bisa
// dibaca ketika internet terputus. Data tetap disinkronkan saat online.
export const queryPersister = createAsyncStoragePersister({
  key: "tahsin-offline-cache",
  storage: {
    getItem: async (k) => (await get<string>(k)) ?? null,
    setItem: (k, v) => set(k, v),
    removeItem: (k) => del(k),
  },
  throttleTime: 2000,
});

export const OFFLINE_CACHE_MAX_AGE = 24 * 60 * 60 * 1000;
