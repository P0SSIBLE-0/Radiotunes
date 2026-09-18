import { NextResponse } from 'next/server';
import { withRadioApi } from '../client';

export async function POST(request: Request) {
  const { stationId } = await request.json();

  if (!stationId) {
    return NextResponse.json({ error: 'Station ID is required' }, { status: 400 });
  }

  // Don't wait for the external API call to finish.
  // This makes the client-side experience much faster.
  withRadioApi((api) => api.sendStationClick(stationId)).catch(console.error);

  // Immediately return a success response.
  return NextResponse.json({ ok: true, message: 'Click recorded' });
}
