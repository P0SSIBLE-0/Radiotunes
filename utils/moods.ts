import type { Mood, Station } from "@/types/radio.t";

// Curated tag keywords per mood. Station tags are matched forgivingly
// (case/punctuation-insensitive, substring either way), since radio-browser
// tags vary wildly ("lofi" vs "lo-fi", "top 40" vs "top40", ...).
export const MOOD_TAG_MAP: Record<Mood, readonly string[]> = {
  Chill: ["chill", "chillout", "lounge", "ambient", "downtempo", "smooth", "soft", "mellow", "easy listening"],
  Energetic: ["dance", "edm", "electro", "techno", "house", "trance", "upbeat", "energetic"],
  Focus: ["ambient", "instrumental", "classical", "jazz", "lofi", "focus", "minimal", "study", "concentration", "piano"],
  Relaxing: ["relax", "relaxing", "chillout", "lounge", "smooth", "soft", "acoustic", "calm", "spa"],
  Happy: ["happy", "feel good", "summer", "hits", "party", "fun", "upbeat"],
  Romantic: ["romantic", "romance", "love", "slow", "soul", "rnb", "ballad", "sentimental"],
  Workout: ["workout", "fitness", "gym", "running", "motivation", "sports", "exercise", "training", "cardio"],
  Party: ["party", "club", "dance", "hits", "top 40", "edm", "house", "disco", "nightlife"],
  Sleep: ["sleep", "night", "ambient", "calm", "meditation", "lullaby", "relaxing", "piano"],
  Study: ["study", "focus", "instrumental", "lofi", "classical", "jazz", "reading", "chill"],
  Travel: ["travel", "road", "reggae", "latin", "world", "summer", "oldies", "tropical"],
};

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

export function stationMatchesMood(station: Station, mood: Mood): boolean {
  if (station.tags.length === 0) return false;
  const keywords = MOOD_TAG_MAP[mood].map(normalize);
  return station.tags.some((tag) => {
    const normalizedTag = normalize(tag);
    if (!normalizedTag) return false;
    return keywords.some(
      (keyword) => normalizedTag.includes(keyword) || keyword.includes(normalizedTag)
    );
  });
}
