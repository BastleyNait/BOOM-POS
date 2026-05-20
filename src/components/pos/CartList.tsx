'use client';

import React from 'react';
import { useCartStore, CartItem } from '../../store/useCartStore';

export function CartList() {
  const {
    tabs,
    activeTabIndex,
    modo,
    selectedCartItemIndex,
    setSelectedCartItemIndex,
    updateQuantity,
    updateDiscount,
    updateNote,
    removeFromCart
  } = useCartStore();

  const currentTab = tabs[activeTabIndex];
  const items = currentTab?.items || [];

  if (items.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center animate-in fade-in duration-300">
        <div className="mb-4 rounded-full bg-slate-200/60 p-4 text-slate-400 shadow-inner">
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <h3 className="font-extrabold text-slate-700">El carrito está vacío</h3>
        <p className="mt-1 text-xs text-slate-500">
          Escaneá un código o presioná <span className="font-mono text-orange-600 font-extrabold">F8</span> para agregar productos.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto pr-1">
      {items.map((item, idx) => {
        // Calcular subtotal antes y después de descuentos
        const itemSubtotal = item.precio_venta * item.cantidad;
        let itemDescuento = 0;
        if (item.descuento > 0) {
          itemDescuento = item.tipo_descuento === 'porcentaje'
            ? itemSubtotal * (item.descuento / 100)
            : item.descuento * item.cantidad;
        }
        const itemTotalFinal = Math.max(0, itemSubtotal - itemDescuento);
        const finalUnitPrice = itemTotalFinal / item.cantidad;

        // Validar si el precio de venta final cae por debajo del costo (Alerta de margen)
        const isBelowCosto = finalUnitPrice < item.precio_costo;
        const isSelected = selectedCartItemIndex === idx && modo === 'rapido';

        return (
          <div
            key={item.id}
            onClick={() => modo === 'rapido' && setSelectedCartItemIndex(idx)}
            className={`
              relative flex flex-col gap-2 rounded-2xl border p-4 transition-all duration-300 shadow-sm cursor-pointer
              ${isBelowCosto 
                ? 'border-rose-200 bg-rose-50/50' 
                : isSelected
                  ? 'border-orange-500 bg-orange-50/20 shadow-[0_4px_20px_-3px_rgba(16,185,129,0.15)] ring-1 ring-orange-500/20 scale-[1.01]'
                  : 'border-slate-200/80 bg-white hover:border-slate-300 hover:shadow'
              }
            `}
          >
            {/* Badge de Selección por Teclado */}
            {isSelected && (
              <span className="absolute -top-2.5 right-4 bg-orange-600 text-white font-mono text-[9px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full shadow-md animate-in slide-in-from-top-1">
                Foco Atajos [ + | - | Supr ]
              </span>
            )}

            {/* Cabecera del Item */}
            <div className="flex w-full items-start justify-between">
              <div className="pr-4">
                <span className="font-bold text-slate-800 text-sm leading-snug block">{item.nombre}</span>
                <div className="mt-0.5 font-mono text-[10px] text-slate-400 font-medium">Cod: {item.codigo}</div>
              </div>

              {/* Botón de Remover */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFromCart(item.id);
                  setSelectedCartItemIndex(-1);
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-rose-600 transition-colors cursor-pointer"
                title="Quitar del carrito (Supr / click)"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>

            {/* Fila de Cantidades y Precios */}
            <div className="flex w-full items-center justify-between border-t border-slate-100 pt-3">
              
              {/* Control de Cantidades */}
              <div 
                onClick={(e) => e.stopPropagation()} 
                className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200/60 shadow-inner"
              >
                <button
                  onClick={() => updateQuantity(item.id, item.cantidad - 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200/80 hover:text-slate-800 font-bold transition-all cursor-pointer"
                >
                  -
                </button>
                <input
                  type="number"
                  name="cantidad-item"
                  value={item.cantidad}
                  onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 0)}
                  className="w-10 bg-transparent text-center font-mono font-black text-sm text-slate-800 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  onClick={() => updateQuantity(item.id, item.cantidad + 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200/80 hover:text-slate-800 font-bold transition-all cursor-pointer"
                >
                  +
                </button>
              </div>

              {/* Muestra de Totales */}
              <div className="text-right">
                <div className="text-xs text-slate-500 font-mono font-medium">
                  {item.cantidad} x S/ {item.precio_venta.toFixed(2)}
                </div>
                <div className="flex items-center justify-end gap-2 mt-0.5">
                  {item.descuento > 0 && (
                    <span className="text-[10px] text-orange-700 bg-orange-100/80 px-1.5 py-0.5 rounded font-black border border-orange-200/40">
                      -S/ {itemDescuento.toFixed(2)}
                    </span>
                  )}
                  <span className={`font-mono text-base font-black ${isBelowCosto ? 'text-rose-600 animate-pulse' : 'text-orange-600'}`}>
                    S/ {itemTotalFinal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* CONTROLES AVANZADOS (Solo Modo Clásico) */}
            {modo === 'clasico' && (
              <div 
                onClick={(e) => e.stopPropagation()} 
                className="mt-3 flex flex-col gap-2 rounded-xl bg-slate-50 p-3 border border-slate-200/60 shadow-inner"
              >
                {/* Descuentos Avanzados */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-500 font-bold">Descuento:</span>
                    <div className="flex rounded-lg bg-slate-200/70 p-0.5 border border-slate-300">
                      <button
                        onClick={() => updateDiscount(item.id, item.descuento, 'porcentaje')}
                        className={`px-2 py-0.5 rounded text-[10px] transition-all cursor-pointer ${
                          item.tipo_descuento === 'porcentaje' 
                            ? 'bg-orange-600 text-white font-black shadow-sm' 
                            : 'text-slate-600 hover:text-slate-900 font-semibold'
                        }`}
                      >
                        %
                      </button>
                      <button
                        onClick={() => updateDiscount(item.id, item.descuento, 'monto')}
                        className={`px-2 py-0.5 rounded text-[10px] transition-all cursor-pointer ${
                          item.tipo_descuento === 'monto' 
                            ? 'bg-orange-600 text-white font-black shadow-sm' 
                            : 'text-slate-600 hover:text-slate-900 font-semibold'
                        }`}
                      >
                        S/
                      </button>
                    </div>
                  </div>

                  <input
                    type="number"
                    value={item.descuento || ''}
                    onChange={(e) => updateDiscount(item.id, Number(e.target.value) || 0, item.tipo_descuento)}
                    placeholder="0"
                    className="w-16 rounded-lg border border-slate-300 bg-white px-2 py-1 text-right font-mono text-xs text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>

                {/* Nota / Comentario */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-bold">Nota:</span>
                  <input
                    type="text"
                    value={item.nota || ''}
                    onChange={(e) => updateNote(item.id, e.target.value)}
                    placeholder="Escribir comentario..."
                    className="flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 placeholder-slate-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>

                {/* Alerta de Pérdida de Margen */}
                {isBelowCosto && (
                  <div className="flex items-center gap-1.5 text-[10px] text-rose-600 font-bold animate-pulse">
                    <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>¡Peligro! Precio final inferior al costo (S/ {item.precio_costo.toFixed(2)}). Pérdida de margen.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default CartList;
