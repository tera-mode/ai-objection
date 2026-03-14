'use client';

import { Mic, Volume2, Loader2, Square } from 'lucide-react';
import { VoiceState } from '@/hooks/useVoiceChat';

interface VoiceButtonProps {
  voiceState: VoiceState;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
}

export function VoiceButton({ voiceState, onStart, onStop, disabled }: VoiceButtonProps) {
  const isRecording = voiceState === 'recording';
  const isProcessing = voiceState === 'processing';
  const isSpeaking = voiceState === 'speaking';

  const handleClick = () => {
    if (isRecording) {
      onStop();
    } else {
      onStart();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isProcessing || isSpeaking}
      aria-label={isRecording ? '録音停止' : '音声入力'}
      className={`
        flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all
        ${isRecording ? 'animate-pulse scale-110 bg-red-500 shadow-lg shadow-red-500/40' : ''}
        ${isProcessing || isSpeaking ? 'cursor-not-allowed bg-gray-600' : ''}
        ${!isRecording && !isProcessing && !isSpeaking ? 'bg-cyan-600 hover:bg-cyan-500 active:scale-95' : ''}
      `}
    >
      {isProcessing && <Loader2 className="h-4 w-4 animate-spin text-white" />}
      {isSpeaking && <Volume2 className="h-4 w-4 animate-bounce text-white" />}
      {isRecording && <Square className="h-3.5 w-3.5 fill-white text-white" />}
      {voiceState === 'idle' && <Mic className="h-4 w-4 text-white" />}
    </button>
  );
}
