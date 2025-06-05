// src/types/radio.t.ts
import { Howl } from 'howler';
import type { StationResponse } from "radio-browser-api";

export interface RadioState {
  // Station state
  stations: StationResponse[];
  filteredStations: StationResponse[];
  currentStation: StationResponse | null;
  currentStationIndex: number | null;
  
  // Audio state
  isPlaying: boolean;
  volume: number;
  currentSound: Howl | null;
  isLoading: boolean;
  
  // Loading states
  isLoadingStations: boolean;
  isSearching: boolean;
  
  // Error states
  errorFetchingStations: string | null;
  searchError: string | null;
  
  // Filtering state
  searchQuery: string;
  selectedGenre: string | null;
  selectedMood: string | null;
  genres: string[];

  // Station actions
  fetchAndSetStations: (autoSelectFirst?: boolean) => Promise<void>;
  selectStation: (station: StationResponse, index: number) => void;
  playNextStation: () => void;
  playPreviousStation: () => void;
  playRandomStation: () => void;
  
  // Playback actions
  play: () => Promise<void>;
  pause: () => void;
  togglePlayPause: () => void;
  setVolume: (volume: number) => void;
  cleanupCurrentSound: () => void;
  
  // Filter actions
  setSearchQuery: (query: string) => void;
  setSelectedGenre: (genre: string | null) => void;
  setSelectedMood: (mood: string | null) => void;
  searchStations: (query: string) => Promise<void>;
  filterStations: () => void;
  fetchGenres: () => Promise<void>;
}

// Common moods that can be used for filtering
export const MOODS = [
  "Chill", "Energetic", "Focus", "Relaxing", 
  "Happy", "Romantic", "Workout", "Party", 
  "Sleep", "Study", "Travel"
] as const;

export type Mood = typeof MOODS[number];