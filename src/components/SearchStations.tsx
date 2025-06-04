import React from 'react';
import { Search, Command } from 'lucide-react';

const SearchStations: React.FC = () => {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="text-gray-200" size={20} />
        </div>
        <input
          type="search"
          name="search-stations"
          id="search-stations"
          className="block w-full pl-10 pr-12 py-2.5 bg-white/40 backdrop-blur-md border border-gray-300/50 rounded-lg shadow-md placeholder-zinc-300
         focus:ring-zinc-500 focus:border-zinc-500 focus:outline-none sm:text-sm"
          placeholder="Search stations"
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <kbd className="inline-flex items-center px-2 py-1 text-xs font-sans font-medium text-gray-400 bg-gray-100/80 border border-gray-300/50 rounded-md">
            <Command size={12} className="mr-1" /> K
          </kbd>
        </div>
      </div>
    </div>
  );
};

export default SearchStations;
