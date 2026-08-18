import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ragi-Rakshak | GenAI Finger Millet Disease Platform',
  description: 'Progressive Web Application for finger millet disease detection, advisory, and weather fusion.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#16a34a" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body className="antialiased bg-agri-dark text-gray-100 flex flex-col min-h-screen">
        <header className="sticky top-0 z-50 bg-agri-card/90 backdrop-blur-md border-b border-agri-700/30 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-agri-600 flex items-center justify-center font-bold text-white shadow-md">
              🌾
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight text-white leading-none">Ragi-Rakshak</h1>
              <span className="text-[10px] text-agri-500 font-mono">GenAI Advisory Platform</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-agri-900/80 text-agri-400 border border-agri-700/50 px-2 py-0.5 rounded-full font-mono">
              Phase 1
            </span>
          </div>
        </header>

        <main className="flex-1 max-w-md w-full mx-auto p-4 sm:max-w-xl md:max-w-4xl">
          {children}
        </main>

        <footer className="border-t border-agri-700/30 p-4 text-center text-xs text-gray-500">
          Ragi-Rakshak &copy; {new Date().getFullYear()} &bull; LTTS Smart Agriculture (SRS-WEB-AGRI-004)
        </footer>
      </body>
    </html>
  );
}
