import { motion } from "motion/react";
import { VolumeX, Volume1, Volume2 } from "lucide-react";
import { useState } from "react";
import { Howl } from "howler";

interface VolumeProps {
  currentSound: Howl | null;
  setVolume: (volume: number) => void;
  /** Store volume in the 0–1 range. Used to initialize the slider. */
  volume: number;
}
const Volume = ({ currentSound, setVolume, volume }: VolumeProps) => {
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  // Slider scale is 0–10; store scale is 0–1.
  const [currentVolume, setCurrentVolume] = useState(() => Math.round(volume * 10));
  const handleVolumeChange = (newVolume: number) => {
    if (!currentSound) return;
    const sliderValue = Math.max(0, Math.min(10, newVolume));
    setCurrentVolume(sliderValue);
    setVolume(sliderValue / 10);
  };


  return (
    <div className="relative">
      <button
        onClick={() => setShowVolumeControl(!showVolumeControl)}
        className="relative pt-1.5"
      >
        {currentVolume === 0 ? (
          <VolumeX size={24} />
        ) : currentVolume <= 5 ? (
          <Volume1 size={24} />
        ) : (
          <Volume2 size={24} />
        )}
      </button>

      {/* Volume Slider */}
      {showVolumeControl && (
        <motion.div
          initial={{ opacity: 0, y: 50, scaleX: 0.4 }}
          animate={{ opacity: 1, y: 0, scaleX: 1 }}
          exit={{ opacity: 0, y: 50, scaleX: 0.4 }}
          transition={{ duration: 0.2 }}
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2 bg-background/80 backdrop-blur-md p-2 rounded-lg shadow-lg"
        >
          <input
            type="range"
            min="0"
            max="10"
            step="1"
            value={currentVolume}
            onChange={(e) => handleVolumeChange(parseInt(e.target.value, 10))}
            className="h-4 w-32 cursor-pointer accent-emerald-500"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3111 ${
                currentVolume * 10
              }%, #e5e7eb ${currentVolume * 10}%, #e5e7eb 100%)`,
            }}
          />
        </motion.div>
      )}
    </div>
  );
};

export default Volume;
