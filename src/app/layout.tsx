import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const vipnagorgialla = localFont({
  src: "../../public/fonts/Vipnagorgialla.otf",
  variable: "--font-vipnagorgialla",
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
        className={`${vipnagorgialla.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
