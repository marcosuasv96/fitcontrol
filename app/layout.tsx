import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: 'FitControl | Software para centros de entrenamiento',
    template: '%s | FitControl',
  },
  description: 'Software de escritorio para gimnasios, boxes, estudios, academias y cualquier centro de entrenamiento: socios, accesos, caja, punto de venta e inventario. Funciona sin internet.',
  icons: {
    icon: '/logo.ico',
  },
};

// Sin maximumScale: bloquear el zoom impide leer a personas con baja visión
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#232529",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" data-scroll-behavior="smooth" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className="bg-slate-50 text-slate-900 min-h-screen font-sans selection:bg-marca-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
