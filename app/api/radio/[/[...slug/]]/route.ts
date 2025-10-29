import { NextResponse } from "next/server";
import { RadioBrowserApi } from 'radio-browser-api';

const api = new RadioBrowserApi('My Radio App');
api.setBaseUrl('https://de1.api.radio-browser.info');

// Helper function to handle errors
const handleError = (error: any, message: string) => {
  console.error(message, error);
  return NextResponse.json({ error: message }, { status: 500 });
};

export async function GET(request: Request) {
  const { searchParams, pathname } = new URL(request.url);
  const path = pathname.replace('/api/radio/', '');

  try {
    if (path === 'stations') {
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
    } else if (path === 'genres') {
      const tags = await api.getTags();
      return NextResponse.json(tags);
    } else if (path === 'search') {
      const query = searchParams.get('query') || '';
      const searchResults = await api.searchStations({ name: query, limit: 50, hideBroken: true, hasGeoInfo: true });
      return NextResponse.json(searchResults);
    }

    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  } catch (error) {
    return handleError(error, `Failed to fetch ${path}`);
  }
}

