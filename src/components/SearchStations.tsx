import React, { useState, useEffect, useCallback } from 'react';
import { Search, Command, X, Radio, Play, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRadioStore } from '../store/radioStore';
import type { Station } from '../types/radio.t'; // <-- Use our app's Station type

// Debounce hook
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const SearchStations: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  // selectedStationId was unused, so it's removed.
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const { 
    searchStations, 
    filteredStations, 
    isSearching, 
    currentStation,
    play,
    pause,
    isPlaying,
    selectStation
  } = useRadioStore();

  // Handle search when debounced query changes
  useEffect(() => {
    if (debouncedSearchQuery.trim()) {
      searchStations(debouncedSearchQuery);
    }
  }, [debouncedSearchQuery, searchStations]);

  const handleClear = useCallback(() => {
    setSearchQuery('');
  }, []);

  const handleSelectStation = useCallback((station: Station, index: number) => {
    selectStation(station, index);
    setSearchQuery('');
    play().catch(console.error);
  }, [selectStation, play]);

  const handlePlayPause = useCallback((station: Station, index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (currentStation?.stationuuid === station.stationuuid) {
      if (isPlaying) {
        pause();
      } else {
        play().catch(console.error);
      }
    } else {
      selectStation(station, index);
      play().catch(console.error);
    }
  }, [currentStation, isPlaying, play, pause, selectStation]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.05,
        when: "beforeChildren"
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05
      }
    })
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md">
      <motion.div 
      initial={{ width: "250px" }}
      animate={{ width: isFocused ? "100%" : "250px" }}
      transition={{ duration: 0.2, ease: "anticipate"}}
      className="relative mx-auto">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
          <Search className="text-zinc-900" size={20} />
        </div>
        <input
          type="search"
          name="search-stations"
          id="search-stations"
          className="block w-full pl-10 pr-12 py-2.5 bg-white/40 backdrop-blur-md border-2 border-gray-300/50 rounded-full shadow-md placeholder-zinc-600 focus:border-gray-300 focus:outline-none sm:text-sm peer font-semibold"
          placeholder="Search stations"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          autoComplete="off"
        />
        
        {searchQuery && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClear}
            className="absolute inset-y-0 right-8 pr-3 flex items-center text-gray-400 hover:text-gray-600 peer-focus:hidden"
            aria-label="Clear search"
          >
            <X size={16} />
          </motion.button>
        )}
        
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none ">
          <kbd className="inline-flex items-center px-2 py-1 text-xs font-sans font-medium text-gray-400 bg-gray-100/80 border border-gray-300/50 rounded-md">
            <Command size={12} className="mr-1" /> K
          </kbd>
        </div>
      </motion.div>

      {/* Search Results */}
      <AnimatePresence>
        {isFocused && searchQuery && (
          <motion.div 
            className="mt-2 w-full bg-white/80 backdrop-blur-md rounded-lg shadow-lg overflow-hidden border border-gray-200/50"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {isSearching ? (
              <motion.div 
                className="p-4 text-center text-gray-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                Searching...
              </motion.div>
            ) : filteredStations.length > 0 ? (
              <motion.ul 
                className="max-h-96 overflow-y-auto"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {filteredStations.map((station, index) => {
                  const isCurrentStation = currentStation?.stationuuid === station.stationuuid;
                  const isPlayingCurrent = isCurrentStation && isPlaying;
                  
                  return (
                    <motion.li
                      key={station.stationuuid}
                      className={`px-4 py-3 hover:bg-gray-50/80 cursor-pointer flex items-center gap-3 transition-colors ${
                        isCurrentStation ? 'bg-blue-50/50' : ''
                      }`}
                      custom={index}
                      variants={itemVariants}
                      onMouseDown={() => handleSelectStation(station, index)}
                    >
                      <div className="relative flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                        {station.favicon ? (
                          <img
                            src={station.favicon}
                            alt={station.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <Radio size={16} className="text-gray-400" />
                        
                        {isCurrentStation && (
                          <motion.div
                            className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2 }}
                          >
                            {isPlayingCurrent ? (
                              <Pause size={16} className="text-white" fill="white" />
                            ) : (
                              <Play size={16} className="text-white" fill="white" />
                            )}
                          </motion.div>
                        )}
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {station.name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          {station.country && <span>{station.country}</span>}
                          {station.tags && station.tags.length > 0 && (
                            <span className="truncate">• {station.tags.join(', ')}</span>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={(e) => handlePlayPause(station, index, e)}
                        className="p-2 text-gray-400 hover:text-blue-500 transition-colors cursor-pointer"
                        aria-label={isPlayingCurrent ? 'Pause' : 'Play'}
                      >
                        {isPlayingCurrent ? <Pause size={16} /> : <Play size={16} />}
                      </button>
                    </motion.li>
                  );
                })}
              </motion.ul>
            ) : (
              <motion.div 
                className="p-4 text-center text-gray-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {searchQuery ? 'No stations found' : 'Start typing to search stations'}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchStations;