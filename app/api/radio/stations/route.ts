import { NextResponse } from 'next/server';
import { withRadioApi } from '../client';
import { handleApiError } from '../helpers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  try {
    const limit = parseInt(searchParams.get('limit') || '500', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const stations = await withRadioApi((api) =>
      api.searchStations({
        limit,
        offset,
        hasGeoInfo: true,
        order: 'clickCount',
        reverse: true,
        hideBroken: true,
      })
    );
    return NextResponse.json(stations);
  } catch (error) {
    return handleApiError(error, 'Failed to fetch stations');
  }
}
