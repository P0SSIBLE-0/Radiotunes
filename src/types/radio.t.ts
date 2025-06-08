// src/types/radio.t.ts
import { Howl } from 'howler';

// This is our app's station type, mapped from the API response.
// It resolves inconsistencies like 'tags' being a string instead of string[].
export interface Station {
  changeuuid: string;
  stationuuid: string;
  name: string;
  url: string;
  url_resolved: string;
  homepage: string;
  favicon: string;
  tags: string[];
  country: string;
  countrycode: string;
  state: string;
  language: string[];
  votes: number;
  codec: string;
  bitrate: number;
  hls: boolean;
  lastcheckok: boolean;
  clickcount: number;
  geo_lat?: number | null;
  geo_long?: number | null;
}


export interface RadioState {
  // Station state
  stations: Station[];
  stationsOnMap: Station[];
  filteredStations: Station[];
  currentStation: Station | null;
  currentStationIndex: number | null;
  locateStationTrigger: number;
  
  // Audio state
  isPlaying: boolean;
  volume: number;
  currentSound: Howl | null;
  isLoading: boolean;
  
  // Loading states
  isLoadingStations: boolean;
  isSearching: boolean;
  allStationsLoaded: boolean; // <-- Added
  
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
  selectStation: (station: Station, index: number) => void;
  playNextStation: () => void;
  playPreviousStation: () => void;
  playRandomStation: () => void;
  filterStationsByGenre: () => void;
  locateCurrentStation: () => void;
  
  
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