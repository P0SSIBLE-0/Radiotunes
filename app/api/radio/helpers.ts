import { NextResponse } from 'next/server';

// Shared error handler for radio API routes.
export const handleApiError = (error: unknown, message: string) => {
  console.error(message, error);
  return NextResponse.json({ error: message }, { status: 500 });
};
