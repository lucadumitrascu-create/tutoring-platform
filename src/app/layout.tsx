import type { Metadata } from 'next';
import { Inter, Caveat } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });
const caveat = Caveat({ subsets: ['latin'], variable: '--font-caveat' });

export const metadata: Metadata = {
  title: 'Tutoring Platform',
  description: 'Private and group lessons online',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${caveat.variable}`}>{children}</body>
    </html>
  );
}
