import { create } from "zustand";
import { Howl } from "howler";
import {
  type RadioState,
} from "../types/radio.t";
import {
  fetchStations,
  recordStationClick,
  searchStations as searchStationsApi,
  fetchGenres as fetchGenresApi,
} from "../services/radioApi";


export const useRadioStore = create<RadioState>((set, get) => ({
   // Initial state
   stations: [],
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
   selectedGenre: null,
   selectedMood: null,
   genres: [],
   isSearching: false,
   searchError: null,

  fetchAndSetStations: async (autoSelectFirst = false) => {
    set({ isLoadingStations: true, errorFetchingStations: null });
    try {
      const stations = await fetchStations(1000);
      console.log("Radio store stations:", stations.length);
      set({ stations, isLoadingStations: false });
      if (autoSelectFirst && stations.length > 0 && !get().currentStation) {
        get().selectStation(stations[0], 0);
      }
    } catch (error) {
      console.error("Error fetching stations in store:", error);
      set({
        errorFetchingStations: "Failed to fetch stations",
        isLoadingStations: false,
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

  selectStation: (station, index) => {
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
        set({ isLoading: false });
      },
      onloaderror: (_, err) => {
        console.error("Howler load error for station:", station.name, err);
        set({ isLoading: false, isPlaying: false });
        // Try to play next station or show error
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
  
  setSelectedGenre: (genre: string | null) => set({ selectedGenre: genre }),
  
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
        isSearching: false 
      });
    }
  },
  
  filterStations: () => {
    const { stations, searchQuery, selectedGenre, selectedMood } = get();
    
    let filtered = [...stations];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(station => 
        station.name.toLowerCase().includes(query) ||
        station.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    if (selectedGenre) {
      filtered = filtered.filter(station => 
        station.tags.includes(selectedGenre)
      );
    }
    
    if (selectedMood) {
      filtered = filtered.filter(station => 
        station.tags?.some(tag => 
          tag.toLowerCase().includes(selectedMood.toLowerCase())
        )
      );
    }
    
    set({ filteredStations: filtered });
  },
  
  fetchGenres: async () => {
    try {
      const genres = await fetchGenresApi();
      set({ genres });
    } catch (error) {
      console.error("Error fetching genres:", error);
    }
  },
}));
