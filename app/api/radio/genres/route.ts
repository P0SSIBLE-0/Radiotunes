import { NextResponse } from 'next/server';
import { withRadioApi } from '../client';
import { handleApiError } from '../helpers';

export async function GET() {
  try {
    const tags = await withRadioApi((api) => api.getTags());
    return NextResponse.json(tags);
  } catch (error) {
    return handleApiError(error, 'Failed to fetch genres');
  }
}
