import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'KisanMitra | GenAI Finger Millet Disease Platform',
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
      <body className="antialiased bg-emerald-950 text-slate-100 min-h-screen w-screen overflow-x-hidden flex flex-col">
        <main className="flex-1 w-full min-h-screen flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
