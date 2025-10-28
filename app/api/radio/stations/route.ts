import { NextResponse } from 'next/server';
import { RadioBrowserApi } from 'radio-browser-api';

const api = new RadioBrowserApi('My Radio App');
api.setBaseUrl('https://de1.api.radio-browser.info');

const handleError = (error: any, message: string) => {
  console.error(message, error);
  return NextResponse.json({ error: message }, { status: 500 });
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
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
    return handleError(error, 'Failed to fetch stations');
  }
}
