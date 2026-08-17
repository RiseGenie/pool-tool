import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lead Call Prep",
  description: "Research scorecard + personalized call script for pool construction leads.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <div className="mx-auto max-w-7xl px-4 py-6 print:max-w-none print:p-0">
          {children}
        </div>
      </body>
    </html>
  );
}
