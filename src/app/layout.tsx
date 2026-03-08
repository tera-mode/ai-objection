import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'AI Objection - AIが演じる犯人を追い詰めろ',
  description: 'AIが演じる犯人に自由に質問し、矛盾を暴いて逮捕に追い込む推理ゲーム',
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'AI Objection - AIが演じる犯人を追い詰めろ',
    description: 'AIが演じる犯人に自由に質問し、矛盾を暴いて逮捕に追い込む推理ゲーム',
    url: 'https://ai-objection.aigame.media',
    siteName: 'AI Objection',
    locale: 'ja_JP',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
