'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { useCartStore } from '../../store/useCartStore';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { TabSelector } from './TabSelector';
import { ProductFinder } from './ProductFinder';
import { CartList } from './CartList';
import { confirmarVentaAction, abrirCajaAction } from '../../lib/supabase/actions';
import { formatTicketForThermalPrinter } from '../../lib/utils/ticketFormatter';
import { getIsMockMode } from '../../lib/supabase/client';

export function CashRegister() {
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  
  // Zustand Store hooks
  const {
    tabs,
    activeTabIndex,
    modo,
    cajaActivaId,
    setModo,
    setCajaActivaId,
    clearActiveTab,
    getActiveTabTotal,
    subtractStockFromActiveTab,
    addMockMovimiento,
    mockProducts,
    addToCart,
    cuentasBilletera,
    mockMovimientos,
    agregarCuentaBilletera
  } = useCartStore();

  const currentTab = tabs[activeTabIndex];
  const items = currentTab?.items || [];
  const { subtotal, descuentoTotal, total } = getActiveTabTotal();
  
  // Nuevos estados locales para Trazabilidad Financiera Multicanal
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'billetera_digital'>('efectivo');
  const [cuentaDigitalSeleccionadaId, setCuentaDigitalSeleccionadaId] = useState<string>('');
  const [showNuevaCuentaModal, setShowNuevaCuentaModal] = useState(false);
  const [nombreNuevaCuenta, setNombreNuevaCuenta] = useState('');
  const [saldoInicialNuevaCuenta, setSaldoInicialNuevaCuenta] = useState('0');

  // Asegurar que haya una cuenta seleccionada si cambiamos a billetera digital
  useEffect(() => {
    if (cuentasBilletera.length > 0 && !cuentaDigitalSeleccionadaId) {
      setCuentaDigitalSeleccionadaId(cuentasBilletera[0].id);
    }
  }, [cuentasBilletera, cuentaDigitalSeleccionadaId]);

  // Arqueo en vivo de Caja Física en Soles (reactivo)
  const efectivoCajaFisica = mockMovimientos
    .filter(m => m.caja_id === cajaActivaId && m.metodo_pago === 'efectivo')
    .reduce((sum, m) => {
      if (m.tipo === 'apertura' || m.tipo === 'ingreso') return sum + m.monto;
      if (m.tipo === 'egreso' || m.tipo === 'cierre') return sum - m.monto;
      return sum;
    }, 0);


  // Estados locales para flujos de Caja y Cobro
  const [montoPago, setMontoPago] = useState<string>('');
  const [cambio, setCambio] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [generatedTicket, setGeneratedTicket] = useState('');
  
  // Estado para la Apertura de Caja Obligatoria
  const [showAperturaModal, setShowAperturaModal] = useState(false);
  const [montoAperturaInput, setMontoAperturaInput] = useState('200'); // Monto inicial recomendado en Soles

  // Categorías y Productos para el Modo Clásico Táctil
  const [categoriaActiva, setCategoriaActiva] = useState<string>('Bebidas');

  // Clasificación dinámica de productos para alimentar la grilla rápida
  const clasificarProducto = (nombre: string): string => {
    const n = nombre.toLowerCase();
    if (n.includes('coca') || n.includes('cerveza') || n.includes('pilsen') || n.includes('agua') || n.includes('gaseosa') || n.includes('lata') || n.includes('1.5l') || n.includes('473ml')) {
      return 'Bebidas';
    }
    if (n.includes('lays') || n.includes('papas') || n.includes('chocolate') || n.includes('sublime') || n.includes('snack') || n.includes('dulce')) {
      return 'Snacks';
    }
    if (n.includes('oreo') || n.includes('galleta') || n.includes('galletitas')) {
      return 'Galletas';
    }
    if (n.includes('leche') || n.includes('gloria') || n.includes('queso') || n.includes('yogurt')) {
      return 'Lácteos';
    }
    return 'Abarrotes';
  };

  const categorias = ['Bebidas', 'Snacks', 'Galletas', 'Lácteos', 'Abarrotes'];

  // Filtrar productos de la base de datos mock por categoría
  const productosFiltrados = mockProducts.filter(p => clasificarProducto(p.nombre) === categoriaActiva);

  // Verificar si la caja está activa al cargar
  useEffect(() => {
    if (!cajaActivaId) {
      setShowAperturaModal(true);
    }
  }, [cajaActivaId]);

  // Manejar el cambio cuando el cliente entrega dinero
  useEffect(() => {
    const pagoNum = parseFloat(montoPago) || 0;
    if (pagoNum >= total) {
      setCambio(pagoNum - total);
    } else {
      setCambio(0);
    }
  }, [montoPago, total]);

  // Lógica principal de finalización y cobro
  const handleProcessCheckout = async () => {
    if (items.length === 0) {
      alert('¡El carrito está vacío! Agregá productos antes de cobrar, hermano.');
      return;
    }

    if (!cajaActivaId) {
      alert('La caja del día está cerrada. Abrí la caja antes de registrar ventas, loco.');
      setShowAperturaModal(true);
      return;
    }

    if (metodoPago === 'billetera_digital' && !cuentaDigitalSeleccionadaId) {
      alert('Por favor, seleccioná una cuenta o billetera digital para recibir el cobro.');
      return;
    }

    // Si pagan en efectivo, validar que entregaron suficiente dinero
    if (metodoPago === 'efectivo') {
      const pagoNum = parseFloat(montoPago) || 0;
      if (pagoNum < total) {
        alert('El monto ingresado es menor al total a cobrar, ponete las pilas.');
        return;
      }
    }

    setIsProcessing(true);
    try {
      const detallesMap = items.map((item) => ({
        producto_id: item.id,
        cantidad: item.cantidad,
        precio_unitario: item.precio_venta,
        descuento: item.descuento > 0
          ? (item.tipo_descuento === 'porcentaje' ? (item.precio_venta * item.cantidad) * (item.descuento / 100) : item.descuento * item.cantidad)
          : 0,
        nota: item.nota || null
      }));

      const res = await confirmarVentaAction({
        clienteId: currentTab.cliente?.id || null,
        cajaId: cajaActivaId,
        total: total,
        tipoModo: modo,
        detalles: detallesMap
      });

      if (res.success && res.data) {
        if (getIsMockMode()) {
          subtractStockFromActiveTab();
          
          const ctaObj = cuentasBilletera.find(c => c.id === cuentaDigitalSeleccionadaId);
          const ctaNombre = ctaObj ? ctaObj.nombre : 'Billetera';

          addMockMovimiento({
            caja_id: cajaActivaId,
            tipo: 'ingreso',
            monto: total,
            motivo: `Venta POS en ${modo === 'rapido' ? 'Modo Rápido' : 'Modo Clásico'} (${metodoPago === 'efectivo' ? 'Efectivo' : ctaNombre})`,
            metodo_pago: metodoPago,
            cuenta_id: metodoPago === 'billetera_digital' ? cuentaDigitalSeleccionadaId : null
          });
        }

        const ticketString = formatTicketForThermalPrinter({
          ventaId: res.data.ventaId,
          items: items,
          subtotal: subtotal,
          descuentoTotal: descuentoTotal,
          total: total,
          tipoModo: modo,
          clienteNombre: currentTab.cliente?.nombre,
          cajaId: cajaActivaId
        }, 58);

        setGeneratedTicket(ticketString);
        setShowTicketModal(true);

        clearActiveTab();
        setMontoPago('');
        setCambio(0);
        
        setTimeout(() => searchInputRef.current?.focus(), 100);
      } else {
        alert(`Error al procesar: ${res.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error inesperado al intentar facturar.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Apertura de caja inicial
  const handleAbrirCaja = async () => {
    const monto = parseFloat(montoAperturaInput);
    if (isNaN(monto) || monto < 0) {
      alert('Ingresá un monto de apertura válido.');
      return;
    }

    try {
      const res = await abrirCajaAction(monto);
      if (res.success && res.data) {
        setCajaActivaId(res.data.cajaId);
        
        if (getIsMockMode()) {
          addMockMovimiento({
            caja_id: res.data.cajaId,
            tipo: 'apertura',
            monto: monto,
            motivo: 'Apertura inicial de caja diaria (Modo Demo)'
          });
        }

        setShowAperturaModal(false);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      } else {
        alert(`Error al abrir caja: ${res.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al abrir la caja diaria.');
    }
  };

  // Setup de Atajos de Teclado Globales (F1-F5, F8, ESC, ENTER)
  useKeyboardShortcuts({
    searchInputRef,
    onProcessCheckout: handleProcessCheckout,
  });

  // Funciones para Cobro Táctil (Billetes y Pad Numérico)
  const handleMontoBillete = (montoBillete: number) => {
    const actual = parseFloat(montoPago) || 0;
    setMontoPago((actual + montoBillete).toString());
  };

  const handlePadInput = (value: string) => {
    if (value === 'C') {
      setMontoPago('');
      return;
    }
    if (value === '⌫') {
      setMontoPago((prev) => prev.slice(0, -1));
      return;
    }
    if (value === '.') {
      if (montoPago.includes('.')) return;
      setMontoPago((prev) => (prev === '' ? '0.' : prev + '.'));
      return;
    }
    setMontoPago((prev) => prev + value);
  };

  return (
    <div className="flex h-screen flex-col bg-slate-50 text-slate-800 p-6 gap-5 font-sans antialiased overflow-hidden">
      
      {/* 1. Header Premium */}
      <header className="flex w-full items-center justify-between border-b border-slate-200/80 pb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent tracking-tight leading-none">
              BOOM POS
            </h1>
            <p className="text-[10px] text-slate-400 font-extrabold tracking-widest uppercase mt-1">Terminal de Ventas Ultra Rápida</p>
          </div>
          {getIsMockMode() && (
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-[9px] font-black tracking-wider uppercase px-3 py-1 rounded-full shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Modo Demo Local (Offline)
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/inventario"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-black rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-sm border border-slate-900 cursor-pointer"
          >
            📦 ERP & INVENTARIO
          </Link>

          {/* Selector de Modo Dual (Teclado vs Táctil) */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 shadow-inner">
          <button
            onClick={() => setModo('rapido')}
            className={`px-4 py-2 text-xs font-black rounded-xl transition-all duration-300 cursor-pointer ${
              modo === 'rapido' 
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/10' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            MODO RÁPIDO (Teclado)
          </button>
          <button
            onClick={() => setModo('clasico')}
            className={`px-4 py-2 text-xs font-black rounded-xl transition-all duration-300 cursor-pointer ${
              modo === 'clasico' 
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/10' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            MODO CLÁSICO (Táctil)
          </button>
        </div>
      </div>
    </header>

      {/* 2. Pestañas de Clientes (F1 - F5) */}
      <div className="flex-shrink-0">
        <TabSelector />
      </div>

      {/* 3. Panel Principal Dividido */}
      <div className="flex flex-1 gap-5 overflow-hidden">
        
        {/* =========================================================================
           DISEÑO MODO CLÁSICO (Táctil): Carrito a la izquierda (angosto) + Grilla de Productos (ancho)
           ========================================================================= */}
        {modo === 'clasico' ? (
          <div className="flex flex-1 gap-5 overflow-hidden">
            {/* Columna de Carrito y Buscador */}
            <div className="w-[380px] flex flex-col gap-4 overflow-hidden flex-shrink-0">
              <ProductFinder inputRef={searchInputRef} />
              
              <div className="flex-1 flex-col overflow-hidden bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm flex">
                <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center justify-between">
                  <span>Artículos en Carrito</span>
                  <span className="text-[11px] bg-slate-100 px-2.5 py-0.5 rounded-full font-mono font-bold text-slate-600 border border-slate-200/50">
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                  </span>
                </h2>
                
                <CartList />
              </div>
            </div>

            {/* Grilla Táctil de Productos Rápidos por Categoría */}
            <div className="flex-1 bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm overflow-hidden flex flex-col">
              {/* Selector de Categorías Táctiles */}
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4 overflow-x-auto">
                {categorias.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoriaActiva(cat)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                      categoriaActiva === cat
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Cuadrícula de Productos Rápidos */}
              <div className="flex-1 overflow-y-auto grid grid-cols-2 lg:grid-cols-3 gap-3 pr-1 align-content-start">
                {productosFiltrados.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-16 text-center text-slate-400">
                    <svg className="h-8 w-8 mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <p className="text-xs font-bold uppercase tracking-wider">No hay productos cargados en {categoriaActiva}</p>
                    <p className="text-[11px] text-slate-400 mt-1">Registrá nuevos productos con esta categoría en Inventario.</p>
                  </div>
                ) : (
                  productosFiltrados.map((prod) => {
                    const isLow = prod.stock < 5;
                    const isOutOfStock = prod.stock <= 0;

                    return (
                      <button
                        key={prod.id}
                        disabled={isOutOfStock}
                        onClick={() => {
                          addToCart({
                            id: prod.id,
                            nombre: prod.nombre,
                            codigo: prod.codigo,
                            precio_costo: Number(prod.precio_costo),
                            precio_venta: Number(prod.precio_venta),
                          });
                        }}
                        className={`
                          p-4 rounded-2xl border text-left flex flex-col justify-between h-28 transition-all relative cursor-pointer group select-none
                          ${isOutOfStock
                            ? 'bg-slate-50 border-slate-200/50 opacity-40 cursor-not-allowed'
                            : 'bg-slate-50/50 border-slate-200/80 hover:bg-white hover:border-emerald-500 hover:shadow-md active:scale-95'
                          }
                        `}
                      >
                        <div>
                          <span className="text-xs font-bold text-slate-800 leading-snug block line-clamp-2 group-hover:text-emerald-800 transition-colors">
                            {prod.nombre}
                          </span>
                          <span className="text-[9px] font-mono text-slate-400 mt-1 block">Cod: {prod.codigo}</span>
                        </div>

                        <div className="flex items-center justify-between mt-2 border-t border-slate-100 pt-2 w-full">
                          <span className="font-mono text-sm font-black text-emerald-600">
                            S/ {prod.precio_venta.toFixed(2)}
                          </span>

                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            isOutOfStock
                              ? 'bg-rose-100 text-rose-800'
                              : isLow
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-200/60 text-slate-600'
                          }`}>
                            {isOutOfStock ? 'Agotado' : `Stock: ${prod.stock}`}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        ) : (
          /* =========================================================================
             DISEÑO MODO RÁPIDO (Teclado): Totalmente limpio, buscador + carrito ancho
             ========================================================================= */
          <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            <ProductFinder inputRef={searchInputRef} />
            
            <div className="flex-1 flex-col overflow-hidden bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm flex">
              <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center justify-between">
                <span>Artículos en Carrito</span>
                <span className="text-xs bg-slate-100 px-3 py-1 rounded-full font-mono font-bold text-slate-600 border border-slate-200/50">
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </span>
              </h2>
              
              <CartList />
            </div>
          </div>
        )}

        {/* =========================================================================
           PANEL DERECHO: Liquidación, Pago, Billetes de Soles y Pad Numérico Táctil
           ========================================================================= */}
        <div className="w-[380px] rounded-3xl border border-slate-200/80 bg-white p-5 shadow-md flex flex-col justify-between overflow-y-auto flex-shrink-0">
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-black text-slate-800 pb-2 border-b border-slate-100 uppercase tracking-wider">
              Liquidación de Caja
            </h2>

            {/* Fila de Totales */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs font-semibold text-slate-500">
                <span>Subtotal</span>
                <span className="font-mono text-slate-800 font-bold">S/ {subtotal.toFixed(2)}</span>
              </div>
              
              {descuentoTotal > 0 && (
                <div className="flex justify-between text-xs text-emerald-600 font-bold">
                  <span>Descuento aplicado</span>
                  <span className="font-mono">-S/ {descuentoTotal.toFixed(2)}</span>
                </div>
              )}

              <div className="flex flex-col gap-0.5 border-t border-slate-100 pt-3">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-black">Total a Cobrar</span>
                <span className="text-3xl font-black font-mono text-emerald-600 tracking-tight leading-none mt-1">
                  S/ {total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Método de Pago Selector */}
            <div className="flex flex-col gap-1.5 border-t border-slate-100 pt-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Método de Pago:
              </label>
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200/50">
                <button
                  type="button"
                  onClick={() => {
                    setMetodoPago('efectivo');
                    setMontoPago('');
                    setCambio(0);
                  }}
                  className={`py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                    metodoPago === 'efectivo'
                      ? 'bg-white text-slate-800 shadow-sm border border-slate-200/40'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  💵 Efectivo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMetodoPago('billetera_digital');
                    setMontoPago(total.toFixed(2));
                    setCambio(0);
                  }}
                  className={`py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                    metodoPago === 'billetera_digital'
                      ? 'bg-white text-slate-800 shadow-sm border border-slate-200/40'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  📱 Billetera Digital
                </button>
              </div>
            </div>

            {/* Renderizar según método de pago */}
            {metodoPago === 'efectivo' ? (
              <>
                {/* Input de Efectivo del Cliente */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Efectivo Recibido (Paga con):
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 font-mono font-bold text-slate-400 text-lg">S/</span>
                    <input
                      name="monto-pago"
                      type="number"
                      value={montoPago}
                      onChange={(e) => setMontoPago(e.target.value)}
                      placeholder="0.00"
                      className="
                        w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-10 pr-4 font-mono text-lg font-bold text-slate-800
                        outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm
                      "
                    />
                  </div>
                </div>

                {/* Vuelto a Entregar */}
                {parseFloat(montoPago) > 0 && (
                  <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-3.5 flex justify-between items-center animate-in fade-in duration-200 shadow-sm">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Vuelto a entregar:</span>
                    <span className="text-xl font-black font-mono text-emerald-600">
                      S/ {cambio.toFixed(2)}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col gap-2 p-3 bg-slate-50 border border-slate-200/70 rounded-2xl animate-in fade-in duration-200">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Seleccionar Billetera Digital:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setNombreNuevaCuenta('');
                      setSaldoInicialNuevaCuenta('0');
                      setShowNuevaCuentaModal(true);
                    }}
                    className="text-[10px] font-black text-emerald-600 hover:text-emerald-800 cursor-pointer flex items-center gap-0.5 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100/50"
                  >
                    <span>+ Nueva Cuenta</span>
                  </button>
                </div>
                
                <select
                  value={cuentaDigitalSeleccionadaId}
                  onChange={(e) => setCuentaDigitalSeleccionadaId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {cuentasBilletera.map((cta) => (
                    <option key={cta.id} value={cta.id}>
                      {cta.nombre} (Saldo: S/ {cta.saldo.toFixed(2)})
                    </option>
                  ))}
                </select>
                
                <span className="text-[9px] text-slate-400 font-medium leading-normal block">
                  * El dinero recaudado se acreditará directamente en el saldo de la billetera digital seleccionada.
                </span>
              </div>
            )}

            {/* Arqueo Multicanal en Vivo */}
            <div className="mt-2 border-t border-slate-100 pt-3 flex flex-col gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                Arqueo Financiero en Vivo (ERP)
              </span>
              <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto pr-1">
                <div className="p-2.5 bg-slate-50 border border-slate-200/50 rounded-xl flex flex-col">
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Caja Física</span>
                  <span className="text-xs font-extrabold font-mono text-slate-700 mt-0.5">
                    S/ {efectivoCajaFisica.toFixed(2)}
                  </span>
                </div>
                {cuentasBilletera.map((cta) => (
                  <div key={cta.id} className="p-2.5 bg-slate-50 border border-slate-200/50 rounded-xl flex flex-col">
                    <span className="text-[9px] text-slate-400 font-bold uppercase truncate" title={cta.nombre}>
                      {cta.nombre}
                    </span>
                    <span className="text-xs font-extrabold font-mono text-emerald-600 mt-0.5">
                      S/ {cta.saldo.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-1 bg-slate-900 text-white p-2.5 rounded-xl flex justify-between items-center shadow-inner">
                <span className="text-[9px] font-black uppercase tracking-wider">Saldo Total Neto:</span>
                <span className="text-xs font-black font-mono text-emerald-400">
                  S/ {(efectivoCajaFisica + cuentasBilletera.reduce((sum, c) => sum + c.saldo, 0)).toFixed(2)}
                </span>
              </div>
            </div>

            {/* =========================================================================
               COBRO TÁCTIL EXCLUSIVO: BILLETES PERUANOS Y PAD NUMÉRICO (Modo Clásico)
               ========================================================================= */}
            {modo === 'clasico' && (
              <div className="flex flex-col gap-3.5 border-t border-slate-100 pt-3.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Billetes Peruanos */}
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-2">Billetes en Soles Rápidos</span>
                  <div className="grid grid-cols-5 gap-1.5">
                    <button
                      onClick={() => handleMontoBillete(10)}
                      className="py-2.5 text-[10px] font-black rounded-xl cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
                      title="Billete de 10 Soles"
                    >
                      S/ 10
                    </button>
                    <button
                      onClick={() => handleMontoBillete(20)}
                      className="py-2.5 text-[10px] font-black rounded-xl cursor-pointer bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition-all"
                      title="Billete de 20 Soles"
                    >
                      S/ 20
                    </button>
                    <button
                      onClick={() => handleMontoBillete(50)}
                      className="py-2.5 text-[10px] font-black rounded-xl cursor-pointer bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-all"
                      title="Billete de 50 Soles"
                    >
                      S/ 50
                    </button>
                    <button
                      onClick={() => handleMontoBillete(100)}
                      className="py-2.5 text-[10px] font-black rounded-xl cursor-pointer bg-blue-500 hover:bg-blue-600 text-white shadow-sm transition-all"
                      title="Billete de 100 Soles"
                    >
                      S/ 100
                    </button>
                    <button
                      onClick={() => handleMontoBillete(200)}
                      className="py-2.5 text-[10px] font-black rounded-xl cursor-pointer bg-rose-500 hover:bg-rose-600 text-white shadow-sm transition-all"
                      title="Billete de 200 Soles"
                    >
                      S/ 200
                    </button>
                  </div>
                </div>

                {/* Pad Numérico Táctil */}
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-2">Teclado de Liquidación Táctil</span>
                  <div className="grid grid-cols-4 gap-1.5 font-mono">
                    <button onClick={() => handlePadInput('7')} className="py-2.5 text-xs font-bold bg-slate-100 hover:bg-slate-200/80 rounded-xl cursor-pointer transition-colors text-slate-700">7</button>
                    <button onClick={() => handlePadInput('8')} className="py-2.5 text-xs font-bold bg-slate-100 hover:bg-slate-200/80 rounded-xl cursor-pointer transition-colors text-slate-700">8</button>
                    <button onClick={() => handlePadInput('9')} className="py-2.5 text-xs font-bold bg-slate-100 hover:bg-slate-200/80 rounded-xl cursor-pointer transition-colors text-slate-700">9</button>
                    <button onClick={() => handlePadInput('⌫')} className="py-2.5 text-[10px] font-extrabold bg-slate-200 hover:bg-slate-300 rounded-xl cursor-pointer transition-colors text-slate-700">⌫</button>
                    
                    <button onClick={() => handlePadInput('4')} className="py-2.5 text-xs font-bold bg-slate-100 hover:bg-slate-200/80 rounded-xl cursor-pointer transition-colors text-slate-700">4</button>
                    <button onClick={() => handlePadInput('5')} className="py-2.5 text-xs font-bold bg-slate-100 hover:bg-slate-200/80 rounded-xl cursor-pointer transition-colors text-slate-700">5</button>
                    <button onClick={() => handlePadInput('6')} className="py-2.5 text-xs font-bold bg-slate-100 hover:bg-slate-200/80 rounded-xl cursor-pointer transition-colors text-slate-700">6</button>
                    <button onClick={() => setMontoPago(total.toFixed(2))} className="py-2.5 text-[9px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100/80 rounded-xl cursor-pointer transition-colors" title="Cobro exacto">EXACTO</button>
                    
                    <button onClick={() => handlePadInput('1')} className="py-2.5 text-xs font-bold bg-slate-100 hover:bg-slate-200/80 rounded-xl cursor-pointer transition-colors text-slate-700">1</button>
                    <button onClick={() => handlePadInput('2')} className="py-2.5 text-xs font-bold bg-slate-100 hover:bg-slate-200/80 rounded-xl cursor-pointer transition-colors text-slate-700">2</button>
                    <button onClick={() => handlePadInput('3')} className="py-2.5 text-xs font-bold bg-slate-100 hover:bg-slate-200/80 rounded-xl cursor-pointer transition-colors text-slate-700">3</button>
                    <button onClick={() => handlePadInput('C')} className="py-2.5 text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200/50 hover:bg-rose-100 rounded-xl cursor-pointer transition-colors">LIMPIAR</button>
                    
                    <button onClick={() => handlePadInput('0')} className="col-span-2 py-2.5 text-xs font-bold bg-slate-100 hover:bg-slate-200/80 rounded-xl cursor-pointer transition-colors text-slate-700">0</button>
                    <button onClick={() => handlePadInput('.')} className="py-2.5 text-xs font-bold bg-slate-100 hover:bg-slate-200/80 rounded-xl cursor-pointer transition-colors text-slate-700">.</button>
                    <span className="bg-transparent" />
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================================
               LEYENDA DE ATAJOS PROFESIONAL (Modo Rápido)
               ========================================================================= */}
            {modo === 'rapido' && (
              <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-4 mt-2 animate-in fade-in slide-in-from-bottom-2 duration-300 shadow-inner">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2.5">Atajos de Teclado del Cajero</span>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-[9px]">F8</kbd>
                    <span>Buscar Prod.</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-[9px]">F9</kbd>
                    <span>Cobro / Pagar</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-[9px]">Ctrl + ↑/↓</kbd>
                    <span>Mover Foco</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-[9px]">+</kbd>
                    <span>Suma Cant.</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-[9px]">-</kbd>
                    <span>Resta Cant.</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-[9px]">Supr</kbd>
                    <span>Quitar Item</span>
                  </div>
                  <div className="flex items-center gap-1.5 col-span-2 mt-1 border-t border-slate-200/50 pt-1.5 text-emerald-700 font-extrabold justify-center">
                    <kbd className="px-2 py-0.5 bg-emerald-600 border border-emerald-700 text-white rounded font-mono text-[9px] mr-1">Enter</kbd>
                    <span>Liquidar y Emitir Ticket</span>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Botón de Confirmación Principal */}
          <button
            onClick={handleProcessCheckout}
            disabled={isProcessing || items.length === 0}
            className={`
              w-full py-4.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer mt-4
              ${isProcessing || items.length === 0
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/50'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:brightness-105 shadow-md shadow-emerald-600/10 active:scale-95'
              }
            `}
          >
            {isProcessing ? 'Procesando Venta...' : 'Finalizar y Cobrar (Enter)'}
          </button>
        </div>

      </div>

      {/* =========================================================================
         MODAL INTERACTIVO: APERTURA DE CAJA
         ========================================================================= */}
      {showAperturaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="w-[420px] rounded-3xl border border-slate-200/80 bg-white p-7 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-black text-slate-800 mb-1.5 tracking-tight">Apertura de Caja Obligatoria</h2>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              No hay una caja activa abierta. Ingresá el monto base de efectivo inicial en soles (sencillo) para habilitar las ventas de hoy.
            </p>

            <div className="flex flex-col gap-1.5 mb-5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Efectivo en Caja inicial:</label>
              <div className="relative flex items-center">
                <span className="absolute left-4 font-mono font-bold text-slate-400 text-lg">S/</span>
                <input
                  type="number"
                  value={montoAperturaInput}
                  onChange={(e) => setMontoAperturaInput(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-10 pr-4 font-mono text-lg font-bold text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all"
                />
              </div>
            </div>

            <button
              onClick={handleAbrirCaja}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 py-3.5 rounded-2xl font-black text-white text-xs uppercase tracking-wider hover:brightness-105 transition-all duration-300 shadow-md shadow-emerald-600/10 cursor-pointer"
            >
              Abrir Caja y Habilitar Ventas
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
         MODAL INTERACTIVO: SIMULADOR DE TICKET TÉRMICO
         ========================================================================= */}
      {showTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="w-[380px] max-h-[85vh] rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-base font-extrabold text-slate-800">Venta Exitosa ✓</h2>
              <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-black uppercase">
                IMPRESO 58MM
              </span>
            </div>

            {/* Visor de Ticket Físico en vivo */}
            <pre className="
              flex-1 rounded-2xl bg-slate-50 text-slate-800 p-4 font-mono text-[10px] overflow-y-auto shadow-inner leading-normal
              border-t-8 border-b-8 border-dashed border-slate-200
            ">
              {generatedTicket}
            </pre>

            <button
              onClick={() => {
                setShowTicketModal(false);
                setGeneratedTicket('');
              }}
              className="w-full mt-4 bg-slate-800 hover:bg-slate-900 py-3.5 rounded-2xl font-bold text-white text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer"
            >
              Cerrar y Siguiente Venta
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
         MODAL INTERACTIVO: NUEVA CUENTA / BILLETERA DIGITAL EN CALIENTE
         ========================================================================= */}
      {showNuevaCuentaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="w-[400px] rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-lg font-black text-slate-800 mb-1.5 tracking-tight">Agregar Cuenta / Billetera Digital</h2>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed font-semibold">
              Registrá una nueva cuenta en vivo. Esto te permite separar saldos por banco o pasarela de cobro.
            </p>

            <div className="flex flex-col gap-4 mb-5">
              {/* Nombre de la Cuenta */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Nombre del canal/banco:</label>
                <input
                  type="text"
                  value={nombreNuevaCuenta}
                  onChange={(e) => setNombreNuevaCuenta(e.target.value)}
                  placeholder="Ej. Yape - Interbank, Plin - Scotiabank"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-3.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 transition-all"
                />
              </div>

              {/* Saldo Inicial */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Saldo Inicial (S/):</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 font-mono font-bold text-slate-400 text-xs">S/</span>
                  <input
                    type="number"
                    value={saldoInicialNuevaCuenta}
                    onChange={(e) => setSaldoInicialNuevaCuenta(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-8 pr-3.5 font-mono text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowNuevaCuentaModal(false)}
                className="w-1/2 bg-slate-100 hover:bg-slate-200/80 py-3 rounded-xl font-black text-slate-600 text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              
              <button
                type="button"
                onClick={() => {
                  if (!nombreNuevaCuenta.trim()) {
                    alert('Por favor, ingresá un nombre para la billetera digital.');
                    return;
                  }
                  const baseNormalized = nombreNuevaCuenta.toLowerCase().trim().replace(/\s+/g, '-').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                  
                  agregarCuentaBilletera(nombreNuevaCuenta, parseFloat(saldoInicialNuevaCuenta) || 0);
                  
                  setTimeout(() => {
                    const state = useCartStore.getState();
                    const recienAgregada = state.cuentasBilletera.find(c => c.id.startsWith(baseNormalized));
                    if (recienAgregada) {
                      setCuentaDigitalSeleccionadaId(recienAgregada.id);
                    }
                  }, 50);

                  setShowNuevaCuentaModal(false);
                }}
                className="w-1/2 bg-gradient-to-r from-emerald-600 to-teal-600 py-3 rounded-xl font-black text-white text-xs uppercase tracking-wider hover:brightness-105 transition-all duration-300 shadow-md shadow-emerald-600/10 cursor-pointer"
              >
                Guardar Cuenta
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default CashRegister;
