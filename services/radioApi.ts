import type { Station } from "@/types/radio.t";
import { type Station as RadioApiStation } from 'radio-browser-api';

// Define a local Tag type as it's not exported from the library
type Tag = {
  name: string;
  stationcount: number;
};


// Helper function to map API station to our app's Station interface
const mapApiStation = (s: RadioApiStation): Station => ({
  changeuuid: s.changeId,
  stationuuid: s.id,
  name: s.name,
  url: s.url,
  url_resolved: s.urlResolved,
  homepage: s.homepage,
  favicon: s.favicon,
  tags: typeof s.tags
    ? (s.tags as string[])
      .map((t: any) => t.trim().toLowerCase())
      .filter(Boolean)
    : [],
  country: s.country,
  countrycode: s.countryCode,
  state: s.state,
  language:
    typeof s.language === "string"
      ? (s.language as string)
        .split(",")
        .map((t: any) => t.trim().toLowerCase())
        .filter(Boolean)
      : [],
  votes: s.votes,
  codec: s.codec,
  bitrate: s.bitrate,
  hls: s.hls === !!1,
  lastcheckok: s.lastCheckOk,
  clickcount: s.clickCount,
  geo_lat: s.geoLat,
  geo_long: s.geoLong,
});

export async function fetchStations(
  limit: number = 500,
  offset: number = 0
): Promise<Station[]> {
  console.log(`Fetching ${limit} stations with offset ${offset}...`);
  try {
    const response = await fetch(`/api/radio/stations?limit=${limit}&offset=${offset}`);
    if (!response.ok) {
      throw new Error('Failed to fetch stations');
    }
    const stationsFromServer: RadioApiStation[] = await response.json();
    console.log("Raw stations fetched from server:", stationsFromServer.length);

    if (stationsFromServer.length === 0) {
      console.warn(
        "No stations returned from API for this chunk. This may be the end of the list."
      );
    }

    return stationsFromServer.map(mapApiStation);
  } catch (error: any) {
    console.error("Error fetching stations:", error);
    throw new Error(`Failed to fetch stations: ${error.message}`);
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
    const response = await fetch('/api/radio/genres');
    if (!response.ok) {
      throw new Error('Failed to fetch genres');
    }
    const tags: Tag[] = await response.json();

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
    const response = await fetch(`/api/radio/search?query=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error('Failed to search stations');
    }
    const stations: RadioApiStation[] = await response.json();

    console.log(`Found ${stations.length} stations for query: "${query}"`);
    return stations.map(mapApiStation);
  } catch (error) {
    console.error("Error searching stations:", error);
    throw new Error("Failed to search stations");
  }
};
