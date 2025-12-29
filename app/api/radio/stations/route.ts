import { NextResponse } from 'next/server';
import { RadioBrowserApi } from 'radio-browser-api';

const api = new RadioBrowserApi('My Radio App');
// api.setBaseUrl('https://de1.api.radio-browser.info');
api.setBaseUrl('https://fi1.api.radio-browser.info');

const fetchStations = async (searchParams: URLSearchParams) => {
  try {
    const limit = parseInt(searchParams.get('limit') || '500', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const stations = await api.searchStations({
      limit,
      offset,
      hasGeoInfo: true,
      order: 'clickCount',
      reverse: true,
      hideBroken: true,
    });
    return NextResponse.json(stations);
  } catch (error) {
    console.log('error while fetching stations: ', error);
    api.setBaseUrl('https://de2.api.radio-browser.info');
    return fetchStations(searchParams);
  }
}
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  return fetchStations(searchParams);
}
