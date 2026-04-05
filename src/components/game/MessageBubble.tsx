'use client';

import { ChatMessage } from '@/types/game';

interface MessageBubbleProps {
  message: ChatMessage;
  criminalName?: string;
}

/**
 * 犯人の長い発言を読みやすい単位に分割する。
 * 括弧（）の地の文は除去し、句点・感嘆符・疑問符で区切る。
 */
function splitCriminalMessage(text: string): string[] {
  // 括弧による動作・情景描写を除去（プロンプトで禁止済みだがフォールバックとして）
  const cleaned = text.replace(/（[^）]*）/g, '').replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();

  const segments: string[] = [];
  let current = '';

  for (let i = 0; i < cleaned.length; i++) {
    current += cleaned[i];
    const ch = cleaned[i];

    // 文末記号で、ある程度長さがあればここで区切る
    // ！？のような連続する文末記号はまとめて取り込んでから区切る（別吹き出し防止）
    if ('。！？'.includes(ch) && current.length >= 15) {
      while (i + 1 < cleaned.length && '。！？'.includes(cleaned[i + 1])) {
        i++;
        current += cleaned[i];
      }
      segments.push(current.trim());
      current = '';
    } else if (current.length >= 55 && (cleaned[i] === ' ' || cleaned[i] === '　')) {
      // スペースで区切れるなら区切る
      segments.push(current.trim());
      current = '';
    }
  }

  if (current.trim()) segments.push(current.trim());
  return segments.filter((s) => s.length > 0);
}

export function MessageBubble({ message, criminalName }: MessageBubbleProps) {
  const isPlayer = message.role === 'player';

  if (!isPlayer) {
    const segments = splitCriminalMessage(message.content);
    return (
      <div className="flex flex-col gap-1 items-start" data-testid="criminal-message">
        {segments.map((seg, i) => (
          <div
            key={i}
            className="max-w-[80%] rounded-2xl rounded-bl-sm border border-stone-200 bg-white px-4 py-3 text-sm leading-relaxed"
          >
            {i === 0 && (
              <p className="mb-1 text-xs font-semibold text-amber-600">{criminalName ?? '容疑者'}</p>
            )}
            <p>{seg}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 items-end" data-testid="player-message">
      <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-amber-500 px-4 py-3 text-sm leading-relaxed text-white">
        <p>{message.content}</p>
      </div>
    </div>
  );
}
