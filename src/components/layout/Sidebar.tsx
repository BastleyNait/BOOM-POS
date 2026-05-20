'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCartStore } from '../../store/useCartStore';

export function Sidebar() {
  const pathname = usePathname();
  const { cajaActivaId, mockMovimientos, tabs, activeTabIndex } = useCartStore();
  const [showAuditoriaModal, setShowAuditoriaModal] = useState(false);

  // Filtrar movimientos de la caja activa
  const cajaMovimientos = mockMovimientos.filter(m => m.caja_id === cajaActivaId);

  // Calcular saldo actual estimado de la caja activa
  const saldoCaja = cajaMovimientos.reduce((acc, curr) => {
    if (curr.tipo === 'apertura' || curr.tipo === 'ingreso') {
      return acc + curr.monto;
    } else if (curr.tipo === 'egreso' || curr.tipo === 'cierre') {
      return acc - curr.monto;
    }
    return acc;
  }, 0);

  return (
    <>
      <aside className="w-64 border-r border-slate-200/80 bg-white flex flex-col justify-between h-screen sticky top-0 flex-shrink-0 z-30 shadow-[4px_0_24px_-10px_rgba(0,0,0,0.03)]">
        {/* Superior: Logo y Navegación */}
        <div className="flex flex-col gap-8 p-6">
          {/* Logo Brand */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="h-7 w-7 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-sm tracking-tighter shadow-md shadow-emerald-500/20">
                B
              </span>
              <span className="text-xl font-black bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent tracking-tight">
                BOOM POS
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest pl-9">Enterprise ERP</p>
          </div>

          {/* Menú de Navegación */}
          <nav className="flex flex-col gap-1.5">
            <Link
              href="/"
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${
                pathname === '/'
                  ? 'bg-emerald-50/80 text-emerald-800 border-l-4 border-emerald-600 shadow-[0_4px_12px_-5px_rgba(16,185,129,0.12)]'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <svg className={`h-5 w-5 ${pathname === '/' ? 'text-emerald-600' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Punto de Venta
            </Link>

            <Link
              href="/inventario"
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${
                pathname === '/inventario'
                  ? 'bg-emerald-50/80 text-emerald-800 border-l-4 border-emerald-600 shadow-[0_4px_12px_-5px_rgba(16,185,129,0.12)]'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <svg className={`h-5 w-5 ${pathname === '/inventario' ? 'text-emerald-600' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              Inventario & Stock
            </Link>

            {/* Auditoría Rápida */}
            <button
              onClick={() => setShowAuditoriaModal(true)}
              className="flex w-full items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all duration-300 cursor-pointer text-left"
            >
              <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Auditoría de Caja
            </button>
          </nav>
        </div>

        {/* Inferior: Info Caja y Estado */}
        <div className="p-4 border-t border-slate-100 flex flex-col gap-3.5 bg-slate-50/50 rounded-b-3xl">
          {cajaActivaId ? (
            <div className="flex flex-col gap-2 p-3 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Caja Abierta</span>
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <div className="font-mono text-base font-black text-slate-800 tracking-tight">
                S/ {saldoCaja.toFixed(2)}
              </div>
              <span className="text-[9px] font-bold text-slate-400 truncate">ID: {cajaActivaId.substring(0, 8).toUpperCase()}</span>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 p-3 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Caja Cerrada</span>
                <span className="flex h-2 w-2 rounded-full bg-amber-500"></span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Habilitá las ventas abriendo una caja diaria.</p>
            </div>
          )}

          <div className="text-center">
            <span className="text-[9px] bg-slate-200/70 border border-slate-300/40 text-slate-500 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
              DEMO OFFLINE ACTIVE
            </span>
          </div>
        </div>
      </aside>

      {/* =========================================================================
         MODAL INTERACTIVO DE AUDITORÍA DE CAJA
         ========================================================================= */}
      {showAuditoriaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-[550px] max-h-[80vh] flex flex-col rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Auditoría y Bitácora de Caja</h2>
                <p className="text-xs text-slate-400 font-bold uppercase mt-0.5">Historial de movimientos de la jornada</p>
              </div>
              <button
                onClick={() => setShowAuditoriaModal(false)}
                className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-all cursor-pointer"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Listado de Movimientos */}
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2.5">
              {cajaMovimientos.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <svg className="h-10 w-10 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-sm font-bold">No hay movimientos en esta caja aún</p>
                  <p className="text-xs text-slate-400 mt-1">Las ventas registradas figurarán en este visor.</p>
                </div>
              ) : (
                cajaMovimientos.map((mov) => {
                  let badgeColor = '';
                  let sign = '';
                  switch (mov.tipo) {
                    case 'apertura':
                      badgeColor = 'bg-blue-50 text-blue-700 border-blue-200/50';
                      sign = '+';
                      break;
                    case 'ingreso':
                      badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200/50';
                      sign = '+';
                      break;
                    case 'egreso':
                      badgeColor = 'bg-rose-50 text-rose-700 border-rose-200/50';
                      sign = '-';
                      break;
                    case 'cierre':
                      badgeColor = 'bg-slate-100 text-slate-700 border-slate-200/50';
                      sign = '-';
                      break;
                  }

                  return (
                    <div
                      key={mov.id}
                      className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl shadow-sm"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex px-2 py-0.5 border text-[9px] font-black uppercase tracking-wider rounded-md ${badgeColor}`}>
                            {mov.tipo}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">
                            {new Date(mov.fecha).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-slate-700">{mov.motivo}</span>
                      </div>

                      <div className="text-right">
                        <span className={`font-mono text-sm font-black ${mov.tipo === 'egreso' ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {sign} S/ {mov.monto.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Totalizador al pie */}
            <div className="mt-4 border-t border-slate-100 pt-4 flex justify-between items-center bg-slate-50 p-4 rounded-2xl">
              <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Saldo Auditado en Efectivo:</span>
              <span className="font-mono text-lg font-black text-slate-800">
                S/ {saldoCaja.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;
