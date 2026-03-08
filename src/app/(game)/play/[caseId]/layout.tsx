import { GameProvider } from '@/contexts/GameContext';

export default function CaseLayout({ children }: { children: React.ReactNode }) {
  return <GameProvider>{children}</GameProvider>;
}
