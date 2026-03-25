'use client';

interface CoherenceMeterProps {
  coherence: number;
  maxCoherence?: number;
}

export function CoherenceMeter({ coherence, maxCoherence = 100 }: CoherenceMeterProps) {
  const pct = maxCoherence > 0 ? Math.min(1, Math.max(0, coherence / maxCoherence)) : 0;

  const getColor = () => {
    if (pct >= 0.7) return 'bg-cyan-500';
    if (pct >= 0.4) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getLabel = () => {
    if (pct >= 0.8) return '冷静';
    if (pct >= 0.6) return 'やや動揺';
    if (pct >= 0.4) return '動揺';
    if (pct >= 0.2) return '混乱';
    return '崩壊寸前';
  };

  const isLow = pct < 0.3;

  return (
    <div className="flex flex-col gap-1" data-testid="coherence-meter">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-stone-500">容疑者の動揺度</span>
        <span data-testid="coherence-value" className={`font-bold ${isLow ? 'animate-pulse text-red-500' : 'text-stone-700'}`}>
          {getLabel()} ({coherence})
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-stone-200">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getColor()} ${isLow ? 'animate-pulse' : ''}`}
          style={{ width: `${pct * 100}%` }}
        />
      </div>
    </div>
  );
}
