import { create } from 'zustand';
import { Howl } from 'howler';
import { type Station, fetchStations, recordStationClick } from '../services/radioApi';

interface RadioState {
  stations: Station[];
  currentStation: Station | null;
  currentStationIndex: number | null;
  isPlaying: boolean;
  volume: number;
  isLoadingStations: boolean;
  errorFetchingStations: string | null;
  currentSound: Howl | null;
  isLoading: boolean;
  fetchAndSetStations: (autoSelectFirst?: boolean) => Promise<void>;
  selectStation: (station: Station, index: number) => void;
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  setVolume: (volume: number) => void;
  playNextStation: () => void;
  playPreviousStation: () => void;
  playRandomStation: () => void;
  cleanupCurrentSound: () => void;
}

export const useRadioStore = create<RadioState>((set, get) => ({
  stations: [],
  currentStation: null,
  currentStationIndex: null,
  isPlaying: false,
  volume: 0.5,
  isLoadingStations: false,
  errorFetchingStations: null,
  currentSound: null,
  isLoading: false,

  fetchAndSetStations: async (autoSelectFirst = false) => {
    set({ isLoadingStations: true, errorFetchingStations: null });
    try {
      const stations = await fetchStations(1000);
      console.log('Radio store stations:', stations.length);
      set({ stations, isLoadingStations: false });
      if (autoSelectFirst && stations.length > 0 && !get().currentStation) {
        get().selectStation(stations[0], 0);
      }
    } catch (error) {
      console.error('Error fetching stations in store:', error);
      set({ 
        errorFetchingStations: 'Failed to fetch stations', 
        isLoadingStations: false 
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
        console.error('Error cleaning up sound:', error);
      }
    }
    set({ currentSound: null, isPlaying: false });
  },

  selectStation: (station, index) => {
    console.log('Selecting station:', station.name, station.url_resolved || station.url);
    
    // Cleanup previous sound
    get().cleanupCurrentSound();

    // Create new Howl instance
    const audioUrl = station.url_resolved || station.url;
    
    const newSound = new Howl({
      src: [audioUrl],
      html5: true,
      format: ['mp3', 'aac', 'ogg', 'mpeg'], // Common radio stream formats
      volume: get().volume,
      preload: false, // Don't preload for streaming
      onload: () => {
        console.log('Audio loaded successfully');
        set({ isLoading: false });
      },
      onloaderror: (id, err) => {
        console.error('Howler load error for station:', station.name, err);
        set({ isLoading: false, isPlaying: false });
        // Try to play next station or show error
      },
      onplay: () => {
        console.log('Audio started playing');
        set({ isPlaying: true, isLoading: false });
      },
      onpause: () => {
        console.log('Audio paused');
        set({ isPlaying: false });
      },
      onstop: () => {
        console.log('Audio stopped');
        set({ isPlaying: false });
      },
      onplayerror: (id, err) => {
        console.error('Howler play error for station:', station.name, err);
        set({ isPlaying: false, isLoading: false });
        
        // Try alternative URL if available
        if (station.url && station.url !== audioUrl) {
          console.log('Trying alternative URL...');
          const altSound = new Howl({
            src: [station.url],
            html5: true,
            format: ['mp3', 'aac', 'ogg', 'mpeg'],
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
        console.log('Audio ended');
        set({ isPlaying: false });
      }
    });

    // Update state
    set({ 
      currentStation: station, 
      currentStationIndex: index, 
      currentSound: newSound,
      isPlaying: false,
      isLoading: false
    });

    // Record the click
    try {
      recordStationClick(station.stationuuid);
    } catch (error) {
      console.error('Error recording station click:', error);
    }
  },

  play: () => {
    const { currentSound, isPlaying, currentStation } = get();
    
    if (!currentSound) {
      console.warn('No current sound to play');
      return;
    }

    if (!isPlaying) {
      console.log('Starting playback for:', currentStation?.name);
      set({ isLoading: true });
      
      try {
        currentSound.play();
      } catch (error) {
        console.error('Error starting playback:', error);
        set({ isLoading: false, isPlaying: false });
      }
    }
  },

  pause: () => {
    const { currentSound, isPlaying } = get();
    if (currentSound && isPlaying) {
      console.log('Pausing playback');
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
      const prevIndex = (currentStationIndex - 1 + stations.length) % stations.length;
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
}));