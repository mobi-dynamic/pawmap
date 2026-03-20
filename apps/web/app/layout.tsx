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
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,230,204,0.32),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(189,214,255,0.22),_transparent_28%)]">
          <header className="border-b border-[#e8ddd0] bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(255,248,239,0.82))] backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
              <Link href="/" className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#6b4f36] text-lg text-white shadow-sm">
                  🐾
                </span>
                <div>
                  <p className="text-lg font-semibold text-slate-900">PawMap</p>
                  <p className="text-sm text-slate-500">Dog policy before you go</p>
                </div>
              </Link>
              <div className="flex items-center gap-3">
                <Link
                  href="/admin/moderation"
                  className="hidden rounded-full border border-[#dfd2c4] bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-[#ccb8a3] hover:bg-[#fdf8f1] md:inline-flex"
                >
                  Admin moderation
                </Link>
                <div className="hidden rounded-full border border-[#e9decf] bg-[#faf4eb] px-4 py-2 text-sm text-slate-600 md:block">Melbourne</div>
              </div>
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
        </div>
      </body>
    </html>
  );
}
