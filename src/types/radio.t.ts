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


export type RadioState = StationSlice & PlayerSlice & UserSlice;
// Common moods that can be used for filtering
export const MOODS = [
  "Chill", "Energetic", "Focus", "Relaxing", 
  "Happy", "Romantic", "Workout", "Party", 
  "Sleep", "Study", "Travel"
] as const;

export type Mood = typeof MOODS[number];

export interface StationSlice {
  stations: Station[];
  stationsOnMap: Station[];
  isLoadingStations: boolean;
  allStationsLoaded: boolean;
  errorFetchingStations: string | null;
  genres: string[];
  selectedGenre: string | null;
  fetchAndSetStations: (autoSelectFirst?: boolean) => Promise<void>;
  fetchGenres: () => Promise<void>;
  filterStationsByGenre: () => void;
  setSelectedGenre: (genre: string | null) => void;
}

export interface PlayerSlice {
  currentStation: Station | null;
  currentStationIndex: number | null;
  isPlaying: boolean;
  isLoading: boolean; // Player-specific loading
  currentSound: Howl | null;
  errorFetchingStations: string | null;
  volume: number;
  selectStation: (station: Station, index: number) => void;
  play: () => Promise<void>;
  pause: () => void;
  togglePlayPause: () => void;
  cleanupCurrentSound: () => void;
  playNextStation: () => void;
  playRandomStation: () => void;
  searchStations: (query: string) => void;
  filteredStations: Station[];
  isSearching: boolean; 
}
export interface UserSlice {
  favoriteStationIds: string[];
  isDarkMode: boolean;
  toggleFavorite: (stationId: string) => void;
  toggleDarkMode: () => void;
  locateStationTrigger: number;
  locateCurrentStation: () => void;
}