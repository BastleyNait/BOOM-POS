import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BOOM POS - Punto de Venta Ultra-Eficiente",
  description: "Punto de Venta y Sistema ERP de alta velocidad optimizado para Vercel y Supabase.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      data-theme="light"
      className={`${geist.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('boom-pos-theme');
                  if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
                } catch(e) {}
              })();
            `
          }}
        />
      </head>
      <body className="h-full flex bg-base overflow-hidden" suppressHydrationWarning>
        <Sidebar />
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          <ToastProvider />
          <ConfirmModal />
          {children}
        </div>
      </body>
    </html>
  );
}
