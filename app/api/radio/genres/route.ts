import { NextResponse } from 'next/server';
import { RadioBrowserApi } from 'radio-browser-api';

const api = new RadioBrowserApi('My Radio App');
api.setBaseUrl('https://de1.api.radio-browser.info');

const handleError = (error: any, message: string) => {
  console.error(message, error);
  return NextResponse.json({ error: message }, { status: 500 });
};

export async function GET() {
  try {
    const tags = await api.getTags();
    return NextResponse.json(tags);
  } catch (error) {
    return handleError(error, 'Failed to fetch genres');
  }
}
