import { NextRequest, NextResponse } from 'next/server';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { verifyAuth } from '@/lib/auth/verifyAuth';

// 犯人の性別に応じた音声
const VOICE_MAP: Record<string, string> = {
  male: 'ja-JP-Neural2-C',    // 男性・落ち着き
  female: 'ja-JP-Neural2-B',  // 女性・明るめ
};

function getTtsClient() {
  return new TextToSpeechClient({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    credentials: {
      client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      private_key: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
  });
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { text, gender = 'male' } = await request.json();
  if (!text) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 });
  }

  // 500文字でカット（TTS応答速度維持）
  const truncatedText = text.length > 500 ? text.slice(0, 500) + '…' : text;
  const voiceName = VOICE_MAP[gender] ?? VOICE_MAP['male'];

  const client = getTtsClient();
  const [response] = await client.synthesizeSpeech({
    input: { text: truncatedText },
    voice: {
      languageCode: 'ja-JP',
      name: voiceName,
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: 1.0,
      pitch: 0,
    },
  });

  const audioBase64 = Buffer.from(response.audioContent as Uint8Array).toString('base64');
  return NextResponse.json({ audioBase64 });
}
