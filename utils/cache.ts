
import { get, set, del } from 'idb-keyval';
import type { Station } from '../types/radio.t';

// Define constants for keys and cache duration for clarity and easy modification.
const STATIONS_KEY = 'stations-data';
const TIMESTAMP_KEY = 'stations-timestamp';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export const setCachedStations = async (stations: Station[]): Promise<void> => {
  try {
    await set(STATIONS_KEY, stations);
    await set(TIMESTAMP_KEY, Date.now());
    console.log(`Successfully cached ${stations.length} stations in IndexedDB.`);
  } catch (error) {
    console.error("Error writing to IndexedDB cache:", error);
  }
};

export const getCachedStations = async (): Promise<Station[] | null> => {
  try {
    const timestamp = await get<number>(TIMESTAMP_KEY);

    if (!timestamp) {
      return null;
    }
    if (Date.now() - timestamp > CACHE_DURATION) {
      console.log("IndexedDB cache has expired. Clearing stale data.");
      // Clean up the expired data.
      await del(STATIONS_KEY);
      await del(TIMESTAMP_KEY);
      return null;
    }
    console.log("Found valid cache in IndexedDB.");
    const stations = await get<Station[]>(STATIONS_KEY);
    if (!stations) {
      return null;
    }
    return stations;
  } catch (error) {
    console.error("Error reading from IndexedDB cache:", error);
    return null;
  }
};