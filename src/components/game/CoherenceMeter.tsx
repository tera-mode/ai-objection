'use client';

interface CoherenceMeterProps {
  coherence: number;
}

export function CoherenceMeter({ coherence }: CoherenceMeterProps) {
  const getColor = () => {
    if (coherence >= 70) return 'bg-cyan-500';
    if (coherence >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getLabel = () => {
    if (coherence >= 80) return '冷静';
    if (coherence >= 60) return 'やや動揺';
    if (coherence >= 40) return '動揺';
    if (coherence >= 20) return '混乱';
    return '崩壊寸前';
  };

  const isLow = coherence < 30;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-gray-400">容疑者の動揺度</span>
        <span className={`font-bold ${isLow ? 'animate-pulse text-red-400' : 'text-gray-300'}`}>
          {getLabel()} ({coherence})
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-700">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getColor()} ${isLow ? 'animate-pulse' : ''}`}
          style={{ width: `${coherence}%` }}
        />
      </div>
    </div>
  );
}
