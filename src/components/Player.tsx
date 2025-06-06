import React, {  useRef, useState } from "react";
import { useRadioStore } from "../store/radioStore";
import { motion, AnimatePresence } from "motion/react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Heart,
  MapPin,
  DollarSign,
  Moon,
  Shuffle,
  Maximize2,
} from "lucide-react";
import Filters from "./Filters";

const Player: React.FC = () => {
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);

  const {
    currentStation,
    isPlaying,
    volume,
    togglePlayPause,
    setVolume,
    playRandomStation, // Added playRandomStation
    // playNextStation, // Removed for now to match UI image
    // playPreviousStation, // Removed for now to match UI image
  } = useRadioStore();

  if (!currentStation) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-white shadow-xl rounded-xl p-6 text-gray-700 z-50">
        <p className="text-center text-gray-500">No station selected.</p>
      </div>
    );
  }

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(event.target.value));
  };

  const handleExpandClick = () => {
    setIsFiltersExpanded(!isFiltersExpanded);
  };

  // const handleOutsideClick = (event: MouseEvent) => {
  //   if (
  //     toggleButtonRef.current &&
  //     !toggleButtonRef.current.contains(event.target as Node)
  //   ) {
  //     setIsFiltersExpanded(false);
  //   }
  // };


  return (
    <motion.div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-sm bg-white/30 backdrop-blur-md border-2 border-white/20 shadow-2xl rounded-2xl p-5 text-gray-800 z-50">
      <div className="">
        {/* Top Utility Row */}
        <div className="flex justify-between items-center mb-4 px-4">
          {/* Other buttons */}
          <div className="flex space-x-3">
            <button title="Sponsor (not implemented)">
              <DollarSign
                size={18}
                className="text-gray-500 hover:text-gray-700"
              />
            </button>
            <button title="Theme (not implemented)">
              <Moon size={18} className="text-gray-500 hover:text-gray-700" />
            </button>
            <button
              ref={toggleButtonRef}
              onClick={handleExpandClick}
              title="Filters"
              className="transition-colors hover:bg-gray-100 p-1 rounded"
            >
              <Maximize2
                size={18}
                className={`text-gray-500 hover:text-gray-700 transition-transform ${
                  isFiltersExpanded ? "rotate-45" : ""
                }`}
              />
            </button>
          </div>
        </div>

        {/* Animated Filters Panel */}
        <AnimatePresence>
          {isFiltersExpanded && (
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.95,
                x: 0,
                y: 100,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                x: 0,
                y: -10,
                transition: {
                  type: "spring",
                  damping: 25,
                  stiffness: 300,
                },
              }}
              exit={{
                opacity: 0,
                scale: 0.95,
                x: 0,
                y: 100,
                transition: { duration: 0.2 },
              }}
              className="w-full max-w-sm"
            >
              <Filters />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Station Info */}
      <div className="text-center mb-5">
        <h2
          className="text-xl font-semibold truncate"
          title={currentStation.name}
        >
          {currentStation.name}
        </h2>
        <p
          className="text-sm text-gray-500 truncate"
          title={currentStation.country || ""}
        >
          {currentStation.country}
        </p>
      </div>

      {/* Main Controls Row */}
      <div className="flex items-center justify-around">
        <button
          onClick={togglePlayPause}
          className="p-2 text-gray-700 hover:text-zinc-800 transition-colors"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause size={28} /> : <Play size={28} />}
        </button>

        <div className="flex items-center w-1/3">
          {volume === 0 ? (
            <VolumeX size={20} className="text-gray-600 mr-2" />
          ) : (
            <Volume2 size={20} className="text-gray-600 mr-2" />
          )}
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="w-full h-1.5 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-pink-500"
            title={`Volume: ${Math.round(volume * 100)}%`}
          />
        </div>

        <button
          className="p-2 text-gray-600 hover:text-pink-500"
          title="Favorite (not implemented)"
        >
          <Heart size={22} />
        </button>
        <button
          className="p-2 text-gray-600 hover:text-pink-500"
          title="Show on map (not implemented)"
        >
          <MapPin size={22} />
        </button>
        <button
          onClick={playRandomStation}
          className="p-2 text-gray-600 hover:text-pink-500"
          title="Play Random Station"
        >
          <Shuffle size={22} />
        </button>
      </div>
    </motion.div>
  );
};

export default Player;
