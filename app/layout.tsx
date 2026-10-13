import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'ANIZEN - Modern Anime Discovery & Streaming',
  description: 'Explore trending anime, current seasonal releases, top-rated shows, and watch episodes seamlessly on ANIZEN.',
  keywords: ['anime', 'anime discovery', 'watch anime', 'anime streaming', 'ANIZEN'],
  authors: [{ name: 'ANIZEN Team' }],
  icons: {
    icon: '/favicon.ico',
  },
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
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
