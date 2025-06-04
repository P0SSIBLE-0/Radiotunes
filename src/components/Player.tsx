import React from 'react';
import { useRadioStore } from '../store/radioStore'; // Adjusted path
import {
  Play, Pause, Volume2, VolumeX, Heart, MapPin, Link as LinkIcon, DollarSign, Moon, Expand, Shuffle
} from 'lucide-react';
import { div } from 'three/tsl';
import Filters from './Filters';

const Player: React.FC = () => {
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

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-sm">
      <Filters/>
      <div className=" bg-white/30 backdrop-blur-sm border-2 border-white/20 shadow-2xl rounded-2xl p-5 text-gray-800 z-50 mt-3 w-full">
      {/* Top Utility Row */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs text-gray-500">02:53 PM</span> {/* Placeholder time */}
        <div className="flex space-x-3">
          <a href={currentStation.homepage || '#'}
             target="_blank"
             rel="noopener noreferrer"
             title="Visit Homepage"
             className={`${!currentStation.homepage && 'opacity-50 cursor-not-allowed'}`}>
             <LinkIcon size={18} className="text-gray-500 hover:text-gray-700" />
          </a>
          <button title="Sponsor (not implemented)"><DollarSign size={18} className="text-gray-500 hover:text-gray-700" /></button>
          <button title="Theme (not implemented)"><Moon size={18} className="text-gray-500 hover:text-gray-700" /></button>
          <button title="Expand (not implemented)"><Expand size={18} className="text-gray-500 hover:text-gray-700" /></button>
        </div>
      </div>

      {/* Station Info */}
      <div className="text-center mb-5">
        <h2 className="text-xl font-semibold truncate" title={currentStation.name}>
          {currentStation.name}
        </h2>
        <p className="text-sm text-gray-500 truncate" title={currentStation.country || ''}>
          {currentStation.country}
        </p>
      </div>

      {/* Main Controls Row */}
      <div className="flex items-center justify-around">
        <button 
          onClick={togglePlayPause} 
          className="p-2 text-gray-700 hover:text-pink-500 transition-colors"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={28} /> : <Play size={28} />}
        </button>

        <div className="flex items-center w-1/3">
          {volume === 0 ? <VolumeX size={20} className="text-gray-600 mr-2" /> : <Volume2 size={20} className="text-gray-600 mr-2" />}
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
        
        <button className="p-2 text-gray-600 hover:text-pink-500" title="Favorite (not implemented)">
          <Heart size={22} />
        </button>
        <button className="p-2 text-gray-600 hover:text-pink-500" title="Show on map (not implemented)">
          <MapPin size={22} />
        </button>
        <button onClick={playRandomStation} className="p-2 text-gray-600 hover:text-pink-500" title="Play Random Station">
          <Shuffle size={22} />
        </button>
      </div>
    </div>
    </div>
  );
};

export default Player;
