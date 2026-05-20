import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
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
          {children}
        </div>
      </body>
    </html>
  );
}
