'use client';

import dynamic from 'next/dynamic';

const CashRegister = dynamic(() => import('@/components/pos/CashRegister'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-800">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-600 border-t-transparent"></div>
        <p className="font-sans text-sm text-slate-600 font-semibold">Iniciando Terminal BOOM POS...</p>
      </div>
    </div>
  ),
});

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50">
      <CashRegister />
    </main>
  );
}
