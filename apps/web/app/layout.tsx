import type { Metadata } from 'next';
import Link from 'next/link';

import './globals.css';

export const metadata: Metadata = {
  title: 'PawMap',
  description: 'Search dog-friendly places with clear policy signals.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(189,214,255,0.35),_transparent_45%)]">
          <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
              <Link href="/" className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-lg text-white">
                  🐾
                </span>
                <div>
                  <p className="text-lg font-semibold text-slate-900">PawMap</p>
                  <p className="text-sm text-slate-500">Dog policy before you go</p>
                </div>
              </Link>
              <div className="hidden rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600 md:block">
                Melbourne MVP preview
              </div>
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
        </div>
      </body>
    </html>
  );
}
