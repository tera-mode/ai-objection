'use client';

interface TurnCounterProps {
  turn: number;
  maxTurns?: number | null;
}

export function TurnCounter({ turn, maxTurns }: TurnCounterProps) {
  if (maxTurns == null) return <div data-testid="turn-counter" />;

  const remaining = maxTurns - turn;
  const isLow = remaining <= 3;

  return (
    <div className="flex items-center gap-1 text-xs" data-testid="turn-counter">
      <span className="text-stone-500">残り</span>
      <span className={`font-bold ${isLow ? 'animate-pulse text-red-500' : 'text-amber-600'}`}>
        {remaining}
      </span>
      <span className="text-stone-500">ターン</span>
    </div>
  );
}
