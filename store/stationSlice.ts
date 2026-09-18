import type { StateCreator } from "zustand";
import type { Mood, RadioState, Station } from "@/types/radio.t.ts";
import { getCachedStations, setCachedStations } from "@/utils/cache";
import { stationMatchesMood } from "@/utils/moods";
import {
  fetchStations,
  fetchGenres as fetchGenresApi,
} from "@/services/radioApi";
import type { StationSlice } from "@/types/radio.t.ts";

type SliceSet = Parameters<
  StateCreator<RadioState, [], [], StationSlice>
>[0];
type SliceGet = Parameters<
  StateCreator<RadioState, [], [], StationSlice>
>[1];

// Single place where stationsOnMap is derived: genre filter first,
// then mood filter. Genre and mood are mutually exclusive (selecting one
// clears the other), so in practice only one applies at a time.
const applyFilters = (get: SliceGet, set: SliceSet) => {
  const { stations, selectedGenre, selectedMood, favoriteStationIds } = get();

  let filtered = stations;
  if (selectedGenre === "Favorites") {
    filtered = filtered.filter((station) =>
      favoriteStationIds.includes(station.stationuuid)
    );
  } else if (selectedGenre && selectedGenre !== "All") {
    const genreToFilter = selectedGenre.toLowerCase();
    filtered = filtered.filter((station) =>
      station.tags.some((tag) => tag.toLowerCase() === genreToFilter)
    );
  }
  if (selectedMood) {
    filtered = filtered.filter((station) =>
      stationMatchesMood(station, selectedMood)
    );
  }
  set({ stationsOnMap: filtered });
};

export const createStationSlice: StateCreator<
  RadioState,
  [],
  [],
  StationSlice
> = (set, get) => ({
  stations: [],
  stationsOnMap: [],
  isLoadingStations: false,
  errorFetchingStations: null,
  genres: [],
  selectedGenre: "All",
  selectedMood: null,
  allStationsLoaded: false,

  fetchAndSetStations: async (autoSelectFirst = false) => {
    // If we're already fetching in the background or have loaded everything, don't start again.
    if (get().isLoadingStations || get().allStationsLoaded) return;
    const selectInitialStation = (stations: Station[]) => {
      const initialId = get().initialStationId;
      if (initialId) {
        const stationToSelect = stations.find(
          (s) => s.stationuuid === initialId
        );
        if (stationToSelect) {
          const stationIndex = stations.indexOf(stationToSelect);
          console.log(`Auto-selecting shared station: ${stationToSelect.name}`);
          get().selectStation(stationToSelect, stationIndex);
          // Clear the initial ID so it doesn't get re-selected on a filter change
          get().setInitialStationId(null);
          return true; // Indicate that a station was selected
        }
      }
      return false; // No initial station was selected
    };
    const cachedStations = await getCachedStations();
    if (cachedStations) {
      console.log(
        `Loading ${cachedStations.length} stations directly from cache.`
      );
      set({
        stations: cachedStations,
        stationsOnMap: cachedStations,
        isLoadingStations: false,
        allStationsLoaded: true,
      });
      if (!selectInitialStation(cachedStations) &&
        autoSelectFirst &&
        cachedStations.length > 0 &&
        !get().currentStation
      ) {
        get().selectStation(cachedStations[0], 0);
      }
      return;
    }

    // Only show the main "Loading Map..." screen if it's the very first fetch.
    if (get().stations.length === 0) {
      set({ isLoadingStations: true, errorFetchingStations: null });
    }

    const CHUNK_SIZE = 1000;
    let isFirstChunk = get().stations.length === 0;
    set({ selectedGenre: "All" });

    try {
      // Loop to fetch stations in chunks until the API returns an empty/small chunk
      while (true) {
        const currentOffset = get().stations.length;
        const chunk = await fetchStations(CHUNK_SIZE, currentOffset);

        // Append the new chunk to the existing station list
        set((state) => ({
          stations: [...state.stations, ...chunk],
          stationsOnMap: [...state.stationsOnMap, ...chunk],
        }));

        // If this was the very first chunk, update the main loading state and auto-select a station
        if (isFirstChunk) {
          set({ isLoadingStations: false });
          if (autoSelectFirst && chunk.length > 0 && !get().currentStation) {
            get().selectStation(chunk[0], 0);
          }
          isFirstChunk = false;
        }

        // If the returned chunk is smaller than requested, we've reached the end
        if (chunk.length < CHUNK_SIZE) {
          set({ allStationsLoaded: true });
          console.log(`All stations loaded. Total: ${get().stations.length}`);
          await setCachedStations(get().stations);
          if (!selectInitialStation(get().stations) && autoSelectFirst && !get().currentStation) {
            get().selectStation(get().stations[0], 0);
          }
          break;
        }

        // Small delay to be polite to the API
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    } catch (error) {
      console.error("Error during incremental fetch:", error);
      set({
        errorFetchingStations: "Failed to fetch stations",
        isLoadingStations: false,
        allStationsLoaded: true, // Stop trying on error
      });
    }
  },

  fetchGenres: async () => {
    const genres = await fetchGenresApi();
    set({ genres: ["All", "Favorites", ...genres] });
  },

  setSelectedGenre: (genre: string | null) => {
    // Genre and mood are mutually exclusive filters.
    set({ selectedGenre: genre, selectedMood: null });
    get().filterStationsByGenre();
  },

  setSelectedMood: (mood: Mood | null) => {
    // Genre and mood are mutually exclusive filters.
    set({ selectedMood: mood, selectedGenre: "All" });
    get().filterStationsByGenre();
  },

  filterStationsByGenre: () => {
    applyFilters(get, set);
  },
});
