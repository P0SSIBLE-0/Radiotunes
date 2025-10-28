import type { StateCreator } from "zustand";
import type { RadioState, UserSlice } from "@/types/radio.t";

const getInitialFavorites = (): string[] => {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem("favorite_stations");
  try {
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const getInitialTheme = (): boolean => {
  if (typeof window === "undefined") return false;
  const stored = localStorage.getItem("theme");
  return (
    stored === "dark" ||
    (stored === null &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)
  );
};

export const createUserSlice: StateCreator<RadioState, [], [], UserSlice> = (
  set,
  get
) => ({
  favoriteStationIds: getInitialFavorites(),
  isDarkMode: getInitialTheme(),
  locateStationTrigger: 0,

  locateCurrentStation: () => {
    set((state) => ({ locateStationTrigger: state.locateStationTrigger + 1 }));
  },

  toggleFavorite: (stationId: string) => {
    const currentFavorites = get().favoriteStationIds;
    const isFavorite = currentFavorites.includes(stationId);
    let newFavorites: string[];

    if (isFavorite) {
      newFavorites = currentFavorites.filter((id) => id !== stationId);
    } else {
      newFavorites = [...currentFavorites, stationId];
    }

    set({ favoriteStationIds: newFavorites });

    window.localStorage.setItem(
      "favorite_stations",
      JSON.stringify(newFavorites)
    );

    // If the user is currently viewing the favorites list, re-apply the filter
    if (get().selectedGenre === "Favorites") {
      get().filterStationsByGenre();
    }
    console.log("Favorite stations:", get().favoriteStationIds);
  },

  toggleDarkMode: () => {
    set((state) => ({ isDarkMode: !state.isDarkMode }));
  },
});
