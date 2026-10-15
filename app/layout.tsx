import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BottomNav from '@/components/BottomNav';
import PWAInstall from '@/components/PWAInstall';

export const metadata: Metadata = {
  title: 'ANIZEN - Modern Anime Discovery & Streaming',
  description: 'Explore trending anime, current seasonal releases, top-rated shows, and watch episodes seamlessly on ANIZEN.',
  keywords: ['anime', 'anime discovery', 'watch anime', 'anime streaming', 'ANIZEN', 'PWA'],
  authors: [{ name: 'ANIZEN Team' }],
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0a0c',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="flex min-h-screen flex-col bg-brand-dark text-brand-text antialiased selection:bg-brand-accent selection:text-white">
        <Navbar />
        <main className="flex-1 pb-16 md:pb-0">{children}</main>
        <PWAInstall />
        <Footer />
        <BottomNav />
      </body>
    </html>
  );
}
