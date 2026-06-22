import type { Metadata, Viewport } from "next";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: {
    default: "Nestly — Your household, organized",
    template: "%s · Nestly",
  },
  description:
    "A calm, shared space for your household finances, goals and everyday life.",
  applicationName: "Nestly",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F7F8F6",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
