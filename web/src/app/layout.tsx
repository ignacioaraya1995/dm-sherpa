import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
  title: 'DM Sherpa - Direct Mail Performance OS',
  description: 'Optimize your direct mail campaigns with data-driven insights',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased bg-dark-900 text-text-primary">
        <Providers>
          {/* Background gradient and noise texture */}
          <div className="fixed inset-0 bg-gradient-radial from-dark-800 via-dark-900 to-dark-950 pointer-events-none" />
          <div className="fixed inset-0 opacity-[0.015] bg-noise pointer-events-none" />

          {/* Main layout */}
          <div className="relative flex h-screen">
            <Sidebar />
            <main className="flex-1 overflow-auto">
              <div className="p-6 min-h-full">
                {children}
              </div>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
