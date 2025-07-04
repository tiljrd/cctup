import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ClientOnly } from '@/components/client-only';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CCIP Widget Examples',
  description: 'View CCIP Widgets',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen`}>
        <main className="min-h-screen">
          <ClientOnly>{children}</ClientOnly>
        </main>
      </body>
    </html>
  );
}
