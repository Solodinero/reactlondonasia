import "./globals.css";
import Link from "next/link";
import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }): JSX.Element {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 min-h-screen">
        <nav className="border-b border-gray-800 px-6 py-4 flex gap-4">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/signals">Signals</Link>
          <Link href="/backtest">Backtest</Link>
        </nav>
        {children}
      </body>
    </html>
  );
}
