'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { BottomNav } from '@/components/navigation/BottomNav';

export default function GameLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // 尋問画面ではBottomNavを非表示（ゲーム専用フッターを使う）
  const hideBottomNav = pathname.includes('/interrogation');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen flex-col bg-gray-950">
      <main className={`flex-1 ${hideBottomNav ? '' : 'pb-16'}`}>{children}</main>
      {!hideBottomNav && <BottomNav />}
    </div>
  );
}
