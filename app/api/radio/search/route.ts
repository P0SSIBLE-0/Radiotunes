import { NextResponse } from 'next/server';
import { withRadioApi } from '../client';
import { handleApiError } from '../helpers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  try {
    const query = searchParams.get('query') || '';
    const searchResults = await withRadioApi((api) =>
      api.searchStations({ name: query, limit: 50, hideBroken: true, hasGeoInfo: true })
    );
    return NextResponse.json(searchResults);
  } catch (error) {
    return handleApiError(error, 'Failed to search stations');
  }
}
