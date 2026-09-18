import type { Station } from "@/types/radio.t";
import { type Station as RadioApiStation } from 'radio-browser-api';

// Define a local Tag type as it's not exported from the library
type Tag = {
  name: string;
  stationcount: number;
};

// The library sometimes returns tag/language lists in mixed shapes;
// normalize to a clean lowercase string array.
const toTagList = (value: unknown): string[] => {
  const list = Array.isArray(value) ? value : String(value ?? "").split(",");
  return list
    .map((t) => String(t).trim().toLowerCase())
    .filter(Boolean);
};

// Shared fetch boilerplate: throws on HTTP errors, parses JSON.
async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}): ${url}`);
  }
  return response.json() as Promise<T>;
}


// Helper function to map API station to our app's Station interface
const mapApiStation = (s: RadioApiStation): Station => ({
  changeuuid: s.changeId,
  stationuuid: s.id,
  name: s.name,
  url: s.url,
  url_resolved: s.urlResolved,
  homepage: s.homepage,
  favicon: s.favicon,
  tags: toTagList(s.tags),
  country: s.country,
  countrycode: s.countryCode,
  state: s.state,
  language: toTagList(s.language),
  votes: s.votes,
  codec: s.codec,
  bitrate: s.bitrate,
  hls: s.hls,
  lastcheckok: s.lastCheckOk,
  clickcount: s.clickCount,
  geo_lat: s.geoLat,
  geo_long: s.geoLong,
});

export async function fetchStations(
  limit: number = 500,
  offset: number = 0
): Promise<Station[]> {
  try {
    const stationsFromServer = await fetchJson<RadioApiStation[]>(
      `/api/radio/stations?limit=${limit}&offset=${offset}`
    );

    if (stationsFromServer.length === 0) {
      console.warn(
        "No stations returned from API for this chunk. This may be the end of the list."
      );
    }

    return stationsFromServer.map(mapApiStation);
  } catch (error: unknown) {
    console.error("Error fetching stations:", error);
    throw new Error(`Failed to fetch stations: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function recordStationClick(stationUuid: string): Promise<void> {
  console.log(`Recording click for station ${stationUuid}`);
  try {
    const response = await fetch('/api/radio/record-click', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ stationId: stationUuid }),
    });

    if (!response.ok) {
      const errorResult = await response.json();
      throw new Error(errorResult.error || 'Failed to record click');
    }

    const result = await response.json();
    console.log(`Successfully recorded click for station ${stationUuid}: ${result.message}`);
  } catch (error) {
    console.error(`Exception recording click for station ${stationUuid}:`, error);
  }
}

export const fetchGenres = async (): Promise<string[]> => {
  console.log("Fetching, sorting, and cleaning genres...");
  try {
    const tags = await fetchJson<Tag[]>('/api/radio/genres');

    const sortedTags = tags.sort((a, b) => b.stationcount - a.stationcount);

    const genres = sortedTags
      .slice(0, 40)
      .map((tag) => tag.name.trim())
      .filter(
        (name) =>
          name.length > 2 &&
          !/^\d+s?$/.test(name) &&
          !/^\d+kbps$/.test(name) &&
          !["news", "talk", "sports"].includes(name.toLowerCase())
      )
      .map((name) => name.charAt(0).toUpperCase() + name.slice(1));

    console.log(`Found and cleaned ${genres.length} top genres.`);
    return genres;
  } catch (error) {
    console.error("Error fetching genres:", error);
    return [];
  }
};

export const searchStations = async (query: string): Promise<Station[]> => {
  if (!query.trim()) {
    return fetchStations(50);
  }

  console.log(`Searching stations for: "${query}"`);
  try {
    const stations = await fetchJson<RadioApiStation[]>(
      `/api/radio/search?query=${encodeURIComponent(query)}`
    );

    console.log(`Found ${stations.length} stations for query: "${query}"`);
    return stations.map(mapApiStation);
  } catch (error) {
    console.error("Error searching stations:", error);
    throw new Error("Failed to search stations");
  }
};
