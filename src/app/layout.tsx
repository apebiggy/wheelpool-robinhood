import type { Metadata } from "next";
import { NextAbstractWalletProvider } from "./components/agw-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "WheelPool — Robinhood Chain",
  description: "On-chain prize pool dApp on Robinhood Chain",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <NextAbstractWalletProvider>
          {children}
        </NextAbstractWalletProvider>
      </body>
    </html>
  );
}
