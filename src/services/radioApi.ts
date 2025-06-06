import { RadioBrowserApi, type Station as RadioApiStation } from "radio-browser-api";
import type { Station } from "../types/radio.t";

// Initialize the API with a user agent
const api = new RadioBrowserApi("RadioGlobeApp/1.0");
//https://api.radio-browser.info/net you can see running server info here.
api.setBaseUrl("https://fi1.api.radio-browser.info");

// Helper function to map API station to our app's Station interface
const mapApiStation = (s: RadioApiStation): Station => ({
  changeuuid: s.changeId,
  stationuuid: s.id,
  name: s.name,
  url: s.url,
  url_resolved: s.urlResolved,
  homepage: s.homepage,
  favicon: s.favicon,
  tags: typeof s.tags === 'string'
  ? (s.tags as string).split(',').map((t: any) => t.trim()).filter(Boolean)
  : [],
  country: s.country,
  countrycode: s.countryCode,
  state: s.state,
  language: typeof s.language === 'string' ? (s.language as string).split(',').map((t:any) => t.trim()).filter(Boolean) : [],
  votes: s.votes,
  codec: s.codec,
  bitrate: s.bitrate,
  hls: s.hls === !!1,
  lastcheckok: s.lastCheckOk,
  clickcount: s.clickCount,
  geo_lat: s.geoLat,
  geo_long: s.geoLong,
});

export async function fetchStations(limit: number = 500): Promise<Station[]> {
  console.log("Fetching stations using radio-browser-api...");
  try {
    const stationsFromServer = await api.searchStations({
      limit: limit,
      hasGeoInfo: true,
      order: "random",
      hideBroken: true,
    });
    console.log("Raw stations fetched from server:", stationsFromServer.length);

    if (stationsFromServer.length === 0) {
      console.warn(
        "No stations returned from API. Check filters or API status."
      );
    }
    
    return stationsFromServer.map(mapApiStation);
  } catch (error: any) {
    console.error("Error fetching stations with radio-browser-api:", error);
    throw new Error(`Failed to fetch stations: ${error.message}`);
  }
}

export async function recordStationClick(stationUuid: string): Promise<void> {
  console.log(
    `Recording click for station ${stationUuid} using api.sendStationClick`
  );
  try {
    const response = await api.sendStationClick(stationUuid);
    if (response && response.ok) {
      console.log(
        `Successfully recorded click for station ${stationUuid}: ${response.message}`
      );
    } else {
      console.error(
        `Error recording click for station ${stationUuid}:`,
        response?.message || "Unknown error from API"
      );
    }
  } catch (error) {
    console.error(
      `Exception recording click for station ${stationUuid}:`,
      error
    );
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
  }
}

export const fetchGenres = async (): Promise<string[]> => {
  console.log("Fetching genres...");
  try {
    const tags = await api.getTags();

    // Filter out empty tags and return the names
    return tags.map((tag) => tag.name.trim()).filter((name) => name.length > 0);
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
    const stations = await api.searchStations({
      name: query,
      limit: 50,
      hideBroken: true,
      hasGeoInfo: true,
    });

    console.log(`Found ${stations.length} stations for query: "${query}"`);
    return stations.map(mapApiStation);
  } catch (error) {
    console.error("Error searching stations:", error);
    throw new Error("Failed to search stations");
  }
};