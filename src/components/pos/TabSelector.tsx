'use client';

import React from 'react';
import { useCartStore } from '../../store/useCartStore';

export function TabSelector() {
  const { tabs, activeTabIndex, setActiveTab } = useCartStore();

  return (
    <div className="flex w-full items-center gap-2 border-b border-edge pb-2">
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
              relative flex flex-1 flex-col justify-center rounded-xl px-3 py-1.5 text-left
              transition-all duration-200 ease-expo cursor-pointer active:scale-[0.98]
              focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:outline-none
              ${isActive 
                ? 'bg-surface border border-brand/40 text-ink shadow-card'
                : 'bg-inset border border-edge text-ink-secondary hover:bg-surface hover:text-ink'
              }
            `}
          >
            <div className="flex w-full items-center justify-between">
              <span className="text-[10px] font-black tracking-wider uppercase text-brand-text">
                F{idx + 1}
              </span>
              {itemCount > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[9px] font-black text-ink-inverted">
                  {itemCount}
                </span>
              )}
            </div>
            
            <div className="flex w-full items-center justify-between mt-0.5">
              <div className="font-extrabold text-xs text-ink truncate max-w-[60%]">
                {tab.cliente ? tab.cliente.nombre : `Cliente ${idx + 1}`}
              </div>
              <div className="text-[10px] font-mono font-bold text-ink-secondary">
                S/ {total.toFixed(2)}
              </div>
            </div>

            {/* Accent bar for active tab */}
            {isActive && (
              <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-brand rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}

export default TabSelector;
