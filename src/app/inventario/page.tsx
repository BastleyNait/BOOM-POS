'use client';

import dynamic from 'next/dynamic';

const InventoryManager = dynamic(() => import('@/components/inventario/InventoryManager'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-800">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
        <p className="font-sans text-sm text-slate-600 font-semibold">Cargando Gestión de Inventario...</p>
      </div>
    </div>
  ),
});

export default function InventarioPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <InventoryManager />
    </main>
  );
}
