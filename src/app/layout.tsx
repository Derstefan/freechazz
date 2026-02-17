import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FreeChazz',
  description: 'A chess variant with procedurally generated pieces',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-white h-screen overflow-hidden">
        {children}
      </body>
    </html>
  );
}
