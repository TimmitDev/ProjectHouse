import type { Metadata, Viewport } from "next";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: {
    default: "Nestly — je huishouden op orde",
    template: "%s · Nestly",
  },
  description:
    "Een rustige, gedeelde plek voor huishoudfinanciën, doelen en het dagelijks leven.",
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
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
