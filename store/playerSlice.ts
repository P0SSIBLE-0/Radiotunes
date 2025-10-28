// src/store/playerSlice.ts
import type { StateCreator } from "zustand";
import type { RadioState, PlayerSlice } from "../types/radio.t";
import { Howl } from "howler";
import { recordStationClick } from "@/services/radioApi";
import { searchStations as searchStationsApi } from "@/services/radioApi";

export const createPlayerSlice: StateCreator<
  RadioState,
  [],
  [],
  PlayerSlice
> = (set, get) => ({
  currentStation: null,
  currentStationIndex: null,
  isPlaying: false,
  isLoading: false,
  isSearching: false,
  errorFetchingStations: null,
  filteredStations: [],
  initialStationId: null,
  setInitialStationId: (stationId: string | null) => {
    set({ initialStationId: stationId });
  },
  searchStations: async (query: string) => {
    set({ isSearching: true });
    try {
      const stations = await searchStationsApi(query);
      set({ filteredStations: stations, isSearching: false });
    } catch (error) {
      console.error("Error searching stations:", error);
      set({
        isSearching: false,
      });
    }
  },
  currentSound: null,
  volume: 0.5,

  cleanupCurrentSound: () => {
    get().currentSound?.unload();
    set({ currentSound: null, isPlaying: false });
  },

  selectStation: (station, index) => {
    get().cleanupCurrentSound();
    const newSound = new Howl({
      src: [station.url_resolved || station.url],
      html5: true,
      format: ["mp3", "aac", "ogg", "mpeg"],
      volume: get().volume,
      onload: () => set({ isLoading: false }),
      onplay: () => set({ isPlaying: true, isLoading: false }),
      onpause: () => set({ isPlaying: false }),
      onstop: () => set({ isPlaying: false }),
      onloaderror: (_, err) => {
        console.error("Howler load error for station:", station.name, err);
        set({
          isLoading: false,
          isPlaying: false,
          errorFetchingStations: "Failed to load station",
        });
      },
    });
    set({
      currentStation: station,
      currentStationIndex: index,
      currentSound: newSound,
    });
    recordStationClick(station.stationuuid);
  },
  setVolume: (volume: number) => {
    set({ volume });
    get().currentSound?.volume(volume);
  },

  play: async () => {
    if (!get().currentSound) return;
    set({ isLoading: true , errorFetchingStations:null});
    await get().currentSound?.play();
    
  },

  pause: () => {
    get().currentSound?.pause();
    set({isPlaying:false})
  },

  togglePlayPause: () => {
    get().isPlaying ? get().pause() : get().play();
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

  playRandomStation: () => {
    const { stationsOnMap, currentStation } = get();
    if (stationsOnMap.length === 0) return;
    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * stationsOnMap.length);
    } while (
      stationsOnMap.length > 1 &&
      stationsOnMap[randomIndex].stationuuid === currentStation?.stationuuid
    );
    get().selectStation(stationsOnMap[randomIndex], randomIndex);
    setTimeout(() => get().play(), 100);
  },
});
