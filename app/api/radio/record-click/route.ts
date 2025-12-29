import { NextResponse } from 'next/server';
import { RadioBrowserApi } from 'radio-browser-api';

const api = new RadioBrowserApi('My Radio App');
api.setBaseUrl('https://fi1.api.radio-browser.info');

export async function POST(request: Request) {
  const { stationId } = await request.json();

  if (!stationId) {
    return NextResponse.json({ error: 'Station ID is required' }, { status: 400 });
  }

  // Don't wait for the external API call to finish.
  // This makes the client-side experience much faster.
  api.sendStationClick(stationId).catch(console.error);

  // Immediately return a success response.
  return NextResponse.json({ ok: true, message: 'Click recorded' });
}
