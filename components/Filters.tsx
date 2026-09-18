import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAppStore } from "@/store";
import { MOODS, type Mood } from "@/types/radio.t";
import {
  Music2,
  Smile,
  ListFilter,
  Heart,
  Coffee,
  Zap,
  Crosshair,
  Waves,
  Sun,
  Dumbbell,
  PartyPopper,
  Moon,
  BookOpen,
  Plane,
  type LucideIcon,
} from "lucide-react";

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

const MOOD_ICONS: Record<Mood, LucideIcon> = {
  Chill: Coffee,
  Energetic: Zap,
  Focus: Crosshair,
  Relaxing: Waves,
  Happy: Sun,
  Romantic: Heart,
  Workout: Dumbbell,
  Party: PartyPopper,
  Sleep: Moon,
  Study: BookOpen,
  Travel: Plane,
};

const Filters: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"genres" | "moods">("genres");
  const selectedGenre = useAppStore((s) => s.selectedGenre);
  const setSelectedGenre = useAppStore((s) => s.setSelectedGenre);
  const selectedMood = useAppStore((s) => s.selectedMood);
  const setSelectedMood = useAppStore((s) => s.setSelectedMood);
  const matchCount = useAppStore((s) => s.stationsOnMap.length);

  const tabClass = (tab: "genres" | "moods") =>
    `relative flex-1 py-2 px-4 rounded-md text-sm font-medium flex items-center justify-center transition-colors duration-150 cursor-pointer ${
      activeTab === tab ? "text-background" : "text-gray-500 hover:text-primary"
    }`;

  // The active tab background is a shared layout element: it slides
  // between the buttons instead of fading each button in/out.
  const renderTabButton = (
    tab: "genres" | "moods",
    icon: React.ReactNode,
    label: string
  ) => (
    <button
      key={tab}
      type="button"
      onClick={() => setActiveTab(tab)}
      className={`${tabClass(tab)}${tab === "moods" ? " ml-1" : ""}`}
    >
      {activeTab === tab && (
        <motion.span
          layoutId="filter-tab-pill"
          className="absolute inset-0 bg-primary rounded-md shadow-sm"
          transition={{ type: "spring", stiffness: 500, damping: 40 }}
        />
      )}
      <span className="relative z-10 flex items-center">
        {icon} {label}
      </span>
    </button>
  );

  const pillClass = (isSelected: boolean) =>
    `px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
      isSelected
        ? "bg-primary text-background"
        : "bg-background/90 text-primary hover:bg-primary hover:text-background"
    }`;

  return (
    <div className="w-full">
      <div className="bg-background/40 backdrop-blur-md shadow-lg rounded-2xl p-3">
        {/* Tabs for Genres/Moods */}
        <div className="flex mb-3">
          {renderTabButton(
            "genres",
            <Music2 size={16} className="mr-2" />,
            "Genres"
          )}
          {renderTabButton(
            "moods",
            <Smile size={16} className="mr-2" />,
            "Moods"
          )}
        </div>

        {/* Tab panels */}
        <div className="relative">
          {activeTab === "genres" ? (
            <div className="flex items-center space-x-2 overflow-x-auto py-1 no-scrollbar">
              {GENRES.length > 0 ? (
                GENRES.map((genre) => (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => setSelectedGenre(genre)}
                    className={pillClass(selectedGenre === genre && !selectedMood)}
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
          ) : (
            <div>
              <div className="flex items-center space-x-2 overflow-x-auto py-1 no-scrollbar">
                {MOODS.map((mood) => {
                  const Icon = MOOD_ICONS[mood];
                  const isSelected = selectedMood === mood;
                  return (
                    <button
                      key={mood}
                      type="button"
                      title={`Show ${mood.toLowerCase()} stations`}
                      onClick={() => setSelectedMood(isSelected ? null : mood)}
                      className={pillClass(isSelected)}
                    >
                      <Icon size={12} className="inline mr-1.5" />
                      {mood}
                    </button>
                  );
                })}
              </div>
              {/* Expands/collapses smoothly — no reserved empty space,
                  no sudden jump when the count appears or disappears. */}
              <AnimatePresence initial={false}>
                {selectedMood && (
                  <motion.p
                    key="mood-count"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="overflow-hidden text-xs text-secondary px-1"
                    aria-live="polite"
                  >
                    <span className="block mt-2">
                      {matchCount.toLocaleString()}{" "}
                      {matchCount === 1 ? "station matches" : "stations match"}{" "}
                      “{selectedMood}”
                    </span>
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Filters;
