'use client';

import React from 'react';
import { useCartStore } from '../../store/useCartStore';

export function TabSelector() {
  const { tabs, activeTabIndex, setActiveTab } = useCartStore();

  return (
    <div className="flex w-full items-center gap-2 border-b border-slate-200/80 pb-2">
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
              relative flex flex-1 flex-col justify-center rounded-lg px-3 py-1.5 text-left transition-all duration-200 cursor-pointer
              ${isActive 
                ? 'bg-white border-l-4 border-orange-600 text-slate-800 shadow-sm shadow-slate-200/60'
                : 'bg-slate-100/70 border-l-4 border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }
              border border-slate-200/80
            `}
          >
            <div className="flex w-full items-center justify-between">
              <span className="text-[10px] font-black tracking-wider uppercase text-orange-600">
                F{idx + 1}
              </span>
              {itemCount > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-orange-600 text-[9px] font-black text-white">
                  {itemCount}
                </span>
              )}
            </div>
            
            <div className="flex w-full items-center justify-between mt-0.5">
              <div className="font-extrabold text-xs text-slate-700 truncate max-w-[60%]">
                {tab.cliente ? tab.cliente.nombre : `Cliente ${idx + 1}`}
              </div>
              <div className="text-[10px] font-mono font-bold text-slate-500">
                S/ {total.toFixed(2)}
              </div>
            </div>

            {/* Micro-animación de pestaña activa */}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-orange-600 to-amber-600" />
            )}
          </button>
        );
      })}
    </div>
  );
}

export default TabSelector;

