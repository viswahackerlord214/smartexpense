import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ExpenseProvider } from '@/context/ExpenseContext';
import { Navbar } from '@/components/layout/Navbar';
import { CategorizationModal } from '@/components/categorization/CategorizationModal';

export const metadata: Metadata = {
  title: 'SpendWise • Automated Personal Finance & Bank SMS Detection',
  description: 'Automated personal expense tracking via Apple Shortcuts & iOS push notifications.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SpendWise',
  },
};

export const viewport: Viewport = {
  themeColor: '#10b981',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased selection:bg-emerald-500 selection:text-zinc-950">
        <AuthProvider>
          <ExpenseProvider>
            <div className="flex flex-col min-h-screen pb-20 lg:pb-10">
              <Navbar />
              <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {children}
              </main>
              <CategorizationModal />
            </div>
          </ExpenseProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

