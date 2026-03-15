'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { authenticatedFetch } from '@/lib/api/authenticatedFetch';
import { EventData } from '@/types/event';
import EventPlayer from '@/components/event/EventPlayer';

export default function EventPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId as string;

  const [eventData, setEventData] = useState<EventData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) return;

    authenticatedFetch(`/api/get-event?eventId=${encodeURIComponent(eventId)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Event not found: ${eventId}`);
        return res.json();
      })
      .then((data: EventData) => {
        setEventData(data);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message ?? 'イベントの読み込みに失敗しました');
      })
      .finally(() => setLoading(false));
  }, [eventId]);

  const handleComplete = () => {
    // 閲覧済みフラグを localStorage に保存
    if (typeof window !== 'undefined') {
      localStorage.setItem(`event_${eventId}_seen`, '1');
    }

    if (eventData?.onComplete.type === 'navigate') {
      router.push(eventData.onComplete.path);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-stone-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-400 border-t-transparent" />
      </div>
    );
  }

  if (error || !eventData) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-stone-900 text-stone-300">
        <p className="text-sm">{error ?? 'イベントが見つかりません'}</p>
        <button
          onClick={() => router.back()}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
        >
          戻る
        </button>
      </div>
    );
  }

  return <EventPlayer eventData={eventData} onComplete={handleComplete} />;
}
