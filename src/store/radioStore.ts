import { create } from "zustand";
import { Howl } from "howler";
import { type RadioState, type Station } from "../types/radio.t";
import {
  fetchStations,
  recordStationClick,
  searchStations as searchStationsApi,
  fetchGenres as fetchGenresApi,
} from "../services/radioApi";

export const useRadioStore = create<RadioState>((set, get) => ({
  // Initial state
  stations: [],
  stationsOnMap: [],
  filteredStations: [],
  currentStation: null,
  currentStationIndex: null,
  isPlaying: false,
  volume: 0.5,
  isLoadingStations: false,
  errorFetchingStations: null,
  currentSound: null,
  isLoading: false,
  searchQuery: "",
  selectedMood: null,
  genres: [],
  isSearching: false,
  error: { message: "", isError: false },
  searchError: null,
  allStationsLoaded: false,
  preMuteVolume: 0.5, // To store volume before muting
  selectedGenre: "All", // A trigger to tell the map to locate a station
  locateStationTrigger: 0,

  fetchAndSetStations: async (autoSelectFirst = false) => {
    // If we're already fetching in the background or have loaded everything, don't start again.
    if (get().isLoadingStations || get().allStationsLoaded) return;

    // Only show the main "Loading Map..." screen if it's the very first fetch.
    if (get().stations.length === 0) {
      set({ isLoadingStations: true, errorFetchingStations: null });
    }

    const CHUNK_SIZE = 500;
    let isFirstChunk = get().stations.length === 0;

    try {
      // Loop to fetch stations in chunks until the API returns an empty/small chunk
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const currentOffset = get().stations.length;
        const chunk = await fetchStations(CHUNK_SIZE, currentOffset);

        // Append the new chunk to the existing station list
        set((state) => ({
          stations: [...state.stations, ...chunk],
          stationsOnMap: [...state.stationsOnMap, ...chunk],
        }));
        set({ selectedGenre: "All" });

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

  cleanupCurrentSound: () => {
    const { currentSound } = get();
    if (currentSound) {
      try {
        currentSound.stop();
        currentSound.unload();
      } catch (error) {
        console.error("Error cleaning up sound:", error);
      }
    }
    set({ currentSound: null, isPlaying: false });
  },

  selectStation: (station: Station, index: number) => {
    console.log(
      "Selecting station:",
      station.name,
      station.url_resolved || station.url
    );

    // Cleanup previous sound
    get().cleanupCurrentSound();

    // Create new Howl instance
    const audioUrl = station.url_resolved || station.url;

    if (!audioUrl) {
      console.error("No valid audio URL provided for station:", station.name);
      set({ isLoading: false, isPlaying: false });
      return;
    }

    const newSound = new Howl({
      src: [audioUrl],
      html5: true,
      format: ["mp3", "aac", "ogg", "mpeg"], // Common radio stream formats
      volume: get().volume,
      preload: false, // Don't preload for streaming
      onload: () => {
        console.log("Audio loaded successfully");
        set({ isLoading: false, errorFetchingStations: null });
      },
      onloaderror: (_, err) => {
        console.error("Howler load error for station:", station.name, err);
        set({
          isLoading: false,
          isPlaying: false,
          errorFetchingStations: "Failed to load station",
        });
      },
      onplay: () => {
        console.log("Audio started playing");
        set({ isPlaying: true, isLoading: false });
      },
      onpause: () => {
        console.log("Audio paused");
        set({ isPlaying: false });
      },
      onstop: () => {
        console.log("Audio stopped");
        set({ isPlaying: false });
      },
      onplayerror: (_, err) => {
        console.error("Howler play error for station:", station.name, err);
        set({ isPlaying: false, isLoading: false });

        // Try alternative URL if available
        if (station.url && station.url !== audioUrl) {
          console.log("Trying alternative URL...");
          const altSound = new Howl({
            src: [station.url],
            html5: true,
            format: ["mp3", "aac", "ogg", "mpeg"],
            volume: get().volume,
            onplay: () => set({ isPlaying: true }),
            onpause: () => set({ isPlaying: false }),
            onstop: () => set({ isPlaying: false }),
          });
          set({ currentSound: altSound });
          altSound.play();
        }
      },
      onend: () => {
        console.log("Audio ended");
        set({ isPlaying: false });
      },
    });

    // Update state
    set({
      currentStation: station,
      currentStationIndex: index,
      currentSound: newSound,
      isPlaying: false,
      isLoading: false,
    });

    // Record the click
    try {
      recordStationClick(station.stationuuid);
    } catch (error) {
      console.error("Error recording station click:", error);
    }
  },

  play: async () => {
    const { currentSound, isPlaying, currentStation } = get();

    if (!currentSound) {
      return;
    }

    if (!isPlaying) {
      console.log("Starting playback for:", currentStation?.name);
      set({ isLoading: true });

      try {
        await currentSound.play();
        set({ errorFetchingStations: null });
      } catch (error) {
        console.error("Error starting playback:", error);
        set({ isLoading: false, isPlaying: false });
      }
    }
  },

  pause: () => {
    const { currentSound, isPlaying } = get();
    if (currentSound && isPlaying) {
      console.log("Pausing playback");
      currentSound.pause();
    }
  },

  togglePlayPause: () => {
    const { isPlaying } = get();
    if (isPlaying) {
      get().pause();
    } else {
      get().play();
    }
  },

  setVolume: (volume) => {
    const { currentSound } = get();
    const newVolume = Math.max(0, Math.min(1, volume));

    if (currentSound) {
      currentSound.volume(newVolume);
    }

    set({ volume: newVolume });
  },

  playNextStation: () => {
    const { stations, currentStationIndex } = get();
    if (stations.length > 0 && currentStationIndex !== null) {
      const nextIndex = (currentStationIndex + 1) % stations.length;
      get().selectStation(stations[nextIndex], nextIndex);
      setTimeout(() => get().play(), 100);
      set({ errorFetchingStations: null });
    }
  },

  playPreviousStation: () => {
    const { stations, currentStationIndex } = get();
    if (stations.length > 0 && currentStationIndex !== null) {
      const prevIndex =
        (currentStationIndex - 1 + stations.length) % stations.length;
      get().selectStation(stations[prevIndex], prevIndex);
      setTimeout(() => get().play(), 100);
    }
    set({ errorFetchingStations: null });
  },

  playRandomStation: () => {
    const { stations, currentStation } = get();
    if (stations.length === 0) return;

    let randomIndex;
    let randomStation;

    if (stations.length === 1) {
      randomStation = stations[0];
      randomIndex = 0;
    } else {
      do {
        randomIndex = Math.floor(Math.random() * stations.length);
        randomStation = stations[randomIndex];
      } while (
        currentStation &&
        randomStation.stationuuid === currentStation.stationuuid &&
        stations.length > 1
      );
    }

    get().selectStation(randomStation, randomIndex);
    setTimeout(() => get().play(), 100);
  },

  setSearchQuery: (query: string) => set({ searchQuery: query }),

  setSelectedGenre: (genre: string | null) => {
    set({ selectedGenre: genre });

    get().filterStationsByGenre(); // Re-filter the map stations when genre changes
  },

  setSelectedMood: (mood: string | null) => set({ selectedMood: mood }),

  searchStations: async (query: string) => {
    set({ isSearching: true, searchError: null });
    try {
      const stations = await searchStationsApi(query);
      set({ filteredStations: stations, isSearching: false });
    } catch (error) {
      console.error("Error searching stations:", error);
      set({
        searchError: "Failed to search stations",
        isSearching: false,
      });
    }
  },

  filterStations: () => {
    const { stations, searchQuery, selectedGenre, selectedMood } = get();

    let filtered = [...stations];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (station) =>
          station.name.toLowerCase().includes(query) ||
          station.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    if (selectedGenre) {
      filtered = filtered.filter((station) =>
        station.tags.includes(selectedGenre)
      );
    }

    if (selectedMood) {
      filtered = filtered.filter((station) =>
        station.tags?.some((tag) =>
          tag.toLowerCase().includes(selectedMood.toLowerCase())
        )
      );
    }

    set({ filteredStations: filtered });
  },

  fetchGenres: async () => {
    try {
      const genres = await fetchGenresApi();
      set({ genres: ["All", ...genres] });
    } catch (error) {
      console.error("Error fetching genres:", error);
    }
  },
  filterStationsByGenre: () => {
    const { stations, selectedGenre } = get();

    // If "All" is selected or no genre is chosen, show all stations
    if (!selectedGenre || selectedGenre === "All") {
      set({ stationsOnMap: stations });
      return;
    }
    const genreToFilter = selectedGenre.toLowerCase();

    const filtered = stations.filter((station) =>
      station.tags.some((tag) => tag.toLowerCase() === genreToFilter)
    );

    set({ stationsOnMap: filtered });
  },
  locateCurrentStation: () => {
    set((state) => ({ locateStationTrigger: state.locateStationTrigger + 1 }));
  },
}));
