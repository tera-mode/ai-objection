import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verifyAuth';
import path from 'path';
import fs from 'fs';

export async function GET(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('eventId');

  if (!eventId || !/^[a-z0-9_]+$/.test(eventId)) {
    return NextResponse.json({ error: 'Invalid eventId' }, { status: 400 });
  }

  const filePath = path.join(process.cwd(), 'data', 'events', `${eventId}.json`);
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  return NextResponse.json(JSON.parse(raw));
}
