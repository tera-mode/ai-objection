import { GameProvider } from '@/contexts/GameContext';
import { TipsProvider } from '@/components/tips/TipsProvider';

export default function CaseLayout({ children }: { children: React.ReactNode }) {
  return (
    <GameProvider>
      <TipsProvider>{children}</TipsProvider>
    </GameProvider>
  );
}
