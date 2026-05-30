'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCartStore } from '../../store/useCartStore';
import { useThemeStore } from '../../store/useThemeStore';

export function Sidebar() {
  const pathname = usePathname();
  const { cajaActivaId, mockMovimientos, clearActiveTab, mockPedidos, faltantesFrescos } = useCartStore();
  const { theme, toggleTheme } = useThemeStore();
  const [showAuditoriaModal, setShowAuditoriaModal] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [activeTab, setActiveTab] = useState('productos');

  // Auto-detectar pantalla chica al montar y redimensionar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleResize = () => {
        if (window.innerWidth < 1280) {
          setIsCollapsed(true);
        }
      };
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Escuchar cambios en la URL (search params) de manera compatible con SSR y compilación Next.js
  useEffect(() => {
    const handleUrlChange = () => {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get('tab') || 'productos';
        setActiveTab(tab);
      }
    };

    handleUrlChange();
    window.addEventListener('popstate', handleUrlChange);
    const interval = setInterval(handleUrlChange, 100);

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      clearInterval(interval);
    };
  }, []);

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

  // Calcular deudas pendientes con proveedores
  const deudasPendientes = mockPedidos
    .filter(p => p.estado === 'completado' && p.estado_pago === 'pendiente_de_pago')
    .reduce((sum, p) => sum + p.monto_total, 0);

  // Calcular faltantes de frescos activos
  const activeFaltantesCount = (faltantesFrescos || []).filter(f => !f.comprado).length;

  const isMercadoTab = pathname === '/inventario' && activeTab === 'mercado';

  return (
    <>
      {/* Mobile bottom navbar — only shown on mercado tab */}
      {isMercadoTab && (
        <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 flex items-center justify-around px-2 py-1 shadow-[0_-2px_12px_rgba(0,0,0,0.06)] safe-area-pb">
          <Link
            href="/"
            className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-slate-400 hover:text-slate-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span className="text-[9px] font-black uppercase tracking-wide">Caja</span>
          </Link>

          <Link
            href="/inventario?tab=productos"
            className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-slate-400 hover:text-slate-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span className="text-[9px] font-black uppercase tracking-wide">Stock</span>
          </Link>

          <Link
            href="/inventario?tab=mercado"
            className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl relative"
          >
            <div className="w-10 h-10 rounded-2xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30 -mt-5">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span className="text-[9px] font-black uppercase tracking-wide text-orange-600">Mercado</span>
            {activeFaltantesCount > 0 && (
              <span className="absolute top-0 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[8px] font-black text-white">
                {activeFaltantesCount}
              </span>
            )}
          </Link>

          <Link
            href="/inventario?tab=compras"
            className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-slate-400 hover:text-slate-700 transition-colors relative"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1" />
            </svg>
            <span className="text-[9px] font-black uppercase tracking-wide">Compras</span>
            {deudasPendientes > 0 && (
              <span className="absolute top-1 right-2 flex h-3 w-3 rounded-full bg-red-500" />
            )}
          </Link>
        </nav>
      )}

      <aside 
        className={`
          hidden sm:flex h-screen sticky top-0 flex-col justify-between border-r border-edge bg-surface flex-shrink-0 z-30 
          shadow-card transition-all duration-300 ease-expo
          ${isCollapsed ? 'w-20' : 'w-56 2xl:w-64'}
        `}
      >
        {/* Superior: Logo y Navegación */}
        <div className={`flex flex-col gap-6 ${isCollapsed ? 'p-4 items-center' : 'p-6'}`}>
          
          {/* Logo Brand e Icono Toggle */}
          <div className={`flex items-center w-full ${isCollapsed ? 'flex-col gap-4 justify-center' : 'justify-between'}`}>
            <div className="flex items-center gap-2">
              <span className="h-7 w-7 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-600 flex items-center justify-center text-white font-black text-sm tracking-tighter shadow-md shadow-brand/20 flex-shrink-0">
                B
              </span>
              {!isCollapsed && (
                <span className="text-xl font-black text-ink tracking-tight whitespace-nowrap">
                  BOOM POS
                </span>
              )}
            </div>
            
            {/* Botón de Colapsar (Toggle) */}
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`
                p-1.5 rounded-xl border border-edge bg-inset hover:bg-elevated text-ink-tertiary hover:text-ink 
                transition-all duration-200 ease-expo cursor-pointer shadow-sm active:scale-[0.98]
                focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:outline-none
                ${isCollapsed ? 'rotate-180' : ''}
              `}
              title={isCollapsed ? "Expandir menú (S/)" : "Colapsar menú"}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </div>
          
          {!isCollapsed && (
            <p className="text-[10px] text-ink-tertiary font-extrabold uppercase tracking-widest pl-9 -mt-4">
              Enterprise ERP
            </p>
          )}

          {/* Menú de Navegación */}
          <nav className="flex flex-col gap-1.5 w-full">
            <Link
              href="/"
              className={`
                flex items-center rounded-xl text-sm font-bold transition-all duration-200 ease-expo active:scale-[0.98]
                focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:outline-none
                ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'} 
                ${pathname === '/'
                  ? 'bg-brand-subtle text-brand-text'
                  : 'text-ink-secondary hover:text-ink hover:bg-inset'
                }
              `}
              title="Punto de Venta"
            >
              <svg className={`h-5 w-5 flex-shrink-0 ${pathname === '/' ? 'text-brand' : 'text-ink-tertiary'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              {!isCollapsed && <span>Punto de Venta</span>}
            </Link>

            {/* Subenlaces de Inventario ERP */}
            <Link
              href="/inventario?tab=productos"
              className={`
                flex items-center rounded-xl text-sm font-bold transition-all duration-200 ease-expo active:scale-[0.98]
                focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:outline-none
                ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'} 
                ${pathname === '/inventario' && activeTab === 'productos'
                  ? 'bg-brand-subtle text-brand-text'
                  : 'text-ink-secondary hover:text-ink hover:bg-inset'
                }
              `}
              title="Inventario & Stock"
            >
              <svg className={`h-5 w-5 flex-shrink-0 ${pathname === '/inventario' && activeTab === 'productos' ? 'text-brand' : 'text-ink-tertiary'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              {!isCollapsed && <span>Inventario & Stock</span>}
            </Link>

            <Link
              href="/inventario?tab=compras"
              className={`
                flex items-center rounded-xl text-sm font-bold transition-all duration-200 ease-expo relative active:scale-[0.98]
                focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:outline-none
                ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'} 
                ${pathname === '/inventario' && activeTab === 'compras'
                  ? 'bg-brand-subtle text-brand-text'
                  : 'text-ink-secondary hover:text-ink hover:bg-inset'
                }
              `}
              title="Compras y Deudas"
            >
              <svg className={`h-5 w-5 flex-shrink-0 ${pathname === '/inventario' && activeTab === 'compras' ? 'text-brand' : 'text-ink-tertiary'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1" />
              </svg>
              {!isCollapsed && <span>Compras y Deudas</span>}
              {deudasPendientes > 0 && (
                <span className={`absolute flex h-4 w-4 items-center justify-center rounded-full bg-negative text-[8px] font-black text-ink-inverted animate-bounce ${isCollapsed ? 'top-1.5 right-1.5' : 'top-3 right-4'}`}>
                  !
                </span>
              )}
            </Link>

            <Link
              href="/inventario?tab=proveedores"
              className={`
                flex items-center rounded-xl text-sm font-bold transition-all duration-200 ease-expo active:scale-[0.98]
                focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:outline-none
                ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'} 
                ${pathname === '/inventario' && activeTab === 'proveedores'
                  ? 'bg-brand-subtle text-brand-text'
                  : 'text-ink-secondary hover:text-ink hover:bg-inset'
                }
              `}
              title="Catálogo de Proveedores"
            >
              <svg className={`h-5 w-5 flex-shrink-0 ${pathname === '/inventario' && activeTab === 'proveedores' ? 'text-brand' : 'text-ink-tertiary'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {!isCollapsed && <span>Proveedores</span>}
            </Link>

            <Link
              href="/inventario?tab=mercado"
              className={`
                flex items-center rounded-xl text-sm font-bold transition-all duration-200 ease-expo relative active:scale-[0.98]
                focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:outline-none
                ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'} 
                ${pathname === '/inventario' && activeTab === 'mercado'
                  ? 'bg-brand-subtle text-brand-text'
                  : 'text-ink-secondary hover:text-ink hover:bg-inset'
                }
              `}
              title="Faltantes de Frescos"
            >
              <svg className={`h-5 w-5 flex-shrink-0 ${pathname === '/inventario' && activeTab === 'mercado' ? 'text-brand' : 'text-ink-tertiary'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {!isCollapsed && <span>Faltantes de Frescos</span>}
              {activeFaltantesCount > 0 && (
                <span className={`absolute flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[8px] font-black text-ink-inverted ${isCollapsed ? 'top-1.5 right-1.5' : 'top-3 right-4'}`}>
                  {activeFaltantesCount}
                </span>
              )}
            </Link>

            <Link
              href="/inventario?tab=cierres"
              className={`
                flex items-center rounded-xl text-sm font-bold transition-all duration-200 ease-expo active:scale-[0.98]
                focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:outline-none
                ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'} 
                ${pathname === '/inventario' && activeTab === 'cierres'
                  ? 'bg-brand-subtle text-brand-text'
                  : 'text-ink-secondary hover:text-ink hover:bg-inset'
                }
              `}
              title="Reportes de Cierre"
            >
              <svg className={`h-5 w-5 flex-shrink-0 ${pathname === '/inventario' && activeTab === 'cierres' ? 'text-brand' : 'text-ink-tertiary'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {!isCollapsed && <span>Reportes de Cierre</span>}
            </Link>

            {/* Auditoría Rápida */}
            <button
              onClick={() => setShowAuditoriaModal(true)}
              className={`
                flex items-center rounded-xl text-sm font-bold text-ink-secondary hover:text-ink hover:bg-inset 
                transition-all duration-200 ease-expo cursor-pointer w-full active:scale-[0.98]
                focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:outline-none
                ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'}
              `}
              title="Auditoría de Caja"
            >
              <svg className="h-5 w-5 text-ink-tertiary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              {!isCollapsed && <span>Auditoría de Caja</span>}
            </button>
          </nav>
        </div>

        {/* Inferior: Info Caja y Estado */}
        <div className={`border-t border-edge flex flex-col gap-3 ${isCollapsed ? 'p-2.5 items-center' : 'p-4'}`}>
          {cajaActivaId ? (
            <div className={`flex flex-col bg-inset border border-edge rounded-xl shadow-sm w-full ${isCollapsed ? 'p-2 items-center text-center' : 'p-3'}`}>
              {isCollapsed ? (
                <div className="flex flex-col items-center gap-1.5">
                  <span className="flex h-2 w-2 rounded-full bg-brand animate-pulse" title="Caja Abierta"></span>
                  <span className="text-[9px] font-black text-brand font-mono leading-none">S/</span>
                  <span className="text-[10px] font-black text-ink font-mono truncate max-w-[60px]" title={`S/ ${saldoCaja.toFixed(2)}`}>
                    {saldoCaja.toFixed(0)}
                  </span>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-ink-tertiary uppercase tracking-wider">Caja Abierta</span>
                    <span className="flex h-2 w-2 rounded-full bg-brand animate-pulse"></span>
                  </div>
                  <div className="font-mono text-base font-black text-ink tracking-tight">
                    S/ {saldoCaja.toFixed(2)}
                  </div>
                  <span className="text-[9px] font-bold text-ink-tertiary truncate">ID: {cajaActivaId.substring(0, 8).toUpperCase()}</span>
                </>
              )}
            </div>
          ) : (
            <div className={`flex flex-col bg-inset border border-edge rounded-xl shadow-sm w-full ${isCollapsed ? 'p-2 items-center text-center' : 'p-3'}`}>
              {isCollapsed ? (
                <span className="flex h-2 w-2 rounded-full bg-caution" title="Caja Cerrada"></span>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-ink-tertiary uppercase tracking-wider">Caja Cerrada</span>
                    <span className="flex h-2 w-2 rounded-full bg-caution"></span>
                  </div>
                  <p className="text-[11px] text-ink-secondary font-medium leading-tight">Habilitá ventas abriendo caja.</p>
                </>
              )}
            </div>
          )}

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`
              p-2 rounded-lg bg-inset border border-edge text-ink-secondary hover:text-ink 
              transition-all duration-200 ease-expo cursor-pointer active:scale-[0.98]
              focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:outline-none
              ${isCollapsed ? 'w-fit' : 'w-full flex items-center gap-2 justify-center'}
            `}
            title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
          >
            {theme === 'light' ? (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
            {!isCollapsed && (
              <span className="text-xs font-bold">
                {theme === 'light' ? 'Modo Oscuro' : 'Modo Claro'}
              </span>
            )}
          </button>

          {!isCollapsed ? (
            <div className="text-center">
              <span className="text-[9px] bg-inset border border-edge text-ink-tertiary font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                DEMO OFFLINE ACTIVE
              </span>
            </div>
          ) : (
            <span className="text-[9px] font-black text-ink-tertiary bg-inset border border-edge rounded px-1.5 py-0.5 tracking-wider" title="DEMO OFFLINE ACTIVE">
              DEMO
            </span>
          )}
        </div>
      </aside>

      {/* =========================================================================
         MODAL INTERACTIVO DE AUDITORÍA DE CAJA
         ========================================================================= */}
      {showAuditoriaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-[550px] max-h-[80vh] flex flex-col rounded-2xl border border-edge bg-surface p-6 shadow-modal animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-edge pb-4 mb-4">
              <div>
                <h2 className="text-xl font-black text-ink tracking-tight">Auditoría y Bitácora de Caja</h2>
                <p className="text-xs text-ink-tertiary font-bold uppercase mt-0.5">Historial de movimientos de la jornada</p>
              </div>
              <button
                onClick={() => setShowAuditoriaModal(false)}
                className="rounded-xl p-1 text-ink-tertiary hover:bg-inset hover:text-ink transition-all duration-200 ease-expo cursor-pointer active:scale-[0.98]
                  focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:outline-none"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Listado de Movimientos */}
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2.5">
              {cajaMovimientos.length === 0 ? (
                <div className="text-center py-12 text-ink-tertiary">
                  <svg className="h-10 w-10 mx-auto mb-3 text-ink-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-sm font-bold">No hay movimientos en esta caja aún</p>
                  <p className="text-xs text-ink-tertiary mt-1">Las ventas registradas figurarán en este visor.</p>
                </div>
              ) : (
                cajaMovimientos.map((mov) => {
                  let badgeColor = '';
                  let sign = '';
                  switch (mov.tipo) {
                    case 'apertura':
                      badgeColor = 'bg-brand-subtle text-brand-text border-brand';
                      sign = '+';
                      break;
                    case 'ingreso':
                      badgeColor = 'bg-brand-subtle text-brand-text border-brand';
                      sign = '+';
                      break;
                    case 'egreso':
                      badgeColor = 'bg-negative-subtle text-negative-text border-negative-subtle';
                      sign = '-';
                      break;
                    case 'cierre':
                      badgeColor = 'bg-inset text-ink border-edge';
                      sign = '-';
                      break;
                  }

                  return (
                    <div
                      key={mov.id}
                      className="flex items-center justify-between p-3.5 bg-inset border border-edge rounded-xl shadow-sm"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex px-2 py-0.5 border text-[9px] font-black uppercase tracking-wider rounded-md ${badgeColor}`}>
                            {mov.tipo}
                          </span>
                          <span className="text-xs text-ink-secondary font-mono">
                            {new Date(mov.fecha).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-ink">{mov.motivo}</span>
                      </div>

                      <div className="text-right">
                        <span className={`font-mono text-sm font-black ${mov.tipo === 'egreso' ? 'text-negative-text' : 'text-brand'}`}>
                          {sign} S/ {mov.monto.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Totalizador al pie */}
            <div className="mt-4 border-t border-edge pt-4 flex justify-between items-center bg-inset p-4 rounded-xl">
              <span className="text-xs font-black text-ink-secondary uppercase tracking-wider">Saldo Auditado en Efectivo:</span>
              <span className="font-mono text-lg font-black text-ink">
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
