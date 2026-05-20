'use client';

import React from 'react';
import { useCartStore } from '../../store/useCartStore';

export function TabSelector() {
  const { tabs, activeTabIndex, setActiveTab } = useCartStore();

  return (
    <div className="flex w-full items-center gap-2 border-b border-slate-200/80 pb-4">
      {tabs.map((tab, idx) => {
        const isActive = activeTabIndex === idx;
        const itemCount = tab.items.reduce((sum, item) => sum + item.cantidad, 0);
        
        // Calcular total dinámico de la pestaña para pintarlo chiquito
        const total = tab.items.reduce((sum, item) => {
          const itemSubtotal = item.precio_venta * item.cantidad;
          const itemDescuento = item.descuento > 0
            ? (item.tipo_descuento === 'porcentaje' ? itemSubtotal * (item.descuento / 100) : item.descuento * item.cantidad)
            : 0;
          return sum + Math.max(0, itemSubtotal - itemDescuento);
        }, 0);

        return (
          <button
            key={idx}
            onClick={() => setActiveTab(idx)}
            className={`
              relative flex flex-1 flex-col items-start gap-1 rounded-xl px-4 py-3 text-left transition-all duration-200 cursor-pointer
              ${isActive 
                ? 'bg-white border-l-4 border-emerald-600 text-slate-800 shadow-md shadow-slate-200/60'
                : 'bg-slate-100/70 border-l-4 border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }
              border border-slate-200/80
            `}
          >
            <div className="flex w-full items-center justify-between">
              <span className="text-[10px] font-black tracking-wider uppercase text-emerald-600">
                F{idx + 1}
              </span>
              {itemCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-black text-white animate-pulse">
                  {itemCount}
                </span>
              )}
            </div>
            
            <div className="font-extrabold text-sm text-slate-700">
              {tab.cliente ? tab.cliente.nombre : `Cliente ${idx + 1}`}
            </div>

            <div className="text-xs font-mono font-bold text-slate-500">
              S/ {total.toFixed(2)}
            </div>

            {/* Micro-animación de pestaña activa */}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-600 to-teal-600" />
            )}
          </button>
        );
      })}
    </div>
  );
}

export default TabSelector;

