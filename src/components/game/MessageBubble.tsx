'use client';

import { ChatMessage } from '@/types/game';

interface MessageBubbleProps {
  message: ChatMessage;
  criminalName?: string;
}

export function MessageBubble({ message, criminalName }: MessageBubbleProps) {
  const isPlayer = message.role === 'player';

  return (
    <div className={`flex flex-col gap-1 ${isPlayer ? 'items-end' : 'items-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isPlayer
            ? 'rounded-br-sm bg-cyan-600 text-white'
            : 'rounded-bl-sm border border-gray-700 bg-gray-800 text-gray-100'
        }`}
      >
        {!isPlayer && (
          <p className="mb-1 text-xs font-semibold text-cyan-400">{criminalName ?? '容疑者'}</p>
        )}
        <p>{message.content}</p>
      </div>

      {/* 矛盾検出はUIに表示しない（データはstateに保持） */}
    </div>
  );
}
