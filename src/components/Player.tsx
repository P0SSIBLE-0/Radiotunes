import React, { useState, useEffect } from "react";
import { useAppStore } from "../store";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  Heart,
  MapPin,
  Moon,
  Shuffle,
  Maximize2,
  Minimize2,
  Loader2,
  Share2,
} from "lucide-react";
import Filters from "./Filters";
import Volume from "./Volume";

const Player: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [time, setTime] = useState("");
 

  const {
    currentStation,
    isPlaying,
    isLoading,
    togglePlayPause,
    playRandomStation,
    locateCurrentStation,
    errorFetchingStations,
    toggleDarkMode,
    toggleFavorite,
    favoriteStationIds,
    currentSound,
    setVolume,
  } = useAppStore();

  // Effect for the live clock in the expanded view
  useEffect(() => {
    if (isExpanded) {
      const timer = setInterval(() => {
        setTime(
          new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        );
      }, 1000);
      // Set initial time
      setTime(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
      return () => clearInterval(timer);
    }
  }, [isExpanded]);

  if (!currentStation) {
    // A simple placeholder when no station is selected
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-sm px-4">
        <div className="h-20 bg-white/70 dark:bg-black/30 backdrop-blur-xl border border-white/20 dark:border-black/20 shadow-lg rounded-2xl flex justify-center items-center">
          <p className="text-slate-500 dark:text-white">No station selected.</p>
        </div>
      </div>
    );
  }

  const ERROR_POPUP_VARIANTS = {
    initial: { opacity: 0, y: 20, scale: 0.95 },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring", stiffness: 300, damping: 20 },
    },
    exit: { opacity: 0, y: 10, scale: 0.9, transition: { duration: 0.2 } },
  };

  const isFavorite = favoriteStationIds.includes(currentStation.stationuuid);

  const handleShare = async () => {
    if (!currentStation) return;

    const shareUrl = `${window.location.origin}/?station=${currentStation.stationuuid}`;
    const shareData = {
      title: "Check out this radio station!",
      text: `Listen to ${currentStation.name} on Radiotunes.`,
      url: shareUrl,
    };

    // Use the Web Share API if available (on mobile)
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        console.log("Station shared successfully!");
      } catch (err) {
        console.error("Share failed:", err);
      }
    } else {
      // Fallback for desktop: copy URL to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert("Link copied to clipboard!"); // Simple feedback
      } catch (err) {
        console.error("Failed to copy link:", err);
        alert("Failed to copy link.");
      }
    }
  };

  return (
    // This container holds both the Filters and the Player, managing their overall layout.
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 flex flex-col items-center gap-3 z-50">
      {/* --- Animated Filters Panel --- */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="w-full"
            initial={{ opacity: 0, y: 400, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.8 }}
            transition={{ duration: 0.3, ease: "backOut" }}
          >
            <Filters />
          </motion.div>
        )}
      </AnimatePresence>
      {errorFetchingStations && (
        <motion.div
          initial="initial"
          animate="animate"
          exit="exit"
          variants={ERROR_POPUP_VARIANTS}
          transition={{ duration: 0.2 }}
          className="fixed bottom-21 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 z-50"
        >
          <div className="bg-red-500 border-2 border-red-100 rounded-xl p-2">
            <p className="text-white text-center font-semibold">
              {errorFetchingStations}
            </p>
          </div>
        </motion.div>
      )}
      {/* --- Main Player Container --- */}
      <motion.div
        layout="position"
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="w-full bg-background backdrop-blur-xl border border-background/20 shadow-xl p-4"
        style={{
          borderRadius: isExpanded ? "24px" : "16px",
        }}
      >
        {isExpanded ? (
          // --- EXPANDED LAYOUT ---
          <div className="flex flex-col gap-4 py-2">
            {/* Top Bar: Time and Utility Icons */}
            <div className="flex justify-between items-center text-primary">
              <span className="font-mono text-sm">{time}</span>
              <div className="flex items-center gap-3">
                <button title="Share">
                  <Share2 onClick={handleShare} size={18} />
                </button>
                <button onClick={toggleDarkMode} title="Theme">
                  <Moon size={18} />
                </button>
                <button onClick={() => setIsExpanded(false)} title="Collapse">
                  <Minimize2 size={18} className="rotate-180 cursor-pointer" />
                </button>
              </div>
            </div>

            {/* Station Info */}
            <div className="text-center">
              <h2
                className="text-2xl font-semibold text-primary truncate"
                title={currentStation.name}
              >
                {currentStation.name}
              </h2>
              <p className="text-sm text-secondary">{currentStation.country}</p>
            </div>

            {/* Main Controls */}
            <div className="flex justify-around items-center text-primary *:cursor-pointer">
              <button
                onClick={togglePlayPause}
                title={isPlaying ? "Pause" : "Play"}
              >
                {isLoading ? (
                  <motion.div key="loader">
                    <Loader2 size={24} className="animate-spin" />
                  </motion.div>
                ) : isPlaying ? (
                  <motion.div key="pause">
                    <Pause size={24} />
                  </motion.div>
                ) : (
                  <motion.div key="play">
                    <Play size={24} />
                  </motion.div>
                )}
              </button>
              <Volume currentSound={currentSound} setVolume={setVolume} />
              <button
                title={
                  isFavorite ? "Remove from favorites" : "Add to favorites"
                }
                className={isFavorite ? "text-red-500" : "dark:text-slate-200"}
                onClick={() => toggleFavorite(currentStation.stationuuid)}
              >
                <Heart size={24} fill={isFavorite ? "red" : "none"} />
              </button>
              {/* --- THIS IS THE NEW BUTTON --- */}
              <button onClick={locateCurrentStation} title="Show on Map">
                <MapPin size={24} />
              </button>
              <button onClick={playRandomStation} title="Play Random Station">
                <Shuffle size={24} />
              </button>
            </div>
          </div>
        ) : (
          // --- COLLAPSED LAYOUT ---
          <div className="flex items-center gap-3 px-4 justify-between">
            {/* Station Info */}
            <div className="w-1/2">
              <h3 className="font-semibold text-primary truncate">
                {currentStation.name}
              </h3>
              <p className="text-xs text-secondary truncate">
                {currentStation.country}
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3 text-primary">
              <button
                onClick={togglePlayPause}
                title={isPlaying ? "Pause" : "Play"}
              >
                {isLoading ? (
                  <motion.div key="loader_c">
                    <Loader2 size={20} className="animate-spin" />
                  </motion.div>
                ) : isPlaying ? (
                  <motion.div key="pause_c">
                    <Pause size={20} />
                  </motion.div>
                ) : (
                  <motion.div key="play_c">
                    <Play size={20} />
                  </motion.div>
                )}
              </button>
              <Volume currentSound={currentSound} setVolume={setVolume} />
              <button
                title={
                  isFavorite ? "Remove from favorites" : "Add to favorites"
                }
                className={isFavorite ? "text-red-500" : "dark:text-slate-200"}
                onClick={() => toggleFavorite(currentStation.stationuuid)}
              >
                <Heart size={20} fill={isFavorite ? "red" : "none"} />
              </button>
              <button onClick={() => setIsExpanded(true)} title="Expand">
                <Maximize2 size={20} />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Player;
