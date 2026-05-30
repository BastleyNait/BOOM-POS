'use client';

import dynamic from 'next/dynamic';

const CashRegister = dynamic(() => import('@/components/pos/CashRegister'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[100dvh] items-center justify-center bg-base text-ink">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent"></div>
        <p className="font-sans text-sm text-ink-secondary font-semibold">Iniciando Terminal BOOM POS...</p>
      </div>
    </div>
  ),
});

export default function Home() {
  return (
    <main className="h-[100dvh] bg-base overflow-hidden">
      <CashRegister />
    </main>
  );
}
