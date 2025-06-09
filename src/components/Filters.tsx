import React from "react";
import { useAppStore } from "../store";
import { Music2, Smile, ListFilter, Heart } from "lucide-react";

const GENRES = [
  "All",
  "Favorites",
  "Pop",
  "Rock",
  "Hip Hop",
  "Jazz",
  "Classical",
  "Country",
  "R&B",
  "Electronic",
  "News",
  "World"
];

const Filters: React.FC = () => {
  const { selectedGenre, setSelectedGenre } = useAppStore();

  return (
    <div className="w-full">
      <div className="bg-background/40 backdrop-blur-md shadow-lg rounded-xl p-3">
        {/* Tabs for Genres/Moods */}
        <div className="flex mb-3">
          <button
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium flex items-center justify-center transition-colors duration-150 cursor-pointer bg-primary text-background shadow-sm`}
          >
            <Music2 size={16} className="mr-2" /> Genres
          </button>
          <button
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium flex items-center justify-center transition-colors ml-1 cursor-not-allowed text-gray-500`}
          >
            <Smile size={16} className="mr-2" /> Moods (WIP)
          </button>
        </div>

        {/* Genre buttons */}
        <div className="relative">
          <div className="flex items-center space-x-2 overflow-x-auto py-2 no-scrollbar">
            {GENRES.length > 0 ? (
              GENRES.map((genre) => (
                <button
                  key={genre}
                  onClick={() => setSelectedGenre(genre)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer
                    ${
                      selectedGenre === genre
                        ? "bg-primary text-background"
                        : "bg-background text-primary hover:bg-primary hover:text-background"
                    }`}
                >
                  {genre === "All" && (
                    <ListFilter size={12} className="inline mr-1.5" />
                  )}
                  {genre === "Favorites" && (
                    <Heart size={12} className="inline mr-1.5" />
                  )}
                  {genre}
                </button>
              ))
            ) : (
              <p className="text-sm text-gray-600">Loading genres...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Filters;
