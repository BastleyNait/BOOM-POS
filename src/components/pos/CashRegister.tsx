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

const getItemIcon = (name: string) => {
  switch (name) {
    case 'Pollo Fresco':
      return (
        <svg className="w-8 h-8 text-amber-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 3a6 6 0 016 6c0 2.5-2 4.5-4.5 5.5l-3.5 3.5a2.5 2.5 0 01-3.5-3.5l3.5-3.5C14 11 12 9 12 9a6 6 0 013-6z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 16a2.5 2.5 0 10-5 0 2.5 2.5 0 005 0z" />
        </svg>
      );
    case 'Carne de Res':
      return (
        <svg className="w-8 h-8 text-amber-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 12m-2 0a2 2 0 104 0 2 2 0 00-4 0" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10V4M10 12H4" />
        </svg>
      );
    case 'Carne de Chancho':
      return (
        <svg className="w-8 h-8 text-amber-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" />
          <ellipse cx="12" cy="12" rx="4" ry="3" stroke="currentColor" strokeWidth="2.5" />
          <circle cx="10" cy="12" r="1.2" fill="currentColor" />
          <circle cx="14" cy="12" r="1.2" fill="currentColor" />
        </svg>
      );
    case 'Milanesa':
      return (
        <svg className="w-8 h-8 text-amber-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 10c0-4 6-6 10-4s8 4 8 8-4 8-10 6-8-6-8-8z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h.01M12 10h.01M15 13h.01M11 15h.01" />
        </svg>
      );
    case 'Verduras':
      return (
        <svg className="w-8 h-8 text-amber-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 19l2.5-2.5m-1-1l6.5-6.5C14.5 7.5 16 6 17 6c1.5 0 2.5 1 2.5 2.5 0 1-1.5 2.5-3 4l-6.5 6.5-1-1.5" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18.5 7.5L21 5m-2.5 2.5L20 9" />
        </svg>
      );
    case 'Frutas':
      return (
        <svg className="w-8 h-8 text-amber-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.5C10.5 5 8 5 6.5 6.5c-2 2-2 5.5 0 7.5 1 1 2.5 2 5.5 3 3-1 4.5-2 5.5-3 2-2 2-5.5 0-7.5C16 5 13.5 5 12 6.5z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.5V4c1.5 0 2-1 2-1" />
        </svg>
      );
    case 'Arroz':
      return (
        <svg className="w-8 h-8 text-amber-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2 10a10 10 0 0020 0H2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 20h6" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 6c0-1.5 1-2 1-2M12 6c0-2 1-2 1-2M17 6c0-1.5 1-2 1-2" />
        </svg>
      );
    case 'Azúcar':
      return (
        <svg className="w-8 h-8 text-amber-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="4" y="10" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2.5" />
          <rect x="13" y="10" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2.5" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 6h.01M17 6h.01M12 8h.01" />
        </svg>
      );
    case 'Harina':
      return (
        <svg className="w-8 h-8 text-amber-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 22V2M12 6c-2-1.5-3 .5-3 .5s1 2 3 .5M12 11c-2-1.5-3 .5-3 .5s1 2 3 .5M12 16c-2-1.5-3 .5-3 .5s1 2 3 .5" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6c2-1.5 3 .5 3 .5s-1 2-3 .5M12 11c2-1.5 3 .5 3 .5s-1 2-3 .5M12 16c2-1.5 3 .5 3 .5s-1 2-3 .5" />
        </svg>
      );
    default:
      return (
        <svg className="w-8 h-8 text-amber-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      );
  }
};

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
  const [showArqueoModal, setShowArqueoModal] = useState(false);

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
        nota: item.nota || undefined,
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
    <div className="flex min-h-[100dvh] flex-col bg-base text-ink p-6 gap-5 font-sans antialiased overflow-hidden transition-all duration-300 ease-expo">
      
      {/* 1. Header Premium */}
      <header className="flex w-full items-center justify-between border-b border-edge pb-4 flex-shrink-0 transition-colors duration-200">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-black text-brand tracking-tight leading-none transition-colors duration-200">
              BOOM POS
            </h1>
          </div>
          {getIsMockMode() && (
            <span className="inline-flex items-center gap-1.5 bg-brand-subtle text-brand-text border border-brand/20 text-[9px] font-black tracking-wider uppercase px-3 py-1 rounded-full shadow-card">
              <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse"></span>
              Modo Demo Local (Offline)
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {cajaActivaId ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-brand-subtle text-brand-text border border-brand/20 text-[9px] font-black tracking-wider uppercase px-4 py-2.5 rounded-xl shadow-card">
                <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse"></span>
                Caja Diaria Activa
              </span>
              <button
                id="btn-cierre-caja"
                onClick={() => {
                  setEfectivoDeclaradoInput(efectivoCajaFisica.toFixed(2));
                  setShowCierreModal(true);
                }}
                className="inline-flex items-center gap-1.5 bg-negative-subtle hover:bg-negative-subtle/80 text-negative-text border border-negative/20 text-[9px] font-black tracking-wider uppercase px-4 py-2.5 rounded-xl transition-all duration-200 ease-expo cursor-pointer shadow-card active:scale-[0.98] group"
              >
                <svg className="w-3 h-3 text-negative transition-transform group-hover:scale-110 duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Cerrar Caja [F10]</span>
              </button>
            </div>
          ) : (
            <span className="inline-flex items-center gap-1.5 bg-negative-subtle text-negative-text border border-negative/20 text-[9px] font-black tracking-wider uppercase px-4 py-2.5 rounded-xl shadow-card">
              <span className="h-1.5 w-1.5 rounded-full bg-negative animate-pulse"></span>
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
        <div className="flex-1 max-w-[340px] 2xl:max-w-[440px] min-w-[280px] flex flex-col gap-3 overflow-hidden">

          {/* Calculadora Rápida [F7] (Rediseño Ultra-Compacto para maximizar la Canasta) */}
          <div className="bg-surface rounded-xl border border-edge p-3 shadow-card flex flex-col gap-2 transition-all duration-200 ease-expo">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-ink flex items-center gap-1.5 uppercase tracking-wide">
                <svg className="w-3.5 h-3.5 text-ink-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Calculadora Rápida
              </h3>
              <span className="text-[9px] font-extrabold bg-brand-subtle text-brand-text px-2 py-0.5 rounded-full border border-brand/20">
                [F7]
              </span>
            </div>

            {/* Accesos rápidos movidos a la categoría Emporio en la columna central */}

            {/* Formulario rápido delgado */}
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-7 flex flex-col gap-0.5">
                <label className="text-[8px] font-black text-ink-tertiary uppercase">Detalle del Producto</label>
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
                  className="w-full rounded-lg border border-edge bg-inset py-1.5 px-2.5 text-xs font-bold text-ink placeholder-ink-tertiary focus:outline-none focus:border-brand focus:bg-surface focus:ring-1 focus:ring-brand/20 transition-all duration-200 ease-expo"
                />
              </div>

              <div className="col-span-5 flex flex-col gap-0.5">
                <label className="text-[8px] font-black text-ink-tertiary uppercase">Monto Balanza (S/)</label>
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
                  className="w-full rounded-lg border border-edge bg-inset py-1.5 px-2.5 text-xs font-mono font-bold text-ink placeholder-ink-tertiary focus:outline-none focus:border-brand focus:bg-surface focus:ring-1 focus:ring-brand/20 text-right transition-all duration-200 ease-expo"
                />
              </div>
            </div>

            {/* Sumario y botón ultra compacto */}
            <div className="flex items-center justify-between border-t border-edge pt-2 -mx-3 -mb-3 p-2 bg-inset rounded-b-xl px-3 flex-shrink-0 transition-all duration-200">
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] font-black text-ink-tertiary uppercase leading-none">Inyectar:</span>
                <span className="text-xs font-black font-mono text-brand leading-none">
                  S/ {(parseFloat(quickPrice) || 0).toFixed(2)}
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddQuickItem}
                className="bg-brand hover:bg-brand-hover text-ink-inverted font-extrabold text-[9px] uppercase tracking-wider px-3.5 py-1.5 rounded-lg cursor-pointer shadow-card active:scale-[0.98] transition-all duration-200 ease-expo"
              >
                + Inyectar (Enter)
              </button>
            </div>
          </div>

          {/* Listado del Carrito */}
          <div className="flex-1 flex flex-col overflow-hidden bg-surface rounded-xl border border-edge p-4.5 shadow-card transition-all duration-200 ease-expo">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-black text-ink flex items-center gap-2 uppercase tracking-wide">
                <svg className="w-4 h-4 text-ink-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Canasta de Compras
              </h2>
              <span className="text-[10px] bg-inset px-2 py-0.5 rounded-full font-mono font-black text-ink-secondary border border-edge shadow-inner">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </span>
            </div>
            
            <div className="flex-1 overflow-hidden flex flex-col">
              <CartList />
            </div>

            {/* Botones de Control de Carrito */}
            <div className="border-t border-edge pt-2.5 mt-2 flex justify-between items-center transition-all duration-200">
              <div className="flex gap-1.5">
                <button
                  onClick={() => undoClearActiveTab()}
                  disabled={!currentTab.undoStack || currentTab.undoStack.length === 0}
                  title="Deshacer limpiar carrito (Ctrl+Z)"
                  className="p-1.5 bg-surface hover:bg-inset disabled:opacity-30 disabled:hover:bg-surface text-ink-secondary rounded-lg border border-edge transition-all duration-200 ease-expo cursor-pointer shadow-card flex items-center justify-center active:scale-[0.95]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
                </button>
                <button
                  onClick={() => redoClearActiveTab()}
                  disabled={!currentTab.redoStack || currentTab.redoStack.length === 0}
                  title="Rehacer limpiar carrito (Ctrl+Y)"
                  className="p-1.5 bg-surface hover:bg-inset disabled:opacity-30 disabled:hover:bg-surface text-ink-secondary rounded-lg border border-edge transition-all duration-200 ease-expo cursor-pointer shadow-card flex items-center justify-center active:scale-[0.95]"
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface hover:bg-negative-subtle text-ink-secondary hover:text-negative-text text-[10px] font-extrabold uppercase rounded-lg border border-edge hover:border-negative/20 transition-all duration-200 ease-expo cursor-pointer shadow-card active:scale-[0.98] group"
              >
                <svg className="w-3.5 h-3.5 text-ink-tertiary group-hover:text-negative transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Limpiar Todo
                <kbd className="px-1 py-0.2 bg-inset border border-edge text-ink-tertiary rounded font-mono text-[8px] ml-1">ESC</kbd>
              </button>
            </div>
          </div>
        </div>

        {/* COLUMNA 2 (CENTRAL - CATÁLOGO): Grilla de Productos Rápidos por Categoría (Se oculta en pantallas angostas/cuadradas para evitar roturas) */}
        <div className="flex flex-1 min-w-[240px] max-w-[500px] bg-surface rounded-xl border border-edge p-4 shadow-card overflow-hidden flex-col transition-all duration-200 ease-expo">

          {/* Buscador de código de barras / manual */}
          <div className="relative mb-3">
            <ProductFinder inputRef={searchInputRef} />
            <span className="absolute right-4 top-3 text-[9px] font-extrabold bg-inset text-ink-tertiary px-1.5 py-0.5 rounded border border-edge pointer-events-none font-mono">
              F8
            </span>
          </div>

          {/* Selector de Categorías */}
          <div className="flex items-center gap-2 border-b border-edge pb-3 mb-4 overflow-x-auto scrollbar-none">
            {categorias.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoriaActiva(cat)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 ease-expo cursor-pointer active:scale-[0.98] ${
                  categoriaActiva === cat
                    ? 'bg-ink text-ink-inverted shadow-card'
                    : 'bg-inset text-ink-secondary hover:bg-surface hover:text-ink border border-edge'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Cuadrícula de Productos */}
          <div className="flex-1 overflow-y-auto grid grid-cols-2 2xl:grid-cols-3 gap-3 pr-1 align-content-start">
            {categoriaActiva === 'Emporio' ? (
              [
                { name: 'Pollo Fresco' },
                { name: 'Carne de Res' },
                { name: 'Carne de Chancho' },
                { name: 'Milanesa' },
                { name: 'Verduras' },
                { name: 'Frutas' },
                { name: 'Arroz' },
                { name: 'Azúcar' },
                { name: 'Harina' },
                { name: 'Varios / Otros' }
              ].map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleQuickSuggestion(item.name)}
                  className="p-4 rounded-xl border text-center flex flex-col items-center justify-center h-28 transition-all duration-200 ease-expo relative cursor-pointer bg-brand-subtle/30 border-brand/20 hover:bg-brand-subtle hover:border-brand hover:shadow-panel active:scale-[0.98] group"
                >
                  {getItemIcon(item.name)}
                  <span className="text-xs font-black text-ink leading-snug group-hover:text-brand transition-colors duration-200">{item.name}</span>
                </button>
              ))
            ) : productosFiltrados.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-center text-ink-tertiary">
                <svg className="h-8 w-8 mb-3 text-ink-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p className="text-xs font-bold uppercase tracking-wider">No hay productos en {categoriaActiva}</p>
                <p className="text-[11px] text-ink-tertiary mt-1">Registrá productos con esta categoría en Inventario.</p>
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
                      p-4.5 rounded-xl border text-left flex flex-col justify-between h-28 transition-all duration-200 ease-expo relative cursor-pointer group select-none active:scale-[0.98]
                      ${isOutOfStock
                        ? 'bg-inset border-edge opacity-40 cursor-not-allowed'
                        : 'bg-inset border-edge hover:bg-surface hover:border-brand hover:shadow-panel'
                      }
                    `}
                  >
                    <div>
                      <span className="text-xs font-black text-ink leading-snug block line-clamp-2 group-hover:text-brand transition-colors duration-200">
                        {prod.nombre}
                      </span>
                      <span className="text-[9px] font-mono text-ink-tertiary mt-1 block">Cod: {prod.codigo}</span>
                    </div>

                    <div className="flex items-center justify-between mt-2 border-t border-edge pt-2 w-full transition-colors duration-200">
                      <span className="font-mono text-sm font-black text-brand">
                        S/ {prod.precio_venta.toFixed(2)}
                      </span>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        isOutOfStock
                          ? 'bg-negative-subtle text-negative-text'
                          : isLow
                            ? 'bg-caution-subtle text-caution-text'
                            : 'bg-inset text-ink-secondary border border-edge'
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
        <div className="relative w-[320px] xl:w-[360px] 2xl:w-[420px] rounded-xl flex flex-col flex-shrink-0 transition-all duration-200 ease-expo">
          <div className="bg-surface rounded-xl border border-edge shadow-panel flex flex-col justify-between overflow-y-auto h-full p-4 scrollbar-thin">
          
          {/* Botón flotante Arqueo */}
          <button
            type="button"
            onClick={() => setShowArqueoModal(true)}
            className="absolute -top-3 -right-3 w-10 h-10 bg-brand text-ink-inverted rounded-full flex items-center justify-center shadow-float hover:shadow-modal hover:scale-110 hover:bg-brand-hover transition-all duration-200 ease-spring z-20 group cursor-pointer"
          >
            <svg className="w-5 h-5 text-ink-inverted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="absolute -top-10 right-0 w-max bg-ink text-ink-inverted text-[10px] font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-panel">
              Arqueo financiero en tiempo real
            </span>
          </button>
          <div className="flex flex-col">
            <h2 className="text-sm font-black text-ink pb-2 border-b border-edge uppercase tracking-wider flex justify-between items-center transition-colors duration-200">
              <span>Liquidación de Caja</span>
              <kbd className="px-1.5 py-0.5 bg-inset border border-edge rounded font-mono text-[8px] text-ink-tertiary shadow-card">F9</kbd>
            </h2>

            {/* Fila de Totales */}
            <div className="flex flex-col gap-2 bg-inset p-3.5 rounded-xl border border-edge mt-3 transition-all duration-200">
              <div className="flex justify-between text-xs font-bold text-ink-secondary">
                <span>Subtotal</span>
                <span className="font-mono text-ink font-bold">S/ {subtotal.toFixed(2)}</span>
              </div>
              
              {descuentoTotal > 0 && (
                <div className="flex justify-between text-xs text-brand font-bold">
                  <span>Descuento aplicado</span>
                  <span className="font-mono">-S/ {descuentoTotal.toFixed(2)}</span>
                </div>
              )}

              <div className="flex flex-col gap-0.5 border-t border-edge pt-3 mt-1">
                <span className="text-[10px] uppercase tracking-wider text-ink-tertiary font-black">Total a Cobrar</span>
                <span className="text-3xl font-black font-mono text-brand tracking-tight leading-none mt-1">
                  S/ {total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Método de Pago Selector */}
            <div className="flex flex-col gap-1.5 pt-3 transition-all duration-200">
              <label className="text-[10px] font-black text-ink-tertiary uppercase tracking-wider">
                Método de Pago:
              </label>
              <div className="grid grid-cols-2 gap-2 bg-inset p-1 rounded-xl border border-edge">
                <button
                  type="button"
                  onClick={() => {
                    setMetodoPago('efectivo');
                    setMontoPago('');
                    setCambio(0);
                  }}
                  className={`py-2 text-xs font-bold rounded-lg cursor-pointer transition-all duration-200 ease-expo active:scale-[0.98] flex items-center justify-center gap-1.5 ${
                    metodoPago === 'efectivo'
                      ? 'bg-surface text-ink shadow-card border border-edge'
                      : 'text-ink-secondary hover:text-ink'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Efectivo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMetodoPago('billetera_digital');
                    setMontoPago(total.toFixed(2));
                    setCambio(0);
                  }}
                  className={`py-2 text-xs font-bold rounded-lg cursor-pointer transition-all duration-200 ease-expo active:scale-[0.98] flex items-center justify-center gap-1.5 ${
                    metodoPago === 'billetera_digital'
                      ? 'bg-surface text-ink shadow-card border border-edge'
                      : 'text-ink-secondary hover:text-ink'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Billetera
                </button>
              </div>
            </div>

            {/* Renderizar según método de pago */}
            {metodoPago === 'efectivo' ? (
              <div className="flex flex-col gap-3 mt-3 transition-all duration-200 ease-expo">
                {/* Input de Efectivo del Cliente */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-ink-tertiary uppercase tracking-wider">
                      Efectivo Recibido (Paga con):
                    </label>
                    <kbd className="px-1.5 py-0.5 bg-inset border border-edge rounded font-mono text-[8px] text-ink-tertiary shadow-card">F9</kbd>
                  </div>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 font-mono font-bold text-ink-tertiary text-lg">S/</span>
                    <input
                      name="monto-pago"
                      type="number"
                      value={montoPago}
                      onChange={(e) => setMontoPago(e.target.value)}
                      placeholder="0.00"
                      className="
                        w-full rounded-xl border border-edge bg-inset py-3.5 pl-10 pr-4 font-mono text-lg font-bold text-ink
                        outline-none focus:border-brand focus:bg-surface focus:ring-4 focus:ring-brand/10 transition-all duration-200 ease-expo shadow-card
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
                      className="py-2 px-1 bg-brand-subtle hover:bg-brand-subtle/80 text-[10px] font-black text-brand-text border border-brand/20 rounded-xl transition-all duration-200 ease-expo cursor-pointer text-center shadow-card active:scale-[0.95]"
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
                        className="py-2 px-1 bg-inset hover:bg-surface text-[10px] font-mono font-black text-ink border border-edge rounded-xl transition-all duration-200 ease-expo cursor-pointer text-center shadow-card active:scale-[0.95]"
                      >
                        S/ {bill}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Vuelto a Entregar */}
                {parseFloat(montoPago) > 0 && (
                  <div className="rounded-xl bg-brand-subtle border border-brand/20 p-3 flex justify-between items-center shadow-card transition-all duration-200 ease-expo">
                    <span className="text-[10px] font-bold text-brand-text uppercase tracking-wider">Vuelto a entregar:</span>
                    <span className="text-xl font-black font-mono text-brand">
                      S/ {cambio.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 p-3.5 bg-inset border border-edge rounded-xl mt-3 transition-all duration-200 ease-expo">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-ink-secondary uppercase tracking-wider">
                    Destino:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setNombreNuevaCuenta('');
                      setSaldoInicialNuevaCuenta('0');
                      setShowNuevaCuentaModal(true);
                    }}
                    className="text-[9px] font-black text-brand-text hover:brightness-105 cursor-pointer flex items-center bg-brand-subtle px-2 py-1 rounded-lg border border-brand/20 transition-all duration-200 active:scale-[0.95]"
                  >
                    <span>+ Nueva Cuenta</span>
                  </button>
                </div>
                
                <select
                  value={cuentaDigitalSeleccionadaId}
                  onChange={(e) => setCuentaDigitalSeleccionadaId(e.target.value)}
                  className="w-full rounded-xl border border-edge bg-surface py-2.5 px-3 text-xs font-bold text-ink focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 cursor-pointer transition-all duration-200"
                >
                  {cuentasBilletera.map((cta) => (
                    <option key={cta.id} value={cta.id}>
                      {cta.nombre} (Saldo: S/ {cta.saldo.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>
            )}

            
          </div>
        </div>

        {/* Botón de Confirmación Principal */}
        <div className="flex flex-col gap-1.5 mt-2">
          <button
              onClick={handleProcessCheckout}
              disabled={isProcessing || items.length === 0}
              className={`
                w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-200 ease-expo cursor-pointer active:scale-[0.98]
                ${isProcessing || items.length === 0
                  ? 'bg-inset text-ink-tertiary cursor-not-allowed border border-edge'
                  : 'bg-brand hover:bg-brand-hover text-ink-inverted shadow-panel'
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-[420px] rounded-2xl border border-edge bg-surface p-7 shadow-modal animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-black text-ink mb-1.5 tracking-tight">Apertura de Caja Obligatoria</h2>
            <p className="text-xs text-ink-secondary mb-5 leading-relaxed">
              No hay una caja activa abierta. Ingresá el monto de sencillo inicial en soles para habilitar las ventas de hoy. Las billeteras digitales iniciarán estrictamente en cero.
            </p>

            <div className="flex flex-col gap-1.5 mb-5">
              <label className="text-[10px] font-black text-ink-tertiary uppercase tracking-wider">Monto Inicial Sencillo:</label>
              <div className="relative flex items-center">
                <span className="absolute left-4 font-mono font-bold text-ink-tertiary text-lg">S/</span>
                <input
                  type="number"
                  value={montoAperturaInput}
                  onChange={(e) => setMontoAperturaInput(e.target.value)}
                  className="w-full rounded-xl border border-edge bg-inset py-3.5 pl-10 pr-4 font-mono text-lg font-bold text-ink focus:outline-none focus:border-brand focus:bg-surface focus:ring-4 focus:ring-brand/10 transition-all duration-200 ease-expo"
                />
              </div>
            </div>

            <button
              onClick={handleAbrirCaja}
              className="w-full bg-brand hover:bg-brand-hover py-3.5 rounded-xl font-black text-ink-inverted text-xs uppercase tracking-wider transition-all duration-200 ease-expo cursor-pointer active:scale-[0.98] shadow-panel"
            >
              Abrir Caja y Habilitar Ventas
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
         MODAL INTERACTIVO: CIERRE DE CAJA DIARIA (ARQUEO FISICO)
         ========================================================================= */}
      {showCierreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-[440px] rounded-2xl border border-edge bg-surface p-6.5 shadow-modal animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-1.5">
              <h2 className="text-lg font-black text-ink tracking-tight">Cierre y Arqueo de Caja Diaria</h2>
              <span className="text-[9px] bg-brand-subtle text-brand-text border border-brand/20 px-2.5 py-0.5 rounded-full font-black uppercase">Auditoría</span>
            </div>
            <p className="text-xs text-ink-secondary mb-4 leading-relaxed font-semibold">
              Declaración del arqueo físico de billetes y monedas en la gaveta. Se contrastará con los movimientos computados por la terminal.
            </p>

            <div className="flex flex-col gap-3.5 mb-5">
              {/* Saldo Esperado Computado */}
              <div className="p-3.5 bg-inset rounded-xl border border-edge flex justify-between items-center">
                <span className="text-xs font-bold text-ink-secondary">Saldo Físico Esperado:</span>
                <span className="text-lg font-black font-mono text-ink">S/ {efectivoCajaFisica.toFixed(2)}</span>
              </div>

              {/* Input Declaración Física */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-ink-secondary uppercase tracking-wider">Efectivo Físico Real Declarado (Caja):</label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 font-mono font-bold text-ink-tertiary text-lg">S/</span>
                  <input
                    type="number"
                    value={efectivoDeclaradoInput}
                    onChange={(e) => setEfectivoDeclaradoInput(e.target.value)}
                    className="w-full rounded-xl border border-edge bg-inset py-3.5 pl-10 pr-4 font-mono text-lg font-bold text-ink focus:outline-none focus:border-brand focus:bg-surface focus:ring-4 focus:ring-brand/10 transition-all duration-200 ease-expo"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Desviaciones Reactivas en Caliente */}
              {efectivoDeclaradoInput !== '' && (
                (() => {
                  const dif = (parseFloat(efectivoDeclaradoInput) || 0) - efectivoCajaFisica;
                  return (
                    <div className={`p-3.5 rounded-xl border flex justify-between items-center shadow-card transition-all duration-200 ease-expo ${
                      Math.abs(dif) < 0.01 
                        ? 'bg-brand-subtle border-brand/20 text-brand-text' 
                        : dif > 0 
                          ? 'bg-caution-subtle border-caution/20 text-caution-text' 
                          : 'bg-negative-subtle border-negative/20 text-negative-text'
                    }`}>
                      <span className="text-xs font-black uppercase">
                        {Math.abs(dif) < 0.01 
                          ? 'Caja Perfectamente Cuadrada' 
                          : dif > 0 
                            ? 'Sobrante de Caja' 
                            : 'Discrepancia / Faltante'}
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
                className="w-1/2 bg-inset hover:bg-surface border border-edge py-3.5 rounded-xl font-black text-ink-secondary text-xs uppercase tracking-wider transition-colors duration-200 cursor-pointer text-center active:scale-[0.98]"
              >
                Volver
              </button>
              
              <button
                type="button"
                onClick={handleConfirmarCierre}
                className="w-1/2 bg-ink hover:bg-ink/90 py-3.5 rounded-xl font-black text-ink-inverted text-xs uppercase tracking-wider transition-all duration-200 ease-expo cursor-pointer shadow-panel flex items-center justify-center gap-1.5 active:scale-[0.98]"
              >
                <svg className="w-3.5 h-3.5 text-ink-inverted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Confirmar y Cerrar Caja
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
         MODAL INTERACTIVO: REPORTE DE AUDITORÍA DE CIERRE DE CAJA
         ========================================================================= */}
      {showCierreReport && cierreReportData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-[450px] rounded-2xl border border-edge bg-surface p-6 shadow-modal animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-base font-black text-ink uppercase tracking-tight flex items-center gap-1.5">
                <svg className="w-4 h-4 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Reporte Auditoría de Cierre</span>
              </h2>
              <span className="text-[9px] bg-ink text-brand border border-edge-strong px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                EMITIDO
              </span>
            </div>

            <div className="flex-1 overflow-y-auto bg-inset border border-edge p-4.5 rounded-xl font-mono text-xs flex flex-col gap-3 text-ink-secondary shadow-inner scrollbar-thin">
              <div className="text-center font-black text-ink border-b border-dashed border-edge pb-2 mb-1">
                BOOM POS - CIERRE DIARIO
                <div className="text-[10px] text-ink-tertiary font-bold uppercase mt-1">EMPORIO Y MULTICANALES</div>
              </div>

              <div className="flex justify-between">
                <span>Fecha Apertura:</span>
                <span className="font-bold text-ink">{new Date(cierreReportData.fechaApertura).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Fecha Cierre:</span>
                <span className="font-bold text-ink">{new Date(cierreReportData.fechaCierre).toLocaleString()}</span>
              </div>

              <div className="border-t border-dashed border-edge my-1"></div>

              <div className="flex justify-between">
                <span>Saldo Apertura (Efectivo):</span>
                <span className="font-bold text-ink">S/ {cierreReportData.montoApertura.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Ventas Efectivo (+):</span>
                <span className="font-bold text-ink">S/ {cierreReportData.ventasEfectivo.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-negative">
                <span>Gastos/Egresos Efectivo (-):</span>
                <span className="font-bold">-S/ {cierreReportData.egresosEfectivo.toFixed(2)}</span>
              </div>

              <div className="border-t border-dashed border-edge my-1"></div>

              <div className="flex justify-between bg-surface border border-edge p-1.5 rounded font-black text-ink shadow-card">
                <span>Saldo Efectivo Esperado:</span>
                <span>S/ {cierreReportData.saldoFinalEfectivo.toFixed(2)}</span>
              </div>

              <div className="border-t border-dashed border-edge my-1"></div>

              <div className="font-black text-ink">Saldos Billeteras (Cierre a 0):</div>
              {Object.entries(cierreReportData.saldoFinalBilleteras).map(([id, saldo]: any) => {
                const cta = cuentasBilletera.find(c => c.id === id) || { nombre: id };
                return (
                  <div key={id} className="flex justify-between pl-3 text-ink-secondary">
                    <span>• {cta.nombre}:</span>
                    <span className="font-bold text-brand">S/ {saldo.toFixed(2)}</span>
                  </div>
                );
              })}

              <div className="border-t border-dashed border-edge my-1"></div>

              <div className="flex justify-between font-black text-brand bg-ink p-2 rounded shadow-panel">
                <span>Total Recaudado Neto:</span>
                <span>S/ {cierreReportData.totalNeto.toFixed(2)}</span>
              </div>

              <div className="text-[10px] text-ink-tertiary font-bold uppercase mt-2 text-center">
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
              className="w-full mt-4 bg-ink hover:bg-ink/90 py-3.5 rounded-xl font-black text-ink-inverted text-xs uppercase tracking-wider transition-all duration-200 ease-expo cursor-pointer active:scale-[0.98] shadow-panel"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-[380px] max-h-[85vh] rounded-2xl border border-edge bg-surface p-5 shadow-modal animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-base font-extrabold text-ink flex items-center gap-1.5">
                <svg className="w-4 h-4 text-positive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Venta Exitosa
              </h2>
              <span className="text-[9px] bg-brand-subtle text-brand-text border border-brand/20 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                IMPRESO 58MM
              </span>
            </div>

            <pre className="
              flex-1 rounded-xl bg-inset text-ink p-4 font-mono text-[10px] overflow-y-auto shadow-inner leading-normal
              border-t-8 border-b-8 border-dashed border-edge scrollbar-thin
            ">
              {generatedTicket}
            </pre>

            <button
              onClick={() => {
                setShowTicketModal(false);
                setGeneratedTicket('');
              }}
              className="w-full mt-4 bg-ink hover:bg-ink/90 py-3.5 rounded-xl font-bold text-ink-inverted text-xs uppercase tracking-wider transition-all duration-200 ease-expo cursor-pointer active:scale-[0.98] shadow-panel"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-[400px] rounded-2xl border border-edge bg-surface p-6 shadow-modal animate-in zoom-in-95 duration-200">
            <h2 className="text-lg font-black text-ink mb-1.5 tracking-tight">Agregar Cuenta / Billetera Digital</h2>
            <p className="text-xs text-ink-secondary mb-4 leading-relaxed font-semibold">
              Registrá una nueva cuenta en vivo. Esto te permite separar saldos por banco o pasarela de cobro.
            </p>

            <div className="flex flex-col gap-4 mb-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-ink-tertiary uppercase tracking-wider">Nombre del canal/banco:</label>
                <input
                  type="text"
                  value={nombreNuevaCuenta}
                  onChange={(e) => setNombreNuevaCuenta(e.target.value)}
                  placeholder="Ej. Yape - Interbank, Plin - Scotiabank"
                  className="w-full rounded-lg border border-edge bg-inset py-3 px-3.5 text-xs font-bold text-ink focus:outline-none focus:border-brand focus:bg-surface focus:ring-4 focus:ring-brand/5 transition-all duration-200 ease-expo"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-ink-tertiary uppercase tracking-wider">Saldo Inicial (S/):</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 font-mono font-bold text-ink-tertiary text-xs">S/</span>
                  <input
                    type="number"
                    value={saldoInicialNuevaCuenta}
                    onChange={(e) => setSaldoInicialNuevaCuenta(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-lg border border-edge bg-inset py-3 pl-8 pr-3.5 font-mono text-xs font-bold text-ink focus:outline-none focus:border-brand focus:bg-surface focus:ring-4 focus:ring-brand/5 transition-all duration-200 ease-expo"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowNuevaCuentaModal(false)}
                className="w-1/2 bg-inset hover:bg-surface border border-edge py-3 rounded-lg font-black text-ink-secondary text-xs uppercase tracking-wider transition-colors duration-200 cursor-pointer text-center active:scale-[0.98]"
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
                className="w-1/2 bg-brand hover:bg-brand-hover py-3 rounded-lg font-black text-ink-inverted text-xs uppercase tracking-wider transition-all duration-200 ease-expo cursor-pointer active:scale-[0.98] shadow-card"
              >
                Guardar Cuenta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
         MODAL INTERACTIVO: ARQUEO DE CAJA DIARIA EN VIVO (FLOAT TRIGGER)
         ========================================================================= */}
      {showArqueoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-[450px] max-h-[85vh] rounded-2xl border border-edge bg-surface p-6 shadow-modal animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-base font-black text-ink uppercase tracking-tight flex items-center gap-1.5">
                <svg className="w-4 h-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Arqueo Financiero en Vivo</span>
              </h2>
              <span className="text-[9px] bg-brand-subtle text-brand-text border border-brand/20 px-2.5 py-0.5 rounded-full font-black uppercase">
                Tiempo Real
              </span>
            </div>

            <p className="text-xs text-ink-secondary mb-4 leading-relaxed font-medium">
              Movimientos financieros consolidados para la jornada contable activa de hoy.
            </p>

            <div className="flex-1 overflow-y-auto flex flex-col gap-3.5 mb-5 pr-1 scrollbar-thin">
              {/* Saldo Efectivo Computado */}
              <div className="p-4 bg-inset rounded-xl border border-edge flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-black text-ink-tertiary uppercase block">Caja Física (Efectivo)</span>
                  <span className="text-xs text-ink-secondary mt-0.5 block">Saldo en gaveta físico esperado</span>
                </div>
                <span className="text-2xl font-black font-mono text-brand">S/ {efectivoCajaFisica.toFixed(2)}</span>
              </div>

              {/* Desglose de Movimientos */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black text-ink-tertiary uppercase tracking-wider">Historial de Flujos del Día</span>
                <div className="border border-edge rounded-xl divide-y divide-edge bg-inset max-h-[200px] overflow-y-auto scrollbar-thin">
                  {mockMovimientos.filter(m => m.caja_id === cajaActivaId).length === 0 ? (
                    <div className="p-4 text-center text-xs text-ink-tertiary font-bold uppercase">Sin movimientos registrados</div>
                  ) : (
                    mockMovimientos
                      .filter(m => m.caja_id === cajaActivaId)
                      .map((mov) => (
                        <div key={mov.id} className="p-2.5 flex justify-between items-center text-xs">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-ink uppercase text-[10px]">{mov.tipo}</span>
                            <span className="text-ink-tertiary text-[9px] font-mono">{new Date(mov.fecha).toLocaleTimeString()}</span>
                          </div>
                          <span className={`font-mono font-bold ${
                            mov.tipo === 'apertura' || mov.tipo === 'ingreso'
                              ? 'text-positive'
                              : 'text-negative'
                          }`}>
                            {mov.tipo === 'apertura' || mov.tipo === 'ingreso' ? '+' : '-'}S/ {mov.monto.toFixed(2)}
                          </span>
                        </div>
                      ))
                  )}
                </div>
              </div>

              {/* Billeteras Digitales */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black text-ink-tertiary uppercase tracking-wider">Billeteras Digitales Activas</span>
                <div className="grid grid-cols-2 gap-2">
                  {cuentasBilletera.map((cta) => (
                    <div key={cta.id} className="p-3 bg-inset rounded-xl border border-edge flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-ink-secondary uppercase truncate">{cta.nombre}</span>
                      <span className="text-lg font-black font-mono text-brand">S/ {cta.saldo.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowArqueoModal(false)}
              className="w-full bg-ink hover:bg-ink/90 text-ink-inverted py-3.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-200 ease-expo active:scale-[0.98] shadow-panel"
            >
              Cerrar Vista de Arqueo
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default CashRegister;
