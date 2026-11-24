// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import MantineClientProvider from "@/components/MantineClientProvider";
import { Outfit, Inter } from "next/font/google"; // 🔥 Importamos las fuentes

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["400", "500", "600", "700", "800"]
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter"
});

export const metadata: Metadata = {
  title: "FlyControl",
  description: "Servicio Control de Vuelos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${outfit.variable} ${inter.variable}`}>
      <body>
        <MantineClientProvider>
          {children}
        </MantineClientProvider>
      </body>
    </html>
  );
}