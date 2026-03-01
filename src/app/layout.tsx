import type { Metadata } from "next";
import localFont from "next/font/local";
import { Providers } from "./providers";
import "./globals.css";

const vipnagorgialla = localFont({
  src: "../../public/fonts/Vipnagorgialla.otf",
  variable: "--font-vipnagorgialla",
  display: "swap",
});

const satoshi = localFont({
  src: [
    { path: "../../public/fonts/Satoshi-Regular.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/Satoshi-Medium.woff2", weight: "500", style: "normal" },
    { path: "../../public/fonts/Satoshi-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-satoshi",
  display: "swap",
});

export const metadata: Metadata = {
  title: "EcoForge",
  description: "Tokenize and trade carbon credits on Avalanche",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `history.scrollRestoration="manual";window.scrollTo(0,0);` }} />
      </head>
      <body
        className={`${vipnagorgialla.variable} ${satoshi.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
