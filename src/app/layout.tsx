import type { Metadata } from "next";
import { Fira_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

const firaSans = Fira_Sans({
  variable: "--font-fira-sans",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"]
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BOOM POS - Punto de Venta Ultra-Eficiente",
  description: "Punto de Venta y Sistema ERP de alta velocidad optimizado para Vercel y Supabase.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${firaSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Fira+Sans:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var observer = new MutationObserver(function(mutations) {
                  mutations.forEach(function(mutation) {
                    if (mutation.type === 'attributes') {
                      var target = mutation.target;
                      var attrName = mutation.attributeName;
                      if (attrName && attrName.indexOf('__processed_') === 0) {
                        target.removeAttribute(attrName);
                      }
                    }
                  });
                });
                observer.observe(document.documentElement, { attributes: true, subtree: true });
                
                document.addEventListener('DOMContentLoaded', function() {
                  if (document.body) {
                    var attrs = Array.prototype.slice.call(document.body.attributes);
                    attrs.forEach(function(attr) {
                      if (attr.name.indexOf('__processed_') === 0) {
                        document.body.removeAttribute(attr.name);
                      }
                    });
                  }
                });
              })();
            `
          }}
        />
      </head>
      <body className="min-h-full flex bg-slate-50 overflow-hidden" suppressHydrationWarning>
        <Sidebar />
        <div className="flex-1 flex flex-col h-screen overflow-y-auto relative">
          <ToastProvider />
          <ConfirmModal />
          {children}
        </div>
      </body>
    </html>
  );
}
