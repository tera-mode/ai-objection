'use client';

import { useState, useRef, useEffect } from 'react';

const MAX_INPUT_LENGTH = 300;

interface InputAreaProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function InputArea({ onSend, disabled, placeholder }: InputAreaProps) {
  const [value, setValue] = useState('');
  const [showLimitAlert, setShowLimitAlert] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  useEffect(() => {
    // スマホでは自動フォーカスしない（iOSの自動ズーム防止）
    if (!disabled && window.matchMedia('(pointer: fine)').matches) {
      textareaRef.current?.focus();
    }
  }, [disabled]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length > MAX_INPUT_LENGTH) {
      setValue(newValue.slice(0, MAX_INPUT_LENGTH));
      setShowLimitAlert(true);
      setTimeout(() => setShowLimitAlert(false), 3000);
    } else {
      setValue(newValue);
      if (newValue.length >= MAX_INPUT_LENGTH - 20) {
        setShowLimitAlert(true);
      } else {
        setShowLimitAlert(false);
      }
    }
  };

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
    setShowLimitAlert(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-end gap-2 border-t border-stone-200 bg-white p-3" data-testid="player-input">
      <div className="flex flex-col w-full gap-1">
        {showLimitAlert && (
          <div className="flex items-center gap-1.5 text-xs animate-in fade-in slide-in-from-top-1 duration-200">
            {value.length >= MAX_INPUT_LENGTH ? (
              <span className="text-red-500 font-medium">
                ⚠️ {MAX_INPUT_LENGTH}文字までしか入力できないのだ！
              </span>
            ) : (
              <span className="text-amber-500">
                あと{MAX_INPUT_LENGTH - value.length}文字なのだ
              </span>
            )}
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={placeholder ?? '容疑者に質問する...'}
            rows={1}
            maxLength={MAX_INPUT_LENGTH}
            className="flex-1 resize-none rounded-xl border border-stone-300 bg-stone-50 px-4 py-3 text-base text-stone-900 placeholder-stone-400 focus:border-amber-400 focus:outline-none disabled:opacity-50"
            style={{ maxHeight: '120px' }}
          />
          <button
            onClick={handleSend}
            disabled={disabled || !value.trim()}
            data-testid="send-button"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white transition-colors hover:bg-amber-400 disabled:opacity-40"
          >
            {disabled ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <svg className="h-5 w-5 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
        {value.length > 0 && (
          <div className="text-right text-xs text-stone-400">
            <span className={value.length >= MAX_INPUT_LENGTH - 20 ? 'text-amber-500 font-medium' : ''}>
              {value.length}
            </span>
            /{MAX_INPUT_LENGTH}
          </div>
        )}
      </div>
    </div>
  );
}
