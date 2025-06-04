// Import values and types separately for clarity and to satisfy verbatimModuleSyntax
import { RadioBrowserApi } from 'radio-browser-api';
import type { Station as RadioApiStationFromServer } from 'radio-browser-api';

// Initialize the API with a user agent
const api = new RadioBrowserApi('RadioGlobeApp/1.0');

// This is the Station interface our application components will use.
export interface Station {
  changeuuid: string;
  stationuuid: string; // Mapped from id
  name: string;
  url: string;
  url_resolved: string; // Mapped from urlResolved
  homepage: string;
  favicon: string;
  tags: string[];
  country: string;
  countrycode: string;
  iso_3166_2: string | null;
  state: string;
  language: string[];
  languagecodes: string[];
  votes: number;
  lastchangetime_iso8601: string;
  codec: string;
  bitrate: number;
  hls: boolean;
  lastcheckok: boolean;
  lastcheckoktime_iso8601: string;
  clickcount: number;
  clicktrend: number;
  geo_lat?: number | null;
  geo_long?: number | null;
}
export async function fetchStations(limit: number = 500): Promise<Station[]> {
  console.log('Fetching stations using radio-browser-api...');
  try {
    // Fetch stations using the library
    const stationsFromServer: RadioApiStationFromServer[] = await api.searchStations({
      limit: limit,
      hasGeoInfo: true,
      order: 'random',
      hideBroken: true,
    });
    console.log('Raw stations fetched from server:', stationsFromServer.length);
    console.log('Sample station:', stationsFromServer[0]); // Log sample for debugging

    if (stationsFromServer.length === 0) {
      console.warn('No stations returned from API. Check filters or API status.');
    }

    // Map to our application's Station interface
    const mappedStations = stationsFromServer.map((s: RadioApiStationFromServer): Station => {
      return {
        changeuuid: s.changeuuid,
        stationuuid: s.id,
        name: s.name || 'Unknown',
        url: s.url || '',
        url_resolved: s.urlResolved || s.url || '',
        homepage: s.homepage || '',
        favicon: s.favicon || '',
        tags: Array.isArray(s.tags) ? s.tags : (s.tags ? s.tags.split(',') : []),
        country: s.country || '',
        countrycode: s.countryCode || '',
        iso_3166_2: s.iso_3166_2 ?? null,
        state: s.state || '',
        language: Array.isArray(s.language) ? s.language : (s.language ? [s.language] : []),
        languagecodes: s.languagecodes || [],
        votes: s.votes || 0,
        lastchangetime_iso8601: s.lastChangeTime instanceof Date 
          ? s.lastChangeTime.toISOString() 
          : (s.lastchangetime_iso8601 || new Date(0).toISOString()),
        codec: s.codec || '',
        bitrate: s.bitrate || 0,
        hls: s.hls || 0,
        lastcheckok: s.lastCheckOk || false,
        lastcheckoktime_iso8601: s.lastCheckOkTime instanceof Date 
          ? s.lastCheckOkTime.toISOString() 
          : (s.lastcheckoktime_iso8601 || new Date(0).toISOString()),
        clickcount: s.clickCount || 0,
        clicktrend: s.clickTrend || 0,
        geo_lat: s.geoLat ?? undefined,
        geo_long: s.geoLong ?? undefined,
      };
    });

    console.log('Mapped stations count:', mappedStations.length);
    return mappedStations;
  } catch (error) {
    console.error('Error fetching stations with radio-browser-api:', error);
    throw new Error(`Failed to fetch stations: ${error.message}`); // Throw error instead of returning []
  }
}

export async function recordStationClick(stationUuid: string): Promise<void> {
  console.log(`Recording click for station ${stationUuid} using api.sendStationClick`);
  try {
    const response = await api.sendStationClick(stationUuid);
    if (response && response.ok) {
      console.log(`Successfully recorded click for station ${stationUuid}: ${response.message}`);
    } else {
      console.error(`Error recording click for station ${stationUuid}:`, response?.message || 'Unknown error from API');
    }
  } catch (error) {
    console.error(`Exception recording click for station ${stationUuid}:`, error);
    if (error instanceof Error) {
        console.error('Error details:', error.message);
    }
  }
}