import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Trainera - Cocina Vasca | Reservas",
    template: "%s | Trainera",
  },
  description: "Reservá tu mesa en Trainera, cocina vasca tradicional en Rosario. Horarios: martes a sábado 19:00 a 23:00.",
  keywords: ["restaurante", "cocina vasca", "reservas", "Rosario", "Trainera"],
  authors: [{ name: "Trainera" }],
  openGraph: {
    title: "Trainera - Cocina Vasca",
    description: "Reservá tu mesa en Trainera, cocina vasca tradicional en Rosario.",
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://trainera.com.ar',
    siteName: "Trainera",
    locale: "es_AR",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} overflow-x-hidden`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
