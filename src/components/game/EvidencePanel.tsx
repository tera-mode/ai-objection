'use client';

import { useState } from 'react';
import { Evidence } from '@/types/game';

interface EvidencePanelProps {
  evidence: Evidence[];
}

export function EvidencePanel({ evidence }: EvidencePanelProps) {
  const [selected, setSelected] = useState<Evidence | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* 証拠一覧ボタン */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-xs text-gray-300 transition-colors hover:border-cyan-500 hover:text-cyan-300"
      >
        <span>📁</span>
        <span>証拠 ({evidence.length})</span>
      </button>

      {/* モーダル */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
          onClick={() => { setIsOpen(false); setSelected(null); }}
        >
          <div
            className="w-full max-w-md rounded-t-2xl border border-gray-700 bg-gray-900 p-4 sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-cyan-400">証拠一覧</h3>
              <button
                onClick={() => { setIsOpen(false); setSelected(null); }}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {selected ? (
              <div>
                <button
                  onClick={() => setSelected(null)}
                  className="mb-3 text-xs text-cyan-400 hover:underline"
                >
                  ← 一覧に戻る
                </button>
                <h4 className="mb-2 font-semibold text-white">{selected.name}</h4>
                <p className="text-sm leading-relaxed text-gray-300">{selected.content}</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {evidence.map((ev) => (
                  <li key={ev.id}>
                    <button
                      onClick={() => setSelected(ev)}
                      className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-left text-sm text-gray-300 transition-colors hover:border-cyan-500 hover:text-white"
                    >
                      {ev.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
}
