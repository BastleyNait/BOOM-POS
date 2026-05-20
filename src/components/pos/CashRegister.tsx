'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { useCartStore } from '../../store/useCartStore';
import { useConfirmStore } from '../../store/useConfirmStore';
import { useToastStore } from '../../store/useToastStore';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { TabSelector } from './TabSelector';
import { ProductFinder } from './ProductFinder';
import { CartList } from './CartList';
import { confirmarVentaAction, abrirCajaAction } from '../../lib/supabase/actions';
import { formatTicketForThermalPrinter } from '../../lib/utils/ticketFormatter';
import { getIsMockMode } from '../../lib/supabase/client';

export function CashRegister() {
  const { addToast } = useToastStore();
  const { requestConfirm } = useConfirmStore();
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  
  // Zustand Store hooks
  const {
    tabs,
    activeTabIndex,
    cajaActivaId,
    setCajaActivaId,
    clearActiveTab,
    undoClearActiveTab,
    redoClearActiveTab,
    getActiveTabTotal,
    subtractStockFromActiveTab,
    addMockMovimiento,
    mockProducts,
    addToCart,
    cuentasBilletera,
    mockMovimientos,
    agregarCuentaBilletera,
    abrirCajaDiaria,
    cerrarCajaDiaria,
    historialCierres
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

  // Estados locales para la Calculadora Rápida [F7]
  const [quickName, setQuickName] = useState('');
  const [quickPrice, setQuickPrice] = useState('');

  // Estados locales para el Cierre de Caja Diaria [F10]
  const [showCierreModal, setShowCierreModal] = useState(false);
  const [efectivoDeclaradoInput, setEfectivoDeclaradoInput] = useState('');
  const [showCierreReport, setShowCierreReport] = useState(false);
  const [cierreReportData, setCierreReportData] = useState<any>(null);

  // Categorías y Productos para el Catálogo Rápido
  const [categoriaActiva, setCategoriaActiva] = useState<string>('Emporio');

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

  const categorias = ['Emporio', 'Bebidas', 'Snacks', 'Galletas', 'Lácteos', 'Abarrotes'];
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
      addToast('El carrito está vacío. Agregue productos antes de proceder al cobro.', 'warning');
      return;
    }

    if (!cajaActivaId) {
      addToast('La caja diaria está cerrada. Por favor, realice la apertura de caja antes de registrar ventas.', 'error');
      setShowAperturaModal(true);
      return;
    }

    if (metodoPago === 'billetera_digital' && !cuentaDigitalSeleccionadaId) {
      addToast('Por favor, seleccione una cuenta o billetera digital para recibir el cobro.', 'warning');
      return;
    }

    // Si pagan en efectivo, validar que entregaron suficiente dinero
    if (metodoPago === 'efectivo') {
      const pagoNum = parseFloat(montoPago) || 0;
      if (pagoNum < total) {
        addToast('El monto ingresado es insuficiente para cubrir el total a cobrar.', 'error');
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
        tipoModo: 'clasico', // Unificado a clásico
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
            motivo: `Venta POS en Emporio (${metodoPago === 'efectivo' ? 'Efectivo' : ctaNombre})`,
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
          tipoModo: 'clasico',
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
        addToast(`Error al procesar la venta: ${res.error}`, 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Error inesperado al intentar facturar.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Apertura de caja inicial
  const handleAbrirCaja = async () => {
    const monto = parseFloat(montoAperturaInput);
    if (isNaN(monto) || monto < 0) {
      addToast('Por favor, ingrese un monto de apertura válido.', 'warning');
      return;
    }

    try {
      const res = await abrirCajaAction(monto);
      if (res.success && res.data) {
        // Ejecutar apertura diaria en Zustand (limpia billeteras y crea id de caja)
        abrirCajaDiaria(monto);
        
        setShowAperturaModal(false);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      } else {
        addToast(`Error al abrir la caja: ${res.error}`, 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Error de conexión al abrir la caja diaria.', 'error');
    }
  };

  // Lógica para registrar un item desde la Calculadora Rápida [F7]
  const handleAddQuickItem = () => {
    const price = parseFloat(quickPrice);
    const name = quickName.trim() || 'Venta Rápida';

    if (isNaN(price) || price <= 0) {
      addToast('Por favor, ingrese un precio o monto numérico válido.', 'warning');
      return;
    }

    addToCart({
      id: 'custom-' + name.replace(/\s+/g, '-').toLowerCase() + '-' + price + '-' + Date.now(),
      nombre: name,
      codigo: 'RAPIDO',
      precio_costo: 0,
      precio_venta: price,
      cantidad: 1
    });

    // Resetear calculadora
    setQuickName('');
    setQuickPrice('');

    // Regresar foco al buscador general
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);
  };

  // Clicks rápidos de autocompletado en calculadora
  const handleQuickSuggestion = (name: string) => {
    setQuickName(name);
    setQuickPrice('');
    
    // Enfocar campo de precio/monto directamente para ingresar la lectura de la balanza
    setTimeout(() => {
      const priceInput = document.querySelector('input[name="quick-item-price"]') as HTMLInputElement | null;
      if (priceInput) {
        priceInput.focus();
        priceInput.select();
      }
    }, 50);
  };

  // Cierre diario definitivo
  const handleConfirmarCierre = () => {
    const declarado = parseFloat(efectivoDeclaradoInput);
    if (isNaN(declarado) || declarado < 0) {
      addToast('Por favor, ingrese un monto de efectivo validado.', 'warning');
      return;
    }

    const res = cerrarCajaDiaria(declarado);
    if (res.success && res.data) {
      setCierreReportData(res.data);
      setShowCierreModal(false);
      setShowCierreReport(true);
      setEfectivoDeclaradoInput('');
    } else {
      addToast(`Error durante el cierre de caja: ${res.error}`, 'error');
    }
  };

  // Setup de Atajos de Teclado Globales
  useKeyboardShortcuts({
    searchInputRef,
    onProcessCheckout: handleProcessCheckout,
  });

  return (
    <div className="flex h-screen flex-col bg-slate-50 text-slate-800 p-6 gap-5 font-sans antialiased overflow-hidden">
      
      {/* 1. Header Premium */}
      <header className="flex w-full items-center justify-between border-b border-slate-200/80 pb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent tracking-tight leading-none">
              BOOM POS
            </h1>
          </div>
          {getIsMockMode() && (
            <span className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-700 border border-orange-200/70 text-[9px] font-black tracking-wider uppercase px-3 py-1 rounded-full shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse"></span>
              Modo Demo Local (Offline)
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {cajaActivaId ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-700 border border-orange-200/70 text-[9px] font-black tracking-wider uppercase px-4 py-2.5 rounded-xl shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                Caja Diaria Activa
              </span>
              <button
                id="btn-cierre-caja"
                onClick={() => {
                  setEfectivoDeclaradoInput(efectivoCajaFisica.toFixed(2));
                  setShowCierreModal(true);
                }}
                className="inline-flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200/70 hover:border-rose-300 text-[9px] font-black tracking-wider uppercase px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm"
              >
                <span>🔒 Cerrar Caja [F10]</span>
              </button>
            </div>
          ) : (
            <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 border border-rose-200/70 text-[9px] font-black tracking-wider uppercase px-4 py-2.5 rounded-xl shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse"></span>
              Caja Cerrada
            </span>
          )}
        </div>
      </header>

      {/* 2. Pestañas de Clientes (F1 - F5) */}
      <div className="flex-shrink-0">
        <TabSelector />
      </div>

      {/* 3. Panel Principal Dividido Unificado (3 columnas adaptables a monitores cuadrados) */}
      <div className="flex flex-1 gap-4 overflow-hidden justify-center">
        
        {/* COLUMNA 1 (IZQUIERDA - OPERATIVA): Buscador, Calculadora Rápida y Carrito */}
        <div className="flex-1 max-w-[440px] min-w-[320px] flex flex-col gap-3 overflow-hidden">
          
          {/* Buscador de código de barras / manual */}
          <div className="relative">
            <ProductFinder inputRef={searchInputRef} />
            <span className="absolute right-4 top-3 text-[9px] font-extrabold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 pointer-events-none">
              F8
            </span>
          </div>

          {/* Calculadora Rápida [F7] (Rediseño Ultra-Compacto para maximizar la Canasta) */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-3 shadow-sm flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-700 flex items-center gap-1 uppercase tracking-wide">
                🧮 Calculadora Rápida
              </h3>
              <span className="text-[9px] font-extrabold bg-orange-50 text-orange-700 px-2 py-0.5 rounded border border-orange-200">
                [F7]
              </span>
            </div>

            {/* Accesos rápidos movidos a la categoría Emporio en la columna central */}

            {/* Formulario rápido delgado */}
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-7 flex flex-col gap-0.5">
                <label className="text-[8px] font-black text-slate-400 uppercase">Detalle del Producto</label>
                <input
                  name="quick-item-name"
                  type="text"
                  value={quickName}
                  onChange={(e) => setQuickName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      document.querySelector<HTMLInputElement>('input[name="quick-item-price"]')?.focus();
                    }
                  }}
                  placeholder="Ej. Pollo Fresco"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-1.5 px-2.5 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-600 focus:bg-white"
                />
              </div>

              <div className="col-span-5 flex flex-col gap-0.5">
                <label className="text-[8px] font-black text-slate-400 uppercase">Monto Balanza (S/)</label>
                <input
                  name="quick-item-price"
                  type="number"
                  step="0.01"
                  value={quickPrice}
                  onChange={(e) => setQuickPrice(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddQuickItem();
                    }
                  }}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-1.5 px-2.5 text-xs font-mono font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-600 focus:bg-white text-right"
                />
              </div>
            </div>

            {/* Sumario y botón ultra compacto */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-2 -mx-3 -mb-3 p-2 bg-slate-50/50 rounded-b-3xl px-3 flex-shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] font-black text-slate-400 uppercase leading-none">Inyectar:</span>
                <span className="text-xs font-black font-mono text-orange-600 leading-none">
                  S/ {(parseFloat(quickPrice) || 0).toFixed(2)}
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddQuickItem}
                className="bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-[9px] uppercase tracking-wider px-3.5 py-1.5 rounded-lg cursor-pointer shadow-sm active:scale-95 transition-all"
              >
                + Inyectar (Enter)
              </button>
            </div>
          </div>

          {/* Listado del Carrito */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white rounded-3xl border border-slate-200/80 p-4.5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-black text-slate-700 flex items-center gap-2 uppercase tracking-wide">
                🛍️ Canasta de Compras
              </h2>
              <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full font-mono font-black text-slate-600 border border-slate-200/50">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </span>
            </div>
            
            <div className="flex-1 overflow-hidden flex flex-col">
              <CartList />
            </div>

            {/* Botones de Control de Carrito */}
            <div className="border-t border-slate-100 pt-2.5 mt-2 flex justify-between items-center">
              <div className="flex gap-1.5">
                <button
                  onClick={() => undoClearActiveTab()}
                  disabled={!currentTab.undoStack || currentTab.undoStack.length === 0}
                  title="Deshacer limpiar carrito (Ctrl+Z)"
                  className="p-1.5 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white text-slate-500 rounded-lg border border-slate-200 transition-all cursor-pointer shadow-sm flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
                </button>
                <button
                  onClick={() => redoClearActiveTab()}
                  disabled={!currentTab.redoStack || currentTab.redoStack.length === 0}
                  title="Rehacer limpiar carrito (Ctrl+Y)"
                  className="p-1.5 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white text-slate-500 rounded-lg border border-slate-200 transition-all cursor-pointer shadow-sm flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>
                </button>
              </div>

              <button
                onClick={async () => {
                  const confirmarLimpieza = await requestConfirm('¿Está seguro que desea vaciar el carrito de compras?');
                  if (confirmarLimpieza) {
                    clearActiveTab();
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-700 text-[10px] font-extrabold uppercase rounded-lg border border-slate-200 hover:border-rose-200 transition-all cursor-pointer shadow-sm"
              >
                <span>🗑️ Limpiar Todo</span>
                <kbd className="px-1 py-0.2 bg-slate-50 border border-slate-200 rounded font-mono text-[8px] text-slate-400">ESC</kbd>
              </button>
            </div>
          </div>
        </div>

        {/* COLUMNA 2 (CENTRAL - CATÁLOGO): Grilla de Productos Rápidos por Categoría (Se oculta en pantallas angostas/cuadradas para evitar roturas) */}
        <div className="hidden xl:flex flex-1 min-w-[240px] bg-white rounded-3xl border border-slate-200/80 p-4 shadow-sm overflow-hidden flex-col">
          {/* Selector de Categorías */}
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4 overflow-x-auto">
            {categorias.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoriaActiva(cat)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  categoriaActiva === cat
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Cuadrícula de Productos */}
          <div className="flex-1 overflow-y-auto grid grid-cols-2 xl:grid-cols-3 gap-3 pr-1 align-content-start">
            {categoriaActiva === 'Emporio' ? (
              [
                { name: 'Pollo Fresco', emoji: '🍗' },
                { name: 'Carne de Res', emoji: '🍖' },
                { name: 'Carne de Chancho', emoji: '🥓' },
                { name: 'Milanesa', emoji: '🥩' },
                { name: 'Verduras', emoji: '🥬' },
                { name: 'Frutas', emoji: '🍎' },
                { name: 'Arroz', emoji: '🍚' },
                { name: 'Azúcar', emoji: '🧊' },
                { name: 'Harina', emoji: '🌾' },
                { name: 'Varios / Otros', emoji: '➕' }
              ].map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleQuickSuggestion(item.name)}
                  className="p-4 rounded-2xl border text-center flex flex-col items-center justify-center h-28 transition-all relative cursor-pointer bg-amber-50/50 border-amber-200/80 hover:bg-amber-100 hover:border-amber-500 hover:shadow-md active:scale-95"
                >
                  <span className="text-3xl mb-2">{item.emoji}</span>
                  <span className="text-xs font-black text-slate-800 leading-snug">{item.name}</span>
                </button>
              ))
            ) : productosFiltrados.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-center text-slate-400">
                <svg className="h-8 w-8 mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p className="text-xs font-bold uppercase tracking-wider">No hay productos en {categoriaActiva}</p>
                <p className="text-[11px] text-slate-400 mt-1">Registrá productos con esta categoría en Inventario.</p>
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
                      p-4.5 rounded-2xl border text-left flex flex-col justify-between h-28 transition-all relative cursor-pointer group select-none
                      ${isOutOfStock
                        ? 'bg-slate-50 border-slate-200/50 opacity-40 cursor-not-allowed'
                        : 'bg-slate-50/50 border-slate-200/80 hover:bg-white hover:border-orange-500 hover:shadow-md active:scale-95'
                      }
                    `}
                  >
                    <div>
                      <span className="text-xs font-black text-slate-800 leading-snug block line-clamp-2 group-hover:text-orange-800 transition-colors">
                        {prod.nombre}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400 mt-1 block">Cod: {prod.codigo}</span>
                    </div>

                    <div className="flex items-center justify-between mt-2 border-t border-slate-100 pt-2 w-full">
                      <span className="font-mono text-sm font-black text-orange-600">
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

        {/* COLUMNA 3 (DERECHA - CAJA & AUDITORÍA): Totales, Liquidación y Cierre de Caja */}
        <div className="w-[420px] xl:w-[460px] rounded-3xl border border-slate-200/80 bg-white p-4 shadow-md flex flex-col justify-between overflow-y-auto flex-shrink-0">
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-black text-slate-800 pb-2 border-b border-slate-100 uppercase tracking-wider flex justify-between items-center">
              <span>Liquidación de Caja</span>
              <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono text-[8px] text-slate-500 shadow-sm">F9</kbd>
            </h2>

            {/* Fila de Totales */}
            <div className="flex flex-col gap-2 bg-slate-50/50 p-3.5 rounded-2xl border border-slate-200/50">
              <div className="flex justify-between text-xs font-bold text-slate-500">
                <span>Subtotal</span>
                <span className="font-mono text-slate-800 font-bold">S/ {subtotal.toFixed(2)}</span>
              </div>
              
              {descuentoTotal > 0 && (
                <div className="flex justify-between text-xs text-orange-600 font-bold">
                  <span>Descuento aplicado</span>
                  <span className="font-mono">-S/ {descuentoTotal.toFixed(2)}</span>
                </div>
              )}

              <div className="flex flex-col gap-0.5 border-t border-slate-200/60 pt-3">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-black">Total a Cobrar</span>
                <span className="text-3xl font-black font-mono text-orange-600 tracking-tight leading-none mt-1">
                  S/ {total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Método de Pago Selector */}
            <div className="flex flex-col gap-1.5 pt-1">
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
                  📱 Billetera
                </button>
              </div>
            </div>

            {/* Renderizar según método de pago */}
            {metodoPago === 'efectivo' ? (
              <>
                {/* Input de Efectivo del Cliente */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      Efectivo Recibido (Paga con):
                    </label>
                    <kbd className="px-1.5 py-0.5 bg-slate-50 border border-slate-300 rounded font-mono text-[8px] text-slate-500 shadow-sm">F9</kbd>
                  </div>
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
                        outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all shadow-sm
                      "
                    />
                  </div>
                  
                  {/* Botones rápidos de billetes */}
                  <div className="grid grid-cols-5 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setMontoPago(total.toFixed(2));
                        setTimeout(() => document.querySelector<HTMLInputElement>('input[name="monto-pago"]')?.focus(), 50);
                      }}
                      className="py-2 px-1 bg-orange-50 hover:bg-orange-100 text-[10px] font-black text-orange-700 border border-orange-200/50 rounded-xl transition-all cursor-pointer text-center shadow-sm"
                    >
                      Exacto
                    </button>
                    {[10, 20, 50, 100].map((bill) => (
                      <button
                        key={bill}
                        type="button"
                        onClick={() => {
                          setMontoPago(bill.toFixed(2));
                          setTimeout(() => document.querySelector<HTMLInputElement>('input[name="monto-pago"]')?.focus(), 50);
                        }}
                        className="py-2 px-1 bg-slate-100 hover:bg-slate-200 text-[10px] font-mono font-black text-slate-700 border border-slate-200/80 rounded-xl transition-all cursor-pointer text-center shadow-sm"
                      >
                        S/ {bill}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Vuelto a Entregar */}
                {parseFloat(montoPago) > 0 && (
                  <div className="rounded-2xl bg-orange-50 border border-orange-100 p-3 flex justify-between items-center shadow-sm">
                    <span className="text-[10px] font-bold text-orange-800 uppercase tracking-wider">Vuelto a entregar:</span>
                    <span className="text-xl font-black font-mono text-orange-600">
                      S/ {cambio.toFixed(2)}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col gap-2 p-3.5 bg-slate-50 border border-slate-200/70 rounded-2xl">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Destino:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setNombreNuevaCuenta('');
                      setSaldoInicialNuevaCuenta('0');
                      setShowNuevaCuentaModal(true);
                    }}
                    className="text-[9px] font-black text-orange-600 hover:text-orange-800 cursor-pointer flex items-center bg-orange-50 px-2 py-1 rounded-md border border-orange-100"
                  >
                    <span>+ Nueva Cuenta</span>
                  </button>
                </div>
                
                <select
                  value={cuentaDigitalSeleccionadaId}
                  onChange={(e) => setCuentaDigitalSeleccionadaId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-bold text-slate-700 focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  {cuentasBilletera.map((cta) => (
                    <option key={cta.id} value={cta.id}>
                      {cta.nombre} (Saldo: S/ {cta.saldo.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Arqueo de Caja y Billeteras en Vivo */}
            <div className=" border-t border-slate-100 pt-2 flex flex-col gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                Arqueo Financiero en Vivo
              </span>
              <div className="grid grid-cols-3 gap-2 max-h-[120px] overflow-y-auto pr-1">
                <div className="p-2.5 bg-slate-50 border border-slate-200/50 rounded-xl flex flex-col">
                  <span className="text-[8px] text-slate-400 font-bold uppercase">Caja Física (Drawer)</span>
                  <span className="text-xs font-black font-mono text-slate-700 mt-0.5">
                    S/ {efectivoCajaFisica.toFixed(2)}
                  </span>
                </div>
                {cuentasBilletera.map((cta) => (
                  <div key={cta.id} className="p-2.5 bg-slate-50 border border-slate-200/50 rounded-xl flex flex-col">
                    <span className="text-[8px] text-slate-400 font-bold uppercase truncate" title={cta.nombre}>
                      {cta.nombre}
                    </span>
                    <span className="text-xs font-black font-mono text-orange-600 mt-0.5">
                      S/ {cta.saldo.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-1 bg-slate-900 text-white p-3 rounded-xl flex justify-between items-center shadow-inner">
                <span className="text-[9px] font-black uppercase tracking-wider">Saldo Total Diario:</span>
                <span className="text-xs font-black font-mono text-orange-400">
                  S/ {(efectivoCajaFisica + cuentasBilletera.reduce((sum, c) => sum + c.saldo, 0)).toFixed(2)}
                </span>
              </div>
            </div>


          </div>

          {/* Botón de Confirmación Principal */}
          <div className="flex flex-col gap-1.5 mt-2">
            <button
              onClick={handleProcessCheckout}
              disabled={isProcessing || items.length === 0}
              className={`
                w-full py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer
                ${isProcessing || items.length === 0
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/50'
                  : 'bg-gradient-to-r from-orange-600 to-amber-600 text-white hover:brightness-105 shadow-md shadow-orange-600/10 active:scale-95'
                }
              `}
            >
              {isProcessing ? 'Procesando Venta...' : 'Finalizar y Cobrar (F12)'}
            </button>
          </div>
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
              No hay una caja activa abierta. Ingresá el monto de sencillo inicial en soles para habilitar las ventas de hoy. Las billeteras digitales iniciarán estrictamente en cero.
            </p>

            <div className="flex flex-col gap-1.5 mb-5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Monto Inicial Sencillo:</label>
              <div className="relative flex items-center">
                <span className="absolute left-4 font-mono font-bold text-slate-400 text-lg">S/</span>
                <input
                  type="number"
                  value={montoAperturaInput}
                  onChange={(e) => setMontoAperturaInput(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-10 pr-4 font-mono text-lg font-bold text-slate-800 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all"
                />
              </div>
            </div>

            <button
              onClick={handleAbrirCaja}
              className="w-full bg-gradient-to-r from-orange-600 to-amber-600 py-3.5 rounded-2xl font-black text-white text-xs uppercase tracking-wider hover:brightness-105 transition-all duration-300 shadow-md shadow-orange-600/10 cursor-pointer"
            >
              Abrir Caja y Habilitar Ventas
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
         🔒 MODAL INTERACTIVO: CIERRE DE CAJA DIARIA (ARQUEO FISICO)
         ========================================================================= */}
      {showCierreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="w-[440px] rounded-3xl border border-slate-200/80 bg-white p-6.5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-1.5">
              <h2 className="text-lg font-black text-slate-800 tracking-tight">Cierre y Arqueo de Caja Diaria</h2>
              <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-black uppercase">Auditoría</span>
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed font-semibold">
              Declaración del arqueo físico de billetes y monedas en la gaveta. Se contrastará con los movimientos computados por la terminal.
            </p>

            <div className="flex flex-col gap-3.5 mb-5">
              {/* Saldo Esperado Computado */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/50 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500">Saldo Físico Esperado:</span>
                <span className="text-lg font-black font-mono text-slate-800">S/ {efectivoCajaFisica.toFixed(2)}</span>
              </div>

              {/* Input Declaración Física */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Efectivo Físico Real Declarado (Caja):</label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 font-mono font-bold text-slate-400 text-lg">S/</span>
                  <input
                    type="number"
                    value={efectivoDeclaradoInput}
                    onChange={(e) => setEfectivoDeclaradoInput(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50/50 py-3.5 pl-10 pr-4 font-mono text-lg font-bold text-slate-800 focus:outline-none focus:border-orange-600 focus:bg-white focus:ring-4 focus:ring-orange-600/10 transition-all"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Desviaciones Reactivas en Caliente */}
              {efectivoDeclaradoInput !== '' && (
                (() => {
                  const dif = (parseFloat(efectivoDeclaradoInput) || 0) - efectivoCajaFisica;
                  return (
                    <div className={`p-3.5 rounded-2xl border flex justify-between items-center shadow-sm ${
                      Math.abs(dif) < 0.01 
                        ? 'bg-orange-50 border-orange-200 text-orange-800' 
                        : dif > 0 
                          ? 'bg-amber-50 border-amber-200 text-amber-800' 
                          : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}>
                      <span className="text-xs font-black uppercase">
                        {Math.abs(dif) < 0.01 
                          ? '✓ Caja Perfectamente Cuadrada' 
                          : dif > 0 
                            ? '🟢 Sobrante de Caja' 
                            : '🔴 Discrepancia / Faltante'}
                      </span>
                      <span className="text-base font-black font-mono">
                        {dif >= 0 ? '+' : ''}S/ {dif.toFixed(2)}
                      </span>
                    </div>
                  );
                })()
              )}
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowCierreModal(false)}
                className="w-1/2 bg-slate-100 hover:bg-slate-200 py-3.5 rounded-2xl font-black text-slate-600 text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Volver
              </button>
              
              <button
                type="button"
                onClick={handleConfirmarCierre}
                className="w-1/2 bg-slate-900 hover:bg-slate-800 py-3.5 rounded-2xl font-black text-white text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
              >
                🔒 Confirmar y Cerrar Caja
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
         📋 MODAL INTERACTIVO: REPORTE DE AUDITORÍA DE CIERRE DE CAJA
         ========================================================================= */}
      {showCierreReport && cierreReportData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="w-[450px] rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-base font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
                <span>📄 Reporte Auditoría de Cierre</span>
              </h2>
              <span className="text-[9px] bg-slate-900 text-orange-400 border border-slate-800 px-2.5 py-0.5 rounded-full font-black uppercase">
                EMITIDO
              </span>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-50 border border-slate-200/50 p-4.5 rounded-2xl font-mono text-xs flex flex-col gap-3 text-slate-700 shadow-inner">
              <div className="text-center font-black text-slate-900 border-b border-dashed border-slate-300 pb-2 mb-1">
                BOOM POS - CIERRE DIARIO
                <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">EMPORIO Y MULTICANALES</div>
              </div>

              <div className="flex justify-between">
                <span>Fecha Apertura:</span>
                <span className="font-bold text-slate-900">{new Date(cierreReportData.fechaApertura).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Fecha Cierre:</span>
                <span className="font-bold text-slate-900">{new Date(cierreReportData.fechaCierre).toLocaleString()}</span>
              </div>

              <div className="border-t border-dashed border-slate-200 my-1"></div>

              <div className="flex justify-between">
                <span>Saldo Apertura (Efectivo):</span>
                <span className="font-bold text-slate-900">S/ {cierreReportData.montoApertura.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Ventas Efectivo (+):</span>
                <span className="font-bold text-slate-900">S/ {cierreReportData.ventasEfectivo.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>Gastos/Egresos Efectivo (-):</span>
                <span className="font-bold">-S/ {cierreReportData.egresosEfectivo.toFixed(2)}</span>
              </div>

              <div className="border-t border-dashed border-slate-200 my-1"></div>

              <div className="flex justify-between bg-slate-200/50 p-1.5 rounded font-black text-slate-900">
                <span>Saldo Efectivo Esperado:</span>
                <span>S/ {cierreReportData.saldoFinalEfectivo.toFixed(2)}</span>
              </div>

              <div className="border-t border-dashed border-slate-200 my-1"></div>

              <div className="font-black text-slate-900">Saldos Billeteras (Cierre a 0):</div>
              {Object.entries(cierreReportData.saldoFinalBilleteras).map(([id, saldo]: any) => {
                const cta = cuentasBilletera.find(c => c.id === id) || { nombre: id };
                return (
                  <div key={id} className="flex justify-between pl-3 text-slate-600">
                    <span>• {cta.nombre}:</span>
                    <span className="font-bold text-orange-600">S/ {saldo.toFixed(2)}</span>
                  </div>
                );
              })}

              <div className="border-t border-dashed border-slate-300 my-1"></div>

              <div className="flex justify-between font-black text-slate-900 bg-slate-900 text-orange-400 p-2 rounded">
                <span>Total Recaudado Neto:</span>
                <span>S/ {cierreReportData.totalNeto.toFixed(2)}</span>
              </div>

              <div className="text-[10px] text-slate-400 font-bold uppercase mt-2 text-center">
                * Billeteras reseteadas a S/0.00 para la próxima jornada contable.
              </div>
            </div>

            <button
              onClick={() => {
                setShowCierreReport(false);
                setCierreReportData(null);
                // Forzar re-enfoque de apertura al cerrar
                setShowAperturaModal(true);
              }}
              className="w-full mt-4 bg-slate-900 hover:bg-slate-800 py-3.5 rounded-2xl font-black text-white text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer shadow-md"
            >
              Confirmar y Aceptar Cierre
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
              <span className="text-[9px] bg-orange-50 text-orange-700 border border-orange-200 px-2.5 py-0.5 rounded-full font-black uppercase">
                IMPRESO 58MM
              </span>
            </div>

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
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Nombre del canal/banco:</label>
                <input
                  type="text"
                  value={nombreNuevaCuenta}
                  onChange={(e) => setNombreNuevaCuenta(e.target.value)}
                  placeholder="Ej. Yape - Interbank, Plin - Scotiabank"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-3.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/5 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Saldo Inicial (S/):</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 font-mono font-bold text-slate-400 text-xs">S/</span>
                  <input
                    type="number"
                    value={saldoInicialNuevaCuenta}
                    onChange={(e) => setSaldoInicialNuevaCuenta(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-8 pr-3.5 font-mono text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/5 transition-all"
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
                    addToast('Por favor, ingrese un nombre para la billetera digital.', 'warning');
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
                className="w-1/2 bg-gradient-to-r from-orange-600 to-amber-600 py-3 rounded-xl font-black text-white text-xs uppercase tracking-wider hover:brightness-105 transition-all duration-300 shadow-md shadow-orange-600/10 cursor-pointer"
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
