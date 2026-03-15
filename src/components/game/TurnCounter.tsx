'use client';

interface TurnCounterProps {
  turn: number;
  maxTurns?: number;
}

export function TurnCounter({ turn, maxTurns = 15 }: TurnCounterProps) {
  const remaining = maxTurns - turn;
  const isLow = remaining <= 3;

  return (
    <div className="flex items-center gap-1 text-xs">
      <span className="text-stone-500">残り</span>
      <span className={`font-bold ${isLow ? 'animate-pulse text-red-500' : 'text-amber-600'}`}>
        {remaining}
      </span>
      <span className="text-stone-500">ターン</span>
    </div>
  );
}
