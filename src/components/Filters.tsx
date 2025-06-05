import React, { useState } from 'react';
import { Music2, Smile, ListFilter, RadioTower, Zap } from 'lucide-react';

const Filters: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'genres' | 'moods'>('genres');
  const [activeGenre, setActiveGenre] = useState<string>('All');

  const genres = ['All', 'Pop', 'Rock', 'Jazz', 'Electronic', 'Classical', 'Hip Hop', 'Reggae'];

  return (
    <div className="w-full">
      <div className="bg-white/30 backdrop-blur-md shadow-lg rounded-lg p-3">
        {/* Tabs for Genres/Moods */}
        <div className="flex mb-3">
          <button
            onClick={() => setActiveTab('genres')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium flex items-center justify-center transition-colors duration-150 cursor-pointer
              ${activeTab === 'genres' ? 'bg-zinc-800 text-white shadow-sm' : 'text-gray-200 hover:bg-zinc-800/50'}`}
          >
            <Music2 size={16} className="mr-2" /> Genres
          </button>
          <button
            onClick={() => setActiveTab('moods')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium flex items-center justify-center transition-colors ml-1 cursor-pointer
              ${activeTab === 'moods' ? 'bg-zinc-800 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-200/50'}`}
          >
            <Smile size={16} className="mr-2" /> Moods (WIP)
          </button>
        </div>

        {/* Content for selected tab */}
        {activeTab === 'genres' && (
          <div className="relative">
            <div className="flex items-center space-x-2 overflow-x-auto pb-2 no-scrollbar">
              {/* Placeholder for scroll buttons if many genres */}
              {/* <button className="p-1.5 rounded-full hover:bg-gray-200/70"><ChevronLeft size={18} /></button> */}
              {genres.map((genre) => (
                <button
                  key={genre}
                  onClick={() => setActiveGenre(genre)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer
                    ${activeGenre === genre ? 'bg-zinc-800 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                >
                  {genre === 'All' && <ListFilter size={12} className="inline mr-1.5" />}
                  {genre === 'Pop' && <RadioTower size={12} className="inline mr-1.5" />}
                  {genre === 'Rock' && <Zap size={12} className="inline mr-1.5" />}
                  {/* Add more icons as needed */}
                  {genre}
                </button>
              ))}
              {/* <button className="p-1.5 rounded-full hover:bg-gray-200/70"><ChevronRight size={18} /></button> */}
            </div>
          </div>
        )}

        {activeTab === 'moods' && (
          <div className="text-center text-sm text-gray-800 font-semibold py-4">
            Mood-based filtering is coming soon!
          </div>
        )}
      </div>
    </div>
  );
};

export default Filters;