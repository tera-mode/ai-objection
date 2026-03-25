'use client';

import { useState } from 'react';
import { TipsListModal } from './TipsListModal';

export function TipsMenuButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded-full bg-stone-100 px-2 py-1 text-xs font-semibold text-stone-500 transition-colors hover:bg-stone-200 hover:text-stone-700"
        aria-label="Tipsを見る"
        data-testid="tips-menu-button"
      >
        <span className="font-bold">?</span>
        <span>Tips</span>
      </button>
      {open && <TipsListModal onClose={() => setOpen(false)} />}
    </>
  );
}
