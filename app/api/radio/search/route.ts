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
    const query = searchParams.get('query') || '';
    const searchResults = await api.searchStations({ name: query, limit: 50, hideBroken: true, hasGeoInfo: true });
    return NextResponse.json(searchResults);
  } catch (error) {
    return handleError(error, 'Failed to search stations');
  }
}
