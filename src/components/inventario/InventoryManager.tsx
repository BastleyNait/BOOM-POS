'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCartStore, MockProduct, MockProveedor, MockPedido, CierreDiario } from '../../store/useCartStore';
import { useToastStore } from '../../store/useToastStore';
import { useConfirmStore } from '../../store/useConfirmStore';

const VEGETALES_SUGERIDOS = [
  'Choclo', 'Limón', 'Cebolla Grande', 'Cebolla Pequeña', 'Rocoto', 'Ají Amarillo', 'Lechuga', 'Alverja',
  'Beterraga', 'Kion', 'Pimiento Chico', 'Pimiento Grande', 'Ají Colorado Molido', 'Ajo Molido',
  'Maracuyá', 'Palta', 'Piña', 'Zanahoria', 'Zukini', 'Brócoli', 'Habas', 'Manzana', 'Papaya',
  'Pollo Fresco', 'Carne de Res', 'Carne de Chancho', 'Milanesa'
];

export function InventoryManager() {
  const { addToast } = useToastStore();
  const { requestConfirm } = useConfirmStore();
  const frescoCantidadInputRef = useRef<HTMLInputElement | null>(null);
  
  // Pestaña Activa derivada de los parámetros de búsqueda de la URL
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') || 'productos';
  const activeTab = ['productos', 'compras', 'proveedores', 'cierres', 'mercado'].includes(tabParam)
    ? (tabParam as 'productos' | 'compras' | 'proveedores' | 'cierres' | 'mercado')
    : 'productos';

  // Zustand Store
  const {
    mockProducts,
    mockPedidos,
    mockProveedores,
    cuentasBilletera,
    addMockProduct,
    updateMockProduct,
    generateMockSugerencias,
    completeMockPedido,
    pagarPedidoProveedor,
    agregarMockProveedor,
    eliminarMockProveedor,
    actualizarMockProveedor,
    cajaActivaId,
    mockMovimientos,
    historialCierres,
    faltantesFrescos,
    agregarFaltanteFresco,
    toggleFaltanteFresco,
    eliminarFaltanteFresco,
    limpiarFaltantesFrescos,
    agregarMockPedido
  } = useCartStore();

  // ----------------------------------------------------
  // ESTADOS FORMULARIO PRODUCTO (Pestaña 1)
  // ----------------------------------------------------
  const [formId, setFormId] = useState<string | undefined>(undefined);
  const [nombre, setNombre] = useState('');
  const [codigo, setCodigo] = useState('');
  const [precioCosto, setPrecioCosto] = useState('');
  const [precioVenta, setPrecioVenta] = useState('');
  const [margenGanancia, setMargenGanancia] = useState('30');
  const [stock, setStock] = useState('');
  const [proveedorId, setProveedorId] = useState('');

  // ----------------------------------------------------
  // ESTADOS CONTROL DUPLICADOS
  // ----------------------------------------------------
  const [duplicadoDetectado, setDuplicadoDetectado] = useState<{
    existe: boolean;
    tipo: 'nombre' | 'codigo' | null;
    producto?: MockProduct;
  }>({ existe: false, tipo: null });
  const [stockAConsolidar, setStockAConsolidar] = useState('');

  // ----------------------------------------------------
  // ESTADOS FORMULARIO PROVEEDOR (Pestaña 3)
  // ----------------------------------------------------
  const [editingProvId, setEditingProvId] = useState<string | null>(null);
  const [provNombre, setProvNombre] = useState('');
  const [provRuc, setProvRuc] = useState('');
  const [provTelefono, setProvTelefono] = useState('');
  const [provDiaVisita, setProvDiaVisita] = useState('Lunes');

  // ----------------------------------------------------
  // ESTADOS LIQUIDACIÓN DE CUENTAS POR PAGAR (Pestaña 2)
  // ----------------------------------------------------
  const [pedidoAPagar, setPedidoAPagar] = useState<MockPedido | null>(null);
  const [metodoPagoDeuda, setMetodoPagoDeuda] = useState<'efectivo' | 'billetera_digital'>('efectivo');
  const [cuentaPagoId, setCuentaPagoId] = useState('');
  
  // ESTADO MODAL AUDITORIA
  const [selectedAuditCierre, setSelectedAuditCierre] = useState<CierreDiario | null>(null);

  // ----------------------------------------------------
  // ESTADOS MÓDULO FALTANTES DE FRESCOS
  // ----------------------------------------------------
  const [frescoNombre, setFrescoNombre] = useState('');
  const [frescoCantidad, setFrescoCantidad] = useState('');
  const [frescoNotas, setFrescoNotas] = useState('');
  const [timeRemaining, setTimeRemaining] = useState('');
  const [sugerenciasFiltradas, setSugerenciasFiltradas] = useState<string[]>([]);

  // ----------------------------------------------------
  // ESTADOS CREACIÓN PEDIDO MANUAL
  // ----------------------------------------------------
  const [showPedidoManualModal, setShowPedidoManualModal] = useState(false);
  const [nuevoPedidoProveedorId, setNuevoPedidoProveedorId] = useState('');
  const [nuevoPedidoRepartidor, setNuevoPedidoRepartidor] = useState('');
  const [nuevoPedidoFechaSolicitud, setNuevoPedidoFechaSolicitud] = useState(new Date().toISOString().split('T')[0]);
  const [nuevoPedidoFechaPagoDescarga, setNuevoPedidoFechaPagoDescarga] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [nuevoPedidoProductos, setNuevoPedidoProductos] = useState<{ id: string; nombre: string; cantidad_sugerida: number; precio_costo: number }[]>([]);
  // Campos para agregar producto al pedido manual actual
  const [pedManProdId, setPedManProdId] = useState('');
  const [pedManCant, setPedManCant] = useState('');
  const [pedManCosto, setPedManCosto] = useState('');

  // ----------------------------------------------------
  // EFECTO: CUENTA REGRESIVA 9:00 PM
  // ----------------------------------------------------
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      let target = new Date();
      target.setHours(21, 0, 0, 0); // 9:00 PM
      
      if (now.getTime() > target.getTime()) {
        target.setDate(target.getDate() + 1);
      }
      
      const diffMs = target.getTime() - now.getTime();
      const hours = Math.floor(diffMs / 3600000);
      const minutes = Math.floor((diffMs % 3600000) / 60000);
      const seconds = Math.floor((diffMs % 60000) / 1000);
      
      const pad = (n: number) => String(n).padStart(2, '0');
      setTimeRemaining(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // ----------------------------------------------------
  // MANEJADOR: SIMULADOR DE RECORDATORIO DE FALTANTES
  // ----------------------------------------------------
  const handleSimularRecordatorio = () => {
    addToast('🔔 Recordatorio de Faltantes (9:00 PM): Es hora de compilar y revisar la lista de verduras, frutas y frescos para mañana.', 'warning');

    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('🔔 Recordatorio de Faltantes - BOOM POS', {
          body: 'Es hora de hacer la lista de verduras y frutas frescas que se comprarán en el mercado para mañana.',
          icon: '/file.svg',
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            new Notification('🔔 Recordatorio de Faltantes - BOOM POS', {
              body: 'Es hora de hacer la lista de verduras y frutas frescas que se comprarán en el mercado para mañana.',
              icon: '/file.svg',
            });
          }
        });
      }
    }
  };

  // ----------------------------------------------------
  // MANEJADORES: AUTOCOMPLETADO Y ACCESOS FALTANTES
  // ----------------------------------------------------
  const handleFrescoNombreChange = (val: string) => {
    setFrescoNombre(val);
    if (val.trim().length > 0) {
      const filtered = VEGETALES_SUGERIDOS.filter(item =>
        item.toLowerCase().includes(val.toLowerCase()) && item.toLowerCase() !== val.toLowerCase()
      );
      setSugerenciasFiltradas(filtered.slice(0, 5));
    } else {
      setSugerenciasFiltradas([]);
    }
  };

  const handleSelectSugerencia = (sug: string) => {
    setFrescoNombre(sug);
    setSugerenciasFiltradas([]);
    setTimeout(() => frescoCantidadInputRef.current?.focus(), 50);
  };

  const handleQuickFrescoTap = (item: string) => {
    const existe = (faltantesFrescos || []).some(f => f.nombre.toLowerCase() === item.toLowerCase() && !f.comprado);
    if (existe) {
      addToast(`'${item}' ya se encuentra como faltante activo en la lista.`, 'info');
      return;
    }
    
    agregarFaltanteFresco({
      nombre: item,
      cantidad: 'No especificada',
      notas: 'Agregado por Acceso Rápido'
    });
    
    addToast(`'${item}' agregado al instante.`, 'success');
  };

  // ----------------------------------------------------
  // MANEJADORES: PEDIDO MANUAL
  // ----------------------------------------------------
  const handleAddProductToManualPedido = () => {
    if (!pedManProdId) {
      addToast('Por favor, selecciona un producto.', 'error');
      return;
    }
    const prod = mockProducts.find(p => p.id === pedManProdId);
    if (!prod) return;

    const cant = parseFloat(pedManCant) || 1;
    const costo = parseFloat(pedManCosto) || prod.precio_costo;

    const existeIdx = nuevoPedidoProductos.findIndex(p => p.id === prod.id);
    if (existeIdx > -1) {
      const updated = [...nuevoPedidoProductos];
      updated[existeIdx].cantidad_sugerida += cant;
      updated[existeIdx].precio_costo = costo;
      setNuevoPedidoProductos(updated);
    } else {
      setNuevoPedidoProductos([
        ...nuevoPedidoProductos,
        {
          id: prod.id,
          nombre: prod.nombre,
          cantidad_sugerida: cant,
          precio_costo: costo
        }
      ]);
    }

    setPedManProdId('');
    setPedManCant('');
    setPedManCosto('');
    addToast('Producto agregado al pedido manual.', 'success');
  };

  const handleGuardarPedidoManual = () => {
    if (!nuevoPedidoProveedorId) {
      addToast('Debe seleccionar un proveedor.', 'error');
      return;
    }
    if (nuevoPedidoProductos.length === 0) {
      addToast('Debe agregar al menos un producto al pedido.', 'error');
      return;
    }

    const prov = mockProveedores.find(p => p.id === nuevoPedidoProveedorId);
    const provNombre = prov ? prov.nombre : 'Proveedor Desconocido';

    const total = nuevoPedidoProductos.reduce((sum, item) => sum + (item.cantidad_sugerida * item.precio_costo), 0);

    agregarMockPedido({
      proveedor_id: nuevoPedidoProveedorId,
      proveedor_nombre: provNombre,
      repartidor: nuevoPedidoRepartidor.trim() || 'Por asignar',
      fecha_solicitud: nuevoPedidoFechaSolicitud,
      fecha_pago_descarga: nuevoPedidoFechaPagoDescarga,
      monto_total: total,
      fecha: nuevoPedidoFechaSolicitud,
      productos: nuevoPedidoProductos
    });

    addToast('Pedido manual registrado con éxito.', 'success');
    
    setShowPedidoManualModal(false);
    setNuevoPedidoProveedorId('');
    setNuevoPedidoRepartidor('');
    setNuevoPedidoFechaSolicitud(new Date().toISOString().split('T')[0]);
    setNuevoPedidoFechaPagoDescarga(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
    setNuevoPedidoProductos([]);
  };

  // Sincronizar el primer id de cuenta digital para el pago de deudas
  useEffect(() => {
    if (cuentasBilletera.length > 0 && !cuentaPagoId) {
      setCuentaPagoId(cuentasBilletera[0].id);
    }
  }, [cuentasBilletera, cuentaPagoId]);

  // Autocompletar costo unitario al elegir producto para el pedido manual
  useEffect(() => {
    if (pedManProdId) {
      const prod = mockProducts.find(p => p.id === pedManProdId);
      if (prod) {
        setPedManCosto(prod.precio_costo.toString());
      }
    } else {
      setPedManCosto('');
    }
  }, [pedManProdId, mockProducts]);

  // ----------------------------------------------------
  // DETECTOR DE DUPLICADOS EN CALIENTE
  // ----------------------------------------------------
  useEffect(() => {
    if (!nombre.trim() && !codigo.trim()) {
      setDuplicadoDetectado({ existe: false, tipo: null });
      return;
    }

    const dupCod = mockProducts.find(
      p => codigo.trim() && p.codigo.trim() === codigo.trim() && p.id !== formId
    );
    if (dupCod) {
      setDuplicadoDetectado({ existe: true, tipo: 'codigo', producto: dupCod });
      return;
    }

    const dupNom = mockProducts.find(
      p => nombre.trim() && p.nombre.toLowerCase().trim() === nombre.toLowerCase().trim() && p.id !== formId
    );
    if (dupNom) {
      setDuplicadoDetectado({ existe: true, tipo: 'nombre', producto: dupNom });
      return;
    }

    setDuplicadoDetectado({ existe: false, tipo: null });
  }, [nombre, codigo, formId, mockProducts]);

  // ----------------------------------------------------
  // MATEMÁTICA INTERACTIVA DEL MARGEN DE GANANCIA
  // ----------------------------------------------------
  const handleCostoChange = (val: string) => {
    setPrecioCosto(val);
    const costoNum = parseFloat(val) || 0;
    const margenNum = parseFloat(margenGanancia) || 0;
    if (costoNum > 0) {
      const ventaCalculada = costoNum * (1 + margenNum / 100);
      setPrecioVenta(ventaCalculada.toFixed(2));
    } else {
      setPrecioVenta('');
    }
  };

  const handleMargenChange = (val: string) => {
    setMargenGanancia(val);
    const costoNum = parseFloat(precioCosto) || 0;
    const margenNum = parseFloat(val) || 0;
    if (costoNum > 0) {
      const ventaCalculada = costoNum * (1 + margenNum / 100);
      setPrecioVenta(ventaCalculada.toFixed(2));
    }
  };

  const handleVentaChange = (val: string) => {
    setPrecioVenta(val);
    const costoNum = parseFloat(precioCosto) || 0;
    const ventaNum = parseFloat(val) || 0;
    if (costoNum > 0 && ventaNum >= costoNum) {
      const margenCalculado = ((ventaNum / costoNum) - 1) * 100;
      setMargenGanancia(margenCalculado.toFixed(1));
    } else if (costoNum > 0) {
      setMargenGanancia('0');
    }
  };

  // ----------------------------------------------------
  // ACCIONES PRODUCTO
  // ----------------------------------------------------
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();

    if (duplicadoDetectado.existe) {
      addToast('Ya existe un producto con ese RUC/Código/Nombre.', 'warning');
      return;
    }

    const prodCostoVal = parseFloat(precioCosto) || 0;
    let prodVentaVal = parseFloat(precioVenta) || 0;
    if (prodVentaVal <= 0) {
      prodVentaVal = Math.round(prodCostoVal * 1.3);
    }

    const payload = {
      id: formId,
      nombre,
      codigo,
      precio_costo: prodCostoVal,
      precio_venta: prodVentaVal,
      stock: parseInt(stock) || 0,
      proveedor_id: proveedorId || null,
      margen_ganancia: parseFloat(margenGanancia) || 30
    };

    let res;
    if (formId) {
      res = updateMockProduct(payload as MockProduct);
    } else {
      res = addMockProduct(payload);
    }

    if (res.success) {
      handleResetForm();
    } else {
      addToast(`Error al guardar: ${res.error}`, 'error');
    }
  };

  const handleResetForm = () => {
    setFormId(undefined);
    setNombre('');
    setCodigo('');
    setPrecioCosto('');
    setPrecioVenta('');
    setMargenGanancia('30');
    setStock('');
    setProveedorId('');
    setDuplicadoDetectado({ existe: false, tipo: null });
  };

  const handleEditProductClick = (prod: MockProduct) => {
    setFormId(prod.id);
    setNombre(prod.nombre);
    setCodigo(prod.codigo);
    setPrecioCosto(prod.precio_costo.toString());
    setPrecioVenta(prod.precio_venta.toString());
    setStock(prod.stock.toString());
    setProveedorId(prod.proveedor_id || '');
    
    if (prod.precio_costo > 0) {
      const margen = ((prod.precio_venta / prod.precio_costo) - 1) * 100;
      setMargenGanancia(margen.toFixed(1));
    } else {
      setMargenGanancia(prod.margen_ganancia?.toString() || '30');
    }
  };

  const handleAdoptarProductoExistente = (prod: MockProduct) => {
    handleEditProductClick(prod);
    setDuplicadoDetectado({ existe: false, tipo: null });
  };

  const handleConsolidarStock = () => {
    if (!duplicadoDetectado.producto) return;
    const prod = duplicadoDetectado.producto;
    const adicional = parseInt(stockAConsolidar) || 0;
    if (adicional <= 0) {
      addToast('Ingrese una cantidad válida de stock mayor a cero.', 'warning');
      return;
    }

    const actualizado: MockProduct = {
      ...prod,
      stock: prod.stock + adicional
    };

    const res = updateMockProduct(actualizado);
    if (res.success) {
      addToast(`Se consolidaron ${adicional} unidades al producto '${prod.nombre}'. Nuevo stock: ${actualizado.stock}.`, 'success');
      handleResetForm();
      setStockAConsolidar('');
    } else {
      addToast(`Error al consolidar el stock: ${res.error}`, 'error');
    }
  };

  // ----------------------------------------------------
  // ACCIONES PROVEEDORES CRUD (Pestaña 3)
  // ----------------------------------------------------
  const handleSaveProveedor = (e: React.FormEvent) => {
    e.preventDefault();

    if (!provNombre.trim() || !provRuc.trim()) {
      addToast('Por favor, complete el Nombre y RUC del proveedor.', 'warning');
      return;
    }

    // Validación básica de RUC peruano (11 dígitos)
    if (!/^\d{11}$/.test(provRuc)) {
      addToast('El RUC debe contener exactamente 11 dígitos numéricos.', 'error');
      return;
    }

    const payload: MockProveedor = {
      id: editingProvId || '',
      nombre: provNombre,
      ruc: provRuc,
      telefono: provTelefono,
      dia_visita: provDiaVisita
    };

    if (editingProvId) {
      actualizarMockProveedor(payload);
      setEditingProvId(null);
    } else {
      agregarMockProveedor(payload);
    }

    setProvNombre('');
    setProvRuc('');
    setProvTelefono('');
    setProvDiaVisita('Lunes');
  };

  const handleEditProveedorClick = (prov: MockProveedor) => {
    setEditingProvId(prov.id);
    setProvNombre(prov.nombre);
    setProvRuc(prov.ruc);
    setProvTelefono(prov.telefono);
    setProvDiaVisita(prov.dia_visita);
  };

  const handleCancelEditProveedor = () => {
    setEditingProvId(null);
    setProvNombre('');
    setProvRuc('');
    setProvTelefono('');
    setProvDiaVisita('Lunes');
  };

  // ----------------------------------------------------
  // ACCIONES CUENTAS POR PAGAR (Pestaña 2)
  // ----------------------------------------------------
  const handleConfirmarPagoDeuda = () => {
    if (!pedidoAPagar) return;

    if (metodoPagoDeuda === 'billetera_digital' && !cuentaPagoId) {
      addToast('Seleccione una billetera digital para realizar el débito.', 'warning');
      return;
    }

    const res = pagarPedidoProveedor(pedidoAPagar.id, metodoPagoDeuda, cuentaPagoId);
    if (res.success) {
      const ctaObj = cuentasBilletera.find(c => c.id === cuentaPagoId);
      const ctaNombre = ctaObj ? ctaObj.nombre : 'Billetera Digital';
      addToast(`Deuda pagada exitosamente. Canal: ${metodoPagoDeuda === 'efectivo' ? 'Efectivo en Caja' : ctaNombre}. Monto: S/ ${pedidoAPagar.monto_total.toFixed(2)}.`, 'success');
      setPedidoAPagar(null);
    } else {
      addToast(`Error al saldar la deuda: ${res.error}`, 'error');
    }
  };

  // Arqueo en vivo de Caja Física en Soles (reactivo)
  const efectivoCajaFisica = mockMovimientos
    .filter(m => m.caja_id === cajaActivaId && m.metodo_pago === 'efectivo')
    .reduce((sum, m) => {
      if (m.tipo === 'apertura' || m.tipo === 'ingreso') return sum + m.monto;
      if (m.tipo === 'egreso' || m.tipo === 'cierre') return sum - m.monto;
      return sum;
    }, 0);

  // Calcular deudas pendientes con proveedores
  const deudasPendientes = mockPedidos
    .filter(p => p.estado === 'completado' && p.estado_pago === 'pendiente_de_pago')
    .reduce((sum, p) => sum + p.monto_total, 0);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 p-6 gap-3 font-sans antialiased overflow-hidden">
      
      {/* Columna Izquierda: Panel de Trabajo e Indicadores Financieros */}
      <div className="flex flex-1 flex-col gap-2 overflow-hidden">
        
        {/* Encabezado Principal */}
        <header className="flex w-full items-center justify-between border-b border-slate-200/80 pb-4 flex-shrink-0">
          <div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent tracking-tight leading-none">
              Panel ERP & Inventario
            </h1>
            <p className="text-[10px] text-slate-400 font-extrabold tracking-widest uppercase mt-1.5">
              Control Integral de Caja, Compras e Inventarios
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-black rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-sm border border-slate-900 cursor-pointer animate-in fade-in duration-300"
            >
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              IR A CAJA / POS
            </Link>
          </div>
        </header>

        {/* -------------------------------------------------------------------------
            CONTENIDO PESTAÑA: STOCK E INVENTARIO
            ------------------------------------------------------------------------- */}        {activeTab === 'productos' && (
          <div className="flex-1 overflow-hidden bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm flex flex-col">
            <h2 className="text-sm font-bold text-slate-700 mb-4 flex justify-between items-center">
              <span>Listado de Stock Físico</span>
              <span className="text-xs bg-slate-100 text-slate-600 border border-slate-200/50 px-2.5 py-0.5 rounded-full font-black">
                {mockProducts.length} Productos
              </span>
            </h2>

            <div className="flex-1 overflow-y-auto pr-1">
              {mockProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
                  <svg className="h-10 w-10 mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">No hay productos en el inventario</p>
                  <p className="text-[11px] text-slate-400 mt-1">Registra un nuevo producto en el panel contextual de la derecha.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200/60 shadow-sm bg-white">
                  <table className="w-full border-collapse text-left text-sm text-slate-600">
                    <thead className="bg-slate-50/80">
                      <tr className="border-b border-slate-200/60 text-[10px] font-black uppercase tracking-wider text-slate-500">
                        <th className="p-3">Código</th>
                        <th className="p-3">Producto</th>
                        <th className="p-3 text-right">P. Costo (S/)</th>
                        <th className="p-3 text-right">P. Venta (S/)</th>
                        <th className="p-3 text-right">Margen</th>
                        <th className="p-3 text-center">Stock</th>
                        <th className="p-3">Proveedor</th>
                        <th className="p-3 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/80 font-sans text-xs">
                      {mockProducts.map((product) => {
                        const prov = mockProveedores.find(p => p.id === product.proveedor_id);
                        const tieneBajoStock = product.stock < 5;

                        return (
                          <tr key={product.id} className="hover:bg-orange-50/30 transition-colors">
                            <td className="p-3 font-mono text-[11px] font-bold text-slate-500">{product.codigo}</td>
                            <td className="p-3 font-bold text-slate-800">{product.nombre}</td>
                            <td className="p-3 text-right font-mono text-slate-600 font-semibold">S/ {product.precio_costo.toFixed(2)}</td>
                            <td className="p-3 text-right font-mono text-slate-800 font-black">S/ {product.precio_venta.toFixed(2)}</td>
                            <td className="p-3 text-right">
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/40">
                                {product.margen_ganancia ? product.margen_ganancia.toFixed(1) : '0.0'}%
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black font-mono border ${
                                tieneBajoStock 
                                  ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse' 
                                  : 'bg-slate-100 text-slate-700 border-slate-200/60'
                              }`}>
                                {product.stock} u
                              </span>
                            </td>
                            <td className="p-3 text-xs text-slate-500 font-medium truncate max-w-[150px]" title={prov ? prov.nombre : 'Sin Proveedor'}>
                              {prov ? prov.nombre : <span className="text-slate-400 italic">Sin Proveedor</span>}
                            </td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => handleEditProductClick(product)}
                                className="px-3 py-1.5 text-[9px] rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-black text-slate-600 uppercase tracking-wider transition-all cursor-pointer shadow-sm hover:border-slate-300 active:scale-95"
                              >
                                Editar
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------------------
            CONTENIDO PESTAÑA: COMPRAS Y CUENTAS POR PAGAR (ERP)
            ------------------------------------------------------------------------- */}
        {activeTab === 'compras' && (
          <div className="flex-1 overflow-hidden bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-700">
                Trazabilidad de Compras y Cuentas por Pagar
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowPedidoManualModal(true)}
                  className="px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-800 transition-all shadow-sm cursor-pointer"
                >
                  Registrar Pedido Manual
                </button>
                <button
                  onClick={() => {
                    generateMockSugerencias();
                    addToast('Sugerencias recalculadas según el stock crítico (< 5 unidades).', 'info');
                  }}
                  className="px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-white hover:brightness-105 transition-all shadow-md shadow-orange-600/10 cursor-pointer"
                >
                  Recalcular Pedidos
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 pr-1 align-content-start">
              {mockPedidos.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-16 text-center text-slate-400">
                  <svg className="h-8 w-8 mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  <p className="text-xs font-bold uppercase tracking-wider">No hay pedidos de compras registrados</p>
                  <p className="text-[11px] text-slate-400 mt-1">Hacé clic en 'Recalcular Pedidos' para ver sugerencias automáticas de reposición.</p>
                </div>
              ) : (
                mockPedidos.map((ped) => {
                  const tieneDeuda = ped.estado === 'completado' && ped.estado_pago === 'pendiente_de_pago';
                  
                  return (
                    <div key={ped.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex flex-col gap-3 font-sans shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-slate-800 truncate" title={ped.proveedor_nombre}>
                          {ped.proveedor_nombre}
                        </span>
                        
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase border ${
                            ped.estado === 'pendiente' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            ped.estado === 'ordenado' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-orange-50 text-orange-700 border-orange-200'
                          }`}>
                            {ped.estado}
                          </span>

                          {ped.estado === 'completado' && (
                            <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase border ${
                              ped.estado_pago === 'pagado'
                                ? 'bg-orange-100 text-orange-800 border-orange-200'
                                : 'bg-rose-100 text-rose-800 border-rose-200 animate-pulse'
                            }`}>
                              {ped.estado_pago === 'pagado' ? 'PAGADO' : 'POR PAGAR'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Detalles del Despacho y Fechas */}
                      <div className="grid grid-cols-2 gap-2 bg-white/60 p-2.5 rounded-xl border border-slate-200/50 text-[9.5px] font-sans font-semibold text-slate-600">
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-wide">Repartidor / Courier:</span>
                          <span className="text-slate-800 truncate">{ped.repartidor || 'Por asignar'}</span>
                        </div>
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-wide">F. Solicitud (Pedido):</span>
                          <span className="text-slate-800 truncate font-mono">{ped.fecha_solicitud || ped.fecha}</span>
                        </div>
                        <div className="flex flex-col gap-0.5 col-span-2 border-t border-slate-100 pt-1.5 mt-0.5 min-w-0">
                          <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-wide">F. Descarga, Entrega y Pago:</span>
                          <span className="text-slate-800 truncate font-mono flex items-center gap-1">
                            <svg className="w-3 h-3 text-orange-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {ped.fecha_pago_descarga || 'Al recibir mercadería'}
                          </span>
                        </div>
                      </div>

                      {/* Lista de Artículos Pedidos */}
                      <div className="flex flex-col gap-1.5 border-t border-slate-200/50 pt-2.5">
                        {ped.productos.map((item) => (
                          <div key={item.id} className="flex justify-between text-[10px] font-mono text-slate-500">
                            <span>• {item.nombre}</span>
                            <span className="font-bold text-slate-700">Cant: {item.cantidad_sugerida}u (S/ {item.precio_costo.toFixed(2)})</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between items-center mt-1 border-t border-slate-200/50 pt-2 text-xs">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Total del Pedido:</span>
                        <span className="font-bold font-mono text-slate-800">S/ {ped.monto_total.toFixed(2)}</span>
                      </div>

                      {/* Acciones de Flujo Pedido */}
                      {ped.estado !== 'completado' && (
                        <div className="flex gap-2 mt-1">
                          {ped.estado === 'pendiente' && (
                            <button
                              onClick={() => {
                                useCartStore.setState(state => ({
                                  mockPedidos: state.mockPedidos.map(p => p.id === ped.id ? { ...p, estado: 'ordenado' } : p)
                                }));
                              }}
                              className="flex-1 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-black text-[9px] uppercase tracking-wider transition-all cursor-pointer"
                            >
                              Enviar Orden
                            </button>
                          )}                           <button
                             onClick={() => {
                               completeMockPedido(ped.id);
                               addToast('Mercadería recibida. Stock físico actualizado.', 'success');
                             }}
                             className="flex-1 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-[9px] uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                           >
                             Recibir Mercadería
                           </button>
                         </div>
                       )}

                       {/* Botón premium de Liquidación de Deudas */}
                       {tieneDeuda && (
                         <button
                           onClick={() => setPedidoAPagar(ped)}
                           className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-[9px] uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-rose-600/10"
                         >
                           Liquidar Deuda con Proveedor
                         </button>
                       )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------------------
            CONTENIDO PESTAÑA: CATÁLOGO DE PROVEEDORES
            ------------------------------------------------------------------------- */}        {activeTab === 'proveedores' && (
          <div className="flex-1 overflow-hidden bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm flex flex-col animate-in fade-in duration-300">
            <h2 className="text-sm font-bold text-slate-700 mb-4 flex justify-between items-center">
              <span>Listado de Proveedores Registrados</span>
              <span className="text-xs bg-slate-100 text-slate-600 border border-slate-200/50 px-2.5 py-0.5 rounded-full font-black">
                {mockProveedores.length} Proveedores
              </span>
            </h2>

            <div className="flex-1 overflow-y-auto pr-1">
              {mockProveedores.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
                  <svg className="h-10 w-10 mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">No hay proveedores registrados</p>
                  <p className="text-[11px] text-slate-400 mt-1">Registra un nuevo proveedor en el panel contextual de la derecha.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200/60 shadow-sm bg-white">
                  <table className="w-full border-collapse text-left text-sm text-slate-600">
                    <thead className="bg-slate-50/80">
                      <tr className="border-b border-slate-200/60 text-[10px] font-black uppercase tracking-wider text-slate-500">
                        <th className="p-3">RUC</th>
                        <th className="p-3">Proveedor / Razón Social</th>
                        <th className="p-3">Teléfono</th>
                        <th className="p-3">Día de Visita</th>
                        <th className="p-3 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/80 font-sans text-xs">
                      {mockProveedores.map((prov) => (
                        <tr key={prov.id} className="hover:bg-orange-50/30 transition-colors">
                          <td className="p-3 font-mono text-[11px] font-bold text-slate-500">{prov.ruc}</td>
                          <td className="p-3 font-bold text-slate-800">{prov.nombre}</td>
                          <td className="p-3 font-mono text-slate-600 font-semibold">{prov.telefono || 'N/A'}</td>
                          <td className="p-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200/40">
                              {prov.dia_visita}
                            </span>
                          </td>
                          <td className="p-3 text-center flex justify-center gap-1.5">
                            <button
                              onClick={() => handleEditProveedorClick(prov)}
                              className="px-2.5 py-1.5 text-[9px] rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-black text-slate-600 uppercase tracking-wider transition-all cursor-pointer shadow-sm hover:border-slate-300 active:scale-95"
                            >
                              Editar
                            </button>
                            <button
                              onClick={async () => {
                                const confirmed = await requestConfirm(`¿Estás seguro de que deseas eliminar al proveedor '${prov.nombre}'? Esta acción es irreversible.`);
                                if (confirmed) {
                                  eliminarMockProveedor(prov.id);
                                  addToast(`Proveedor '${prov.nombre}' eliminado correctamente.`, 'success');
                                }
                              }}
                              className="px-2.5 py-1.5 text-[9px] rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 font-black text-red-600 uppercase tracking-wider transition-all cursor-pointer shadow-sm hover:border-red-300 active:scale-95"
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------------------
            CONTENIDO PESTAÑA: REPORTES DE CIERRE DIARIO (AUDITORÍA)
            ------------------------------------------------------------------------- */}
        {activeTab === 'cierres' && (
          <div className="flex-1 overflow-hidden bg-white rounded-3xl border border-slate-200/80 p-4 shadow-sm flex flex-col animate-in fade-in duration-300">
            <h2 className="text-sm font-bold text-slate-700 mb-4 flex justify-between items-center">
              <span>Historial de Cierres Diarios y Arqueo Financiero</span>
              <span className="text-xs bg-slate-100 text-slate-600 border border-slate-200/50 px-2.5 py-0.5 rounded-full font-black">
                {historialCierres.length} Cierres
              </span>
            </h2>

            <div className="flex-1 overflow-y-auto">
              {historialCierres.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
                  <svg className="h-10 w-10 mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">No hay registros de cierres guardados</p>
                  <p className="text-[11px] text-slate-400 mt-1">Cuando ejecutes el Cierre Diario [F10] en la caja, el reporte auditable aparecerá acá al instante.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200/60 shadow-sm bg-white">
                <table className="w-full border-collapse text-left text-sm text-slate-600">
                  <thead className="bg-slate-50/80">
                    <tr className="border-b border-slate-200/60 text-[10px] font-black uppercase tracking-wider text-slate-500">
                      <th className="p-3">Fecha y Horas</th>
                      <th className="p-3 text-right">Apertura (S/)</th>
                      <th className="p-3 text-right">Ventas (S/)</th>
                      <th className="p-3 text-right">Egresos (S/)</th>
                      <th className="p-3 text-right text-slate-700">Esperado (S/)</th>
                      <th className="p-3 text-right text-indigo-700">Declarado (S/)</th>
                      <th className="p-3 text-right">Desviación (S/)</th>
                      <th className="p-3 text-right text-slate-800">Total Neto (S/)</th>
                      <th className="p-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/80 font-mono text-xs">
                    {historialCierres.map((cierre) => {
                      const tieneDesviacion = Math.abs(cierre.desviacion) > 0.01;
                      const esNegativa = cierre.desviacion < -0.01;
                      const esPositiva = cierre.desviacion > 0.01;                       return (
                        <tr key={cierre.id} className="hover:bg-orange-50/30 transition-colors">
                          <td className="p-3 font-sans">
                            <span className="font-bold text-slate-800 block text-xs">
                              {new Date(cierre.fechaApertura).toLocaleDateString()}
                            </span>
                            <div className="flex gap-2 mt-1">
                              <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                AP: {new Date(cierre.fechaApertura).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                CI: {new Date(cierre.fechaCierre).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </td>
                          <td className="p-3 text-right text-slate-600 font-medium">{cierre.montoApertura.toFixed(2)}</td>
                          <td className="p-3 text-right">
                            <span className="block font-bold text-slate-800">{(cierre.ventasEfectivo + cierre.ventasBilletera).toFixed(2)}</span>
                            <div className="flex flex-col items-end gap-0.5 mt-0.5">
                              <span className="text-[8px] font-bold text-slate-400">EFE: {cierre.ventasEfectivo.toFixed(2)}</span>
                              <span className="text-[8px] font-bold text-orange-600">BIL: {cierre.ventasBilletera.toFixed(2)}</span>
                            </div>
                          </td>
                          <td className="p-3 text-right text-rose-600 font-semibold">
                            {(cierre.egresosEfectivo + cierre.egresosBilletera).toFixed(2)}
                            {(cierre.egresosEfectivo > 0 || cierre.egresosBilletera > 0) && (
                              <div className="flex flex-col items-end gap-0.5 mt-0.5">
                                {cierre.egresosEfectivo > 0 && <span className="text-[8px] font-bold text-rose-400">EFE: {cierre.egresosEfectivo.toFixed(2)}</span>}
                                {cierre.egresosBilletera > 0 && <span className="text-[8px] font-bold text-rose-400">BIL: {cierre.egresosBilletera.toFixed(2)}</span>}
                              </div>
                            )}
                          </td>
                          <td className="p-3 text-right text-slate-700 font-bold">{cierre.saldoFinalEfectivo.toFixed(2)}</td>
                          <td className="p-3 text-right text-indigo-700 font-black">{cierre.efectivoDeclarado.toFixed(2)}</td>
                          <td className="p-3 text-right font-black">
                            {!tieneDesviacion ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-[9px] font-black bg-orange-50 text-orange-700 border border-orange-200/60">
                                0.00
                              </span>
                            ) : esNegativa ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-[9px] font-black bg-rose-50 text-rose-700 border border-rose-200/60 animate-pulse">
                                {cierre.desviacion.toFixed(2)}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-[9px] font-black bg-amber-50 text-amber-700 border border-amber-200/60">
                                +{cierre.desviacion.toFixed(2)}
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right text-slate-800 font-black text-sm">
                            {cierre.totalNeto.toFixed(2)}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => setSelectedAuditCierre(cierre)}
                              className="px-3 py-1.5 text-[9px] rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-black text-slate-600 uppercase tracking-wider transition-all cursor-pointer shadow-sm hover:border-slate-300"
                            >
                              Detalles
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------------------
            CONTENIDO PESTAÑA: FALTANTES DE FRESCOS Y MERCADO
            ------------------------------------------------------------------------- */}
        {activeTab === 'mercado' && (
          <div className="flex-1 flex flex-col lg:flex-row gap-6 w-full h-full overflow-y-auto lg:overflow-hidden animate-in fade-in duration-300 p-1 lg:p-0">
            
            {/* PANEL DE REGISTRO & ACCESOS RÁPIDOS (Izquierda en desktop, Superior en móvil) */}
            <div className="w-full lg:w-[420px] xl:w-[480px] flex-shrink-0 flex flex-col gap-5">
              
              {/* Card 1: Accesos Rápidos (Tap Inteligente - Instantáneo) */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm flex flex-col gap-4">
                <div className="pb-3 border-b border-slate-100 flex justify-between items-center">
                  <div>
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Accesos Rápidos (Tap Instantáneo)
                    </h2>
                    <p className="text-[10.5px] text-slate-400 font-semibold mt-0.5">Toca cualquier alimento para agregarlo de inmediato a la lista sin escribir.</p>
                  </div>
                </div>

                <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-1">
                  
                  {/* Verduras */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <span>🥬</span> Verduras y Hortalizas:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {['Choclo', 'Limón', 'Cebolla Grande', 'Cebolla Pequeña', 'Rocoto', 'Ají Amarillo', 'Lechuga', 'Alverja', 'Beterraga', 'Kion', 'Pimiento Chico', 'Pimiento Grande', 'Zanahoria', 'Zukini', 'Brócoli', 'Habas'].map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => handleQuickFrescoTap(item)}
                          className="px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-slate-50 hover:bg-orange-50 border border-slate-200 hover:border-orange-300 text-slate-700 hover:text-orange-700 transition-all cursor-pointer min-h-[44px] active:scale-95 flex items-center select-none shadow-sm"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Frutas */}
                  <div className="flex flex-col gap-1.5 border-t border-slate-100 pt-3">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <span>🍓</span> Frutas Frescas:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {['Maracuyá', 'Palta', 'Piña', 'Manzana', 'Papaya'].map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => handleQuickFrescoTap(item)}
                          className="px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-slate-50 hover:bg-orange-50 border border-slate-200 hover:border-orange-300 text-slate-700 hover:text-orange-700 transition-all cursor-pointer min-h-[44px] active:scale-95 flex items-center select-none shadow-sm"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Moliendas y Ajos */}
                  <div className="flex flex-col gap-1.5 border-t border-slate-100 pt-3">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <span>🌶️</span> Ajos y Moliendas:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {['Ají Colorado Molido', 'Ajo Molido'].map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => handleQuickFrescoTap(item)}
                          className="px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-slate-50 hover:bg-orange-50 border border-slate-200 hover:border-orange-300 text-slate-700 hover:text-orange-700 transition-all cursor-pointer min-h-[44px] active:scale-95 flex items-center select-none shadow-sm"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Proteínas */}
                  <div className="flex flex-col gap-1.5 border-t border-slate-100 pt-3">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <span>🥩</span> Proteínas Frescas:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {['Pollo Fresco', 'Carne de Res', 'Carne de Chancho', 'Milanesa'].map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => handleQuickFrescoTap(item)}
                          className="px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-slate-50 hover:bg-orange-50 border border-slate-200 hover:border-orange-300 text-slate-700 hover:text-orange-700 transition-all cursor-pointer min-h-[44px] active:scale-95 flex items-center select-none shadow-sm"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              </div>

              {/* Card 2: Formulario Manual con Autocompletado */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm flex flex-col gap-4">
                <div className="pb-3 border-b border-slate-100">
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">Registro Manual / Custom</h2>
                  <p className="text-[10.5px] text-slate-400 font-semibold mt-0.5">Usa esta sección para ingresar ítems a medida o especificar cantidades y notas.</p>
                </div>

                <div className="flex flex-col gap-3.5 relative">
                  
                  {/* Producto Autocomplete */}
                  <div className="flex flex-col gap-1.5 relative">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Nombre del Producto / Fresco:</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={frescoNombre}
                        onChange={(e) => handleFrescoNombreChange(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3.5 px-4 text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500 focus:bg-white transition-all min-h-[44px]"
                        placeholder="Ej. Tomate, Cebolla, Ají..."
                      />
                      {sugerenciasFiltradas.length > 0 && (
                        <div className="absolute left-0 right-0 mt-1.5 z-30 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden divide-y divide-slate-100 animate-in fade-in duration-200">
                          {sugerenciasFiltradas.map((sug) => (
                            <button
                              key={sug}
                              type="button"
                              onClick={() => handleSelectSugerencia(sug)}
                              className="w-full text-left py-3 px-4 text-xs font-bold text-slate-700 hover:bg-orange-50/50 hover:text-orange-700 transition-colors flex items-center justify-between cursor-pointer min-h-[44px]"
                            >
                              <span>{sug}</span>
                              <span className="text-[9px] font-black uppercase text-slate-400">Autocompletar</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Cantidad (Opcional) */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex justify-between items-center">
                      <span>Cantidad / Medida:</span>
                      <span className="text-[8.5px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-normal">Opcional</span>
                    </label>
                    <input
                      ref={frescoCantidadInputRef}
                      type="text"
                      value={frescoCantidad}
                      onChange={(e) => setFrescoCantidad(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3.5 px-4 text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500 focus:bg-white transition-all min-h-[44px]"
                      placeholder="Ej. 5 kg, 2 atados (o deja en blanco)"
                    />
                  </div>

                  {/* Notas */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Notas adicionales (opcional):</label>
                    <textarea
                      value={frescoNotas}
                      onChange={(e) => setFrescoNotas(e.target.value)}
                      rows={2}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 px-4 text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500 focus:bg-white transition-all resize-none"
                      placeholder="Ej. Maduros para ensalada, proveedor habitual..."
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!frescoNombre.trim()) {
                        addToast('Por favor, ingresa el nombre del fresco.', 'error');
                        return;
                      }
                      agregarFaltanteFresco({
                        nombre: frescoNombre.trim(),
                        cantidad: frescoCantidad.trim() || 'No especificada',
                        notas: frescoNotas.trim() || undefined
                      });
                      setFrescoNombre('');
                      setFrescoCantidad('');
                      setFrescoNotas('');
                      addToast('Faltante registrado.', 'success');
                    }}
                    className="w-full py-3.5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-md shadow-orange-600/10 flex items-center justify-center gap-1.5 mt-2 min-h-[44px]"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                    </svg>
                    Agregar Faltante
                  </button>

                </div>
              </div>

            </div>

            {/* LISTADO DE FALTANTES & REGISTRO DIARIO (Derecha en desktop, Inferior en móvil) */}
            <div className="flex-1 bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between overflow-hidden min-h-[400px]">
              <div className="flex flex-col overflow-hidden h-full">
                
                {/* Header del Listado */}
                <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
                  <div>
                    <h2 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                      <span>Lista del Mercado del Día</span>
                      <span className="text-[10px] bg-orange-100 text-orange-700 border border-orange-200/40 px-2 py-0.5 rounded-full font-black">
                        {faltantesFrescos.length} Faltantes
                      </span>
                    </h2>
                  </div>
                  
                  {faltantesFrescos.length > 0 && (
                    <button
                      onClick={async () => {
                        const confirmed = await requestConfirm('¿Estás seguro de que deseas limpiar toda la lista de faltantes frescos?');
                        if (confirmed) {
                          limpiarFaltantesFrescos();
                          addToast('Lista de faltantes de frescos vaciada con éxito.', 'success');
                        }
                      }}
                      className="px-3.5 py-2 text-[9px] rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 font-black text-red-600 uppercase tracking-wider transition-all cursor-pointer shadow-sm hover:border-red-300"
                    >
                      Limpiar Todo
                    </button>
                  )}
                </div>

                {/* Banner de Recordatorio a las 9 PM */}
                <div className="mb-4 p-4 rounded-2xl bg-amber-50 border border-amber-200/60 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="p-2 bg-amber-100 rounded-xl flex-shrink-0 text-amber-700">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Recordatorio Activo a las 9:00 PM</h4>
                      <p className="text-[10.5px] text-slate-500 font-semibold leading-relaxed mt-0.5">
                        Alerta automatizada a los operarios para compilar y liquidar la lista fresca.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0 w-full sm:w-auto">
                    <div className="flex items-center justify-between w-full sm:justify-end gap-3">
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Falta:</div>
                      <div className="font-mono text-xs font-black text-amber-700 bg-amber-100 border border-amber-200 px-3 py-1 rounded-xl shadow-sm tracking-widest">
                        {timeRemaining}
                      </div>
                    </div>
                    <button
                      onClick={handleSimularRecordatorio}
                      className="w-full sm:w-auto px-3 py-1.5 text-[8.5px] font-black uppercase text-amber-800 bg-amber-100/50 hover:bg-amber-100 border border-amber-200/80 rounded-lg tracking-wider transition-colors cursor-pointer text-center animate-pulse"
                    >
                      Simular Aviso
                    </button>
                  </div>
                </div>

                {/* Listado de Faltantes Registrados */}
                <div className="flex-1 overflow-y-auto pr-1">
                  {faltantesFrescos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
                      <svg className="h-12 w-12 mb-3 text-slate-300 animate-bounce duration-1000" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Ningún faltante registrado</p>
                      <p className="text-[11px] text-slate-400 mt-1">Usa los accesos rápidos de un solo toque o escribe un producto arriba.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 align-content-start pb-4">
                      {faltantesFrescos.map((f) => (
                        <div
                          key={f.id}
                          className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between gap-3.5 shadow-sm ${
                            f.comprado
                              ? 'bg-slate-50 border-slate-200/60 opacity-60'
                              : 'bg-white border-slate-200 hover:border-orange-500/50 hover:shadow-md'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2.5">
                            <div className="flex items-start gap-2.5 flex-1 min-w-0">
                              <button
                                onClick={() => toggleFaltanteFresco(f.id)}
                                className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer mt-0.5 ${
                                  f.comprado
                                    ? 'bg-orange-600 border-orange-600 text-white'
                                    : 'border-slate-300 hover:border-orange-600'
                                }`}
                              >
                                {f.comprado && (
                                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </button>

                              <div className="flex-1 min-w-0">
                                <span
                                  className={`text-xs font-black leading-snug block truncate ${
                                    f.comprado ? 'text-slate-500 line-through font-semibold' : 'text-slate-800'
                                  }`}
                                >
                                  {f.nombre}
                                </span>
                                <span className={`text-[10px] font-bold mt-0.5 block ${f.comprado ? 'text-slate-400' : 'text-orange-600'}`}>
                                  {f.cantidad === 'No especificada' ? '⚡ Compra rápida' : `Req: ${f.cantidad}`}
                                </span>
                                {f.notas && (
                                  <p className="text-[10px] text-slate-500 font-medium leading-normal mt-1 bg-slate-50/50 rounded-lg p-1.5 border border-slate-100/80 truncate">
                                    {f.notas}
                                  </p>
                                )}
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                eliminarFaltanteFresco(f.id);
                                addToast(`'${f.nombre}' eliminado de la lista.`, 'info');
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>

                          <div className="flex justify-between items-center border-t border-slate-100 pt-2 text-[9px] font-bold font-mono text-slate-400 uppercase tracking-wider">
                            <span>Ingresado:</span>
                            <span>{f.fecha}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>


      {/* =========================================================================
         MODAL INTERACTIVO: REGISTRAR NUEVO PEDIDO / DEUDA MANUAL
         ========================================================================= */}
      {showPedidoManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            {/* Header del Modal */}
            <div className="bg-slate-50 p-6 border-b border-slate-200 flex justify-between items-start">
              <div>
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  Registrar Compra / Pedido Manual
                </h2>
                <p className="text-[11px] text-slate-400 font-bold uppercase mt-1">Crea deudas y pedidos diferenciando transportista y cronograma</p>
              </div>
              <button
                onClick={() => {
                  setShowPedidoManualModal(false);
                  setNuevoPedidoProductos([]);
                }}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Cuerpo del Modal */}
            <div className="p-6 overflow-y-auto flex flex-col gap-4">
              
              {/* Grid Datos de Despacho */}
              <div className="grid grid-cols-2 gap-4">
                {/* Seleccionar Proveedor */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Proveedor / Canal:</label>
                  <select
                    value={nuevoPedidoProveedorId}
                    onChange={(e) => setNuevoPedidoProveedorId(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 px-4 text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                  >
                    <option value="">-- Elegir Proveedor --</option>
                    {mockProveedores.map((prov) => (
                      <option key={prov.id} value={prov.id}>
                        {prov.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* ¿Quién traerá el pedido? (Repartidor) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">¿Quién traerá el pedido? (Repartidor):</label>
                  <input
                    type="text"
                    value={nuevoPedidoRepartidor}
                    onChange={(e) => setNuevoPedidoRepartidor(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 px-4 text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                    placeholder="Ej. Carlos Mendoza (Chofer Backus)"
                  />
                </div>

                {/* Fecha Solicitud (Día que se deja el pedido) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Fecha Solicitud (Día que se deja):</label>
                  <input
                    type="date"
                    value={nuevoPedidoFechaSolicitud}
                    onChange={(e) => setNuevoPedidoFechaSolicitud(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 px-4 text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                  />
                </div>

                {/* Fecha Pago/Descarga (Día que traen y descargan) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Fecha Descarga / Pago (Día que traen):</label>
                  <input
                    type="date"
                    value={nuevoPedidoFechaPagoDescarga}
                    onChange={(e) => setNuevoPedidoFechaPagoDescarga(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 px-4 text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Formulario Agregar Producto al Pedido */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/50 flex flex-col gap-3">
                <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Agregar Productos al Pedido</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Select Producto */}
                  <div className="flex flex-col gap-1.5 md:col-span-3">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Producto del Catálogo:</label>
                    <select
                      value={pedManProdId}
                      onChange={(e) => setPedManProdId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500 transition-all"
                    >
                      <option value="">-- Seleccionar --</option>
                      {mockProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre} (Stock: {p.stock}u | Costo: S/ {p.precio_costo.toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Cantidad */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Cantidad:</label>
                    <input
                      type="number"
                      value={pedManCant}
                      onChange={(e) => setPedManCant(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500 transition-all"
                      placeholder="1"
                    />
                  </div>

                  {/* Costo Unitario */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Costo Unitario (S/):</label>
                    <input
                      type="number"
                      step="0.01"
                      value={pedManCosto}
                      onChange={(e) => setPedManCosto(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500 transition-all"
                      placeholder="0.00"
                    />
                  </div>

                  {/* Botón Agregar Fila */}
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleAddProductToManualPedido}
                      className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      Agregar Item
                    </button>
                  </div>
                </div>
              </div>

              {/* Listado de Productos Agregados */}
              <div className="flex flex-col gap-2">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Detalle del Pedido Actual</h4>
                
                {nuevoPedidoProductos.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-slate-200 rounded-2xl text-slate-400 font-semibold text-xs">
                    Ningún producto agregado al pedido todavía.
                  </div>
                ) : (
                  <div className="border border-slate-200/80 rounded-2xl overflow-hidden bg-slate-50/20 max-h-40 overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-500 tracking-wider sticky top-0">
                        <tr className="border-b border-slate-200">
                          <th className="p-2.5">Producto</th>
                          <th className="p-2.5 text-center">Cant.</th>
                          <th className="p-2.5 text-right">Costo</th>
                          <th className="p-2.5 text-right">Total</th>
                          <th className="p-2.5 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[11px] font-semibold text-slate-700">
                        {nuevoPedidoProductos.map((item, idx) => (
                          <tr key={item.id} className="hover:bg-slate-50">
                            <td className="p-2.5 truncate max-w-[180px]">{item.nombre}</td>
                            <td className="p-2.5 text-center font-mono">{item.cantidad_sugerida}u</td>
                            <td className="p-2.5 text-right font-mono">S/ {item.precio_costo.toFixed(2)}</td>
                            <td className="p-2.5 text-right font-mono font-bold text-slate-800">
                              S/ {(item.cantidad_sugerida * item.precio_costo).toFixed(2)}
                            </td>
                            <td className="p-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setNuevoPedidoProductos(nuevoPedidoProductos.filter((_, i) => i !== idx));
                                }}
                                className="text-red-500 hover:text-red-700 p-0.5 rounded transition-colors"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>

            {/* Footer del Modal */}
            <div className="bg-slate-50 p-4.5 border-t border-slate-200 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">Total General:</span>
                <span className="text-lg font-black font-mono text-slate-800">
                  S/ {nuevoPedidoProductos.reduce((sum, item) => sum + (item.cantidad_sugerida * item.precio_costo), 0).toFixed(2)}
                </span>
              </div>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPedidoManualModal(false);
                    setNuevoPedidoProductos([]);
                  }}
                  className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleGuardarPedidoManual}
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-md shadow-orange-600/10 flex items-center gap-1"
                >
                  Guardar Pedido
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
         MODAL DE AUDITORÍA FINANCIERA (REPORTES DE CIERRE)
         ========================================================================= */}
      {selectedAuditCierre && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            {/* Header del Modal */}
            <div className="bg-slate-50 p-6 border-b border-slate-200 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                  <svg className="w-5 h-5 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Auditoría Detallada de Caja
                </h2>
                <div className="mt-2 flex items-center gap-4 text-xs font-semibold text-slate-500">
                  <span className="bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-sm font-mono">
                    ID: {selectedAuditCierre.cajaId || 'N/A'}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    Apertura: {new Date(selectedAuditCierre.fechaApertura).toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    Cierre: {new Date(selectedAuditCierre.fechaCierre).toLocaleString()}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedAuditCierre(null)}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Contenido Scrolleable */}
            <div className="p-6 overflow-y-auto flex flex-col gap-6 bg-slate-50/50">
              
              <div className="grid grid-cols-2 gap-4">
                {/* Panel Efectivo */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Contabilidad de Efectivo
                  </h3>
                  
                  <div className="space-y-3 text-sm font-medium text-slate-600">
                    <div className="flex justify-between items-center">
                      <span>(+) Fondo Fijo Apertura</span>
                      <span className="font-mono font-bold text-slate-800">S/ {selectedAuditCierre.montoApertura.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>(+) Ventas Efectivo</span>
                      <span className="font-mono font-bold text-slate-800">S/ {selectedAuditCierre.ventasEfectivo.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-rose-600">
                      <span>(-) Egresos Efectivo</span>
                      <span className="font-mono font-bold">S/ {selectedAuditCierre.egresosEfectivo.toFixed(2)}</span>
                    </div>
                    
                    <div className="pt-3 mt-3 border-t border-dashed border-slate-200">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-bold">Efectivo Esperado (Sistema)</span>
                        <span className="font-mono font-black text-slate-800 text-base">S/ {selectedAuditCierre.saldoFinalEfectivo.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-slate-500 font-bold">Efectivo Real Declarado</span>
                        <span className="font-mono font-black text-indigo-700 text-base">S/ {selectedAuditCierre.efectivoDeclarado.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className={`pt-3 mt-3 border-t border-slate-200 flex justify-between items-center rounded-xl p-3 ${Math.abs(selectedAuditCierre.desviacion) < 0.01 ? 'bg-orange-50 text-orange-800 border-orange-100' : selectedAuditCierre.desviacion < 0 ? 'bg-rose-50 text-rose-800 border-rose-100' : 'bg-amber-50 text-amber-800 border-amber-100'}`}>
                      <span className="font-black uppercase tracking-wider text-xs">
                        {Math.abs(selectedAuditCierre.desviacion) < 0.01 ? 'Cuadre Perfecto' : selectedAuditCierre.desviacion < 0 ? 'Faltante Detectado' : 'Sobrante Detectado'}
                      </span>
                      <span className="font-mono font-black text-lg">
                        S/ {selectedAuditCierre.desviacion.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Panel Billeteras */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Billeteras Digitales
                  </h3>
                  
                  {Object.keys(selectedAuditCierre.saldoFinalBilleteras).length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2 pb-8">
                      <svg className="w-8 h-8 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                      <span className="text-xs font-semibold">Sin movimientos digitales</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(selectedAuditCierre.saldoFinalBilleteras).map(([nombre, saldo]) => (
                        <div key={nombre} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="font-bold text-slate-700 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                            {nombre}
                          </span>
                          <span className="font-mono font-black text-orange-700">S/ {saldo.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="bg-white p-6 border-t border-slate-200 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Total Neto Recaudado (Efectivo + Digital)</span>
                <span className="font-mono font-black text-3xl text-slate-800">S/ {selectedAuditCierre.totalNeto.toFixed(2)}</span>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => window.print()}
                  className="px-6 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-black text-slate-600 uppercase tracking-wider transition-all shadow-sm flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
                  Imprimir
                </button>
                <button 
                  onClick={() => setSelectedAuditCierre(null)}
                  className="px-6 py-3 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-black uppercase tracking-wider transition-all shadow-md"
                >
                  Cerrar
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Columna Derecha: Formulario Contextual */}
      <div className="w-[340px] xl:w-[380px] 2xl:w-[420px] flex flex-col gap-5 overflow-hidden flex-shrink-0">

        {/* -------------------------------------------------------------------------
            TARJETA DE ARQUEO FINANCIERO Y COMPRAS (ERP GLOBAL)
            ------------------------------------------------------------------------- */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm flex flex-col gap-3">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider">
            Balance General Multicanal
          </h2>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/50 flex flex-col">
              <span className="text-[9px] text-slate-400 font-bold uppercase">Caja Física</span>
              <span className="text-lg font-black font-mono text-slate-800 mt-1">S/ {efectivoCajaFisica.toFixed(2)}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/50 flex flex-col">
              <span className="text-[9px] text-slate-400 font-bold uppercase">Billeteras</span>
              <span className="text-lg font-black font-mono text-orange-600 mt-1">S/ {cuentasBilletera.reduce((sum, c) => sum + c.saldo, 0).toFixed(2)}</span>
            </div>
            <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100 flex flex-col col-span-2 shadow-inner">
              <div className="flex justify-between items-center">
                <span className="text-[9px] text-rose-800 font-bold uppercase">Deudas a pagar (Proveedores)</span>
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping"></span>
              </div>
              <span className="text-xl font-black font-mono text-rose-600 mt-1">S/ {deudasPendientes.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        {/* -------------------------------------------------------------------------
            FORMULARIO CONTEXTUAL 1: PRODUCTOS
            ------------------------------------------------------------------------- */}
        {activeTab === 'productos' && (
          <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-md flex flex-col gap-4 overflow-y-auto">
            <h2 className="text-sm font-black text-slate-800 pb-2 border-b border-slate-100">
              {formId ? 'Editar Ficha Producto' : 'Crear Producto'}
            </h2>

            <form onSubmit={handleSaveProduct} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Nombre del Producto:</label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Chocolate Sublime Extragrande"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-all shadow-sm"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Código de Barras:</label>
                <input
                  type="text"
                  required
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  placeholder="Escribir o escanear código..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-all shadow-sm font-mono"
                />
              </div>

              {/* Lógica de Precios con Margen de Ganancia Configurable */}
              <div className="grid grid-cols-3 gap-2 border-t border-b border-slate-100 py-3.5">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">P. Costo (S/):</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={precioCosto}
                    onChange={(e) => handleCostoChange(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500 focus:bg-white transition-all shadow-sm font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Margen (%):</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={margenGanancia}
                    onChange={(e) => handleMargenChange(e.target.value)}
                    placeholder="30"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500 focus:bg-white transition-all shadow-sm font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">P. Venta (S/):</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={precioVenta}
                    onChange={(e) => handleVentaChange(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500 focus:bg-white transition-all shadow-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Stock Inicial:</label>
                  <input
                    type="number"
                    required
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500 focus:bg-white transition-all shadow-sm font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Proveedor:</label>
                  <select
                    value={proveedorId}
                    onChange={(e) => setProveedorId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-bold text-slate-700 focus:border-orange-500 focus:bg-white transition-all outline-none shadow-sm cursor-pointer"
                  >
                    <option value="">Seleccionar...</option>
                    {mockProveedores.map((p) => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2 mt-2">
                {formId && (
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="w-1/3 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600 cursor-pointer transition-all"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  type="submit"
                  disabled={duplicadoDetectado.existe}
                  className={`
                    w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer
                    ${duplicadoDetectado.existe
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/50'
                      : 'bg-gradient-to-r from-orange-600 to-amber-600 text-white hover:brightness-105 active:scale-95 shadow-md shadow-orange-600/10'
                    }
                  `}
                >
                  {formId ? 'Guardar Cambios' : 'Registrar Producto'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* -------------------------------------------------------------------------
            FORMULARIO CONTEXTUAL 2: PROVEEDORES CRUD
            ------------------------------------------------------------------------- */}
        {activeTab === 'proveedores' && (
          <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-md flex flex-col gap-4 overflow-y-auto">
            <h2 className="text-sm font-black text-slate-800 pb-2 border-b border-slate-100">
              {editingProvId ? 'Editar Ficha Proveedor' : 'Registrar Nuevo Proveedor'}
            </h2>

            <form onSubmit={handleSaveProveedor} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Nombre del Proveedor:</label>
                <input
                  type="text"
                  required
                  value={provNombre}
                  onChange={(e) => setProvNombre(e.target.value)}
                  placeholder="Ej. Distribuidora San Ignacio S.A.C."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500 focus:bg-white transition-all shadow-sm"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">RUC (11 dígitos):</label>
                <input
                  type="text"
                  required
                  value={provRuc}
                  onChange={(e) => setProvRuc(e.target.value)}
                  placeholder="Ej. 20546789123"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500 focus:bg-white transition-all shadow-sm font-mono"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Teléfono de contacto:</label>
                <input
                  type="text"
                  value={provTelefono}
                  onChange={(e) => setProvTelefono(e.target.value)}
                  placeholder="Ej. 987654321"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500 focus:bg-white transition-all shadow-sm font-mono"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Día Programado de Visita:</label>
                <select
                  value={provDiaVisita}
                  onChange={(e) => setProvDiaVisita(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-bold text-slate-700 focus:border-orange-500 focus:bg-white transition-all outline-none shadow-sm cursor-pointer"
                >
                  <option value="Lunes">Lunes</option>
                  <option value="Martes">Martes</option>
                  <option value="Miércoles">Miércoles</option>
                  <option value="Jueves">Jueves</option>
                  <option value="Viernes">Viernes</option>
                  <option value="Sábado">Sábado</option>
                  <option value="Domingo">Domingo</option>
                </select>
              </div>

              <div className="flex gap-2 mt-2">
                {editingProvId && (
                  <button
                    type="button"
                    onClick={handleCancelEditProveedor}
                    className="w-1/3 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600 cursor-pointer transition-all"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-white font-black text-xs uppercase tracking-wider hover:brightness-105 active:scale-95 shadow-md shadow-orange-600/10 cursor-pointer"
                >
                  {editingProvId ? 'Actualizar Ficha' : 'Agregar Proveedor'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* -------------------------------------------------------------------------
            PANELES VACÍOS / INFORMACIÓN CONTEXTUAL 3: COMPRAS
            ------------------------------------------------------------------------- */}
        {activeTab === 'compras' && (
          <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-md flex flex-col gap-3 justify-center items-center h-full text-center">
            <svg className="h-10 w-10 text-orange-600/80 mb-2 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Flujo de Caja Digital</h3>
            <p className="text-[11px] text-slate-400 font-semibold px-4 leading-relaxed">
              Toda egresión física o transferencia digital a proveedores disminuye de forma atómica tus balances generales. Sincronización instantánea con arqueo de Caja en vivo.
            </p>
          </div>
        )}

        {/* -------------------------------------------------------------------------
            PANEL INFORMACIÓN CONTEXTUAL 4: REPORTES DE CIERRE
            ------------------------------------------------------------------------- */}
        {activeTab === 'cierres' && (
          <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-md flex flex-col gap-4 justify-center items-center h-full text-center animate-in fade-in duration-300">
            <svg className="h-10 w-10 text-amber-600/80 mb-1.5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Trazabilidad Total</h3>
            <p className="text-[11px] text-slate-400 font-semibold px-4 leading-relaxed">
              El cuadre de caja compara en tiempo real el efectivo en cajón esperado con el declarado por el cajero, registrando discrepancias. El reporte desglosa los cierres de billeteras digitales (Yape, Plin) de forma transparente para auditorías rápidas.
            </p>
            <div className="w-full bg-slate-50 border border-slate-200/60 rounded-2xl p-4 mt-2 flex flex-col gap-2.5 text-left text-xs font-sans">
              <div className="flex justify-between items-center font-bold text-slate-700">
                <span>Historial Recaudación Total:</span>
                <span className="font-mono text-orange-600 font-black">
                  S/ {historialCierres.reduce((sum, c) => sum + c.totalNeto, 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center font-bold text-slate-700 border-t border-slate-200/50 pt-2">
                <span>Desviación Total Acumulada:</span>
                <span className={`font-mono font-black ${
                  historialCierres.reduce((sum, c) => sum + c.desviacion, 0) < -0.01 
                    ? 'text-rose-600' 
                    : 'text-orange-600'
                }`}>
                  S/ {historialCierres.reduce((sum, c) => sum + c.desviacion, 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* =========================================================================
         MODAL PREMIUM CENTRALIZADO: DUPLICADO DETECTADO Y CONSOLIDACIÓN RÁPIDA
         ========================================================================= */}
      {duplicadoDetectado.existe && duplicadoDetectado.producto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="w-[450px] rounded-3xl border border-slate-200 bg-white p-7 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 mb-2 text-rose-600">
              <svg className="w-5 h-5 text-rose-500 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h2 className="text-lg font-black text-slate-800 tracking-tight">Producto Duplicado Detectado</h2>
            </div>
            
            <p className="text-xs text-slate-500 mb-4 leading-relaxed font-semibold">
              Ya existe un producto en tu catálogo con el mismo <span className="text-rose-700 font-extrabold">{duplicadoDetectado.tipo}</span>.
              Seleccioná qué acción querés tomar para mantener normalizados tus registros:
            </p>

            {/* Ficha del Producto Encontrado */}
            <div className="rounded-2xl bg-rose-50/50 border border-rose-100 p-4 mb-5 flex flex-col gap-2 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Nombre:</span>
                <span className="font-extrabold text-slate-800 font-sans">{duplicadoDetectado.producto.nombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Código de Barras:</span>
                <span className="font-extrabold text-slate-700">{duplicadoDetectado.producto.codigo}</span>
              </div>
              <div className="flex justify-between border-t border-rose-100 pt-2">
                <span className="text-slate-500">Stock Actual:</span>
                <span className="font-black text-rose-700 font-sans text-sm">{duplicadoDetectado.producto.stock} unidades</span>
              </div>
            </div>

            {/* Opción 1: Consolidación y Fusión Rápida de Stock */}
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl mb-4 flex flex-col gap-2.5">
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider block">Opción A: Consolidar y Fusionar Stock</span>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={stockAConsolidar}
                  onChange={(e) => setStockAConsolidar(e.target.value)}
                  placeholder="Sumar cantidad. Ej. 12"
                  className="w-1/2 rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500"
                />
                <button
                  type="button"
                  onClick={handleConsolidarStock}
                  className="w-1/2 bg-orange-600 hover:bg-orange-700 py-2.5 rounded-xl font-black text-white text-[10px] uppercase tracking-wider transition-all cursor-pointer shadow-sm shadow-orange-600/10"
                >
                  Sumar y Fusionar Stock
                </button>
              </div>
            </div>

            {/* Opción 2: Adoptar y Editar */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDuplicadoDetectado({ existe: false, tipo: null })}
                className="w-1/2 bg-slate-100 hover:bg-slate-200/80 py-3 rounded-xl font-black text-slate-600 text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Cerrar Advertencia
              </button>
              
              <button
                type="button"
                onClick={() => handleAdoptarProductoExistente(duplicadoDetectado.producto!)}
                className="w-1/2 bg-slate-900 hover:bg-slate-950 py-3 rounded-xl font-black text-white text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-md"
              >
                Adoptar y Editar Ficha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
         MODAL PREMIUM CENTRALIZADO: LIQUIDACIÓN DE CUENTAS POR PAGAR (PROVEEDORES)
         ========================================================================= */}
      {pedidoAPagar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="w-[420px] rounded-3xl border border-slate-200 bg-white p-7 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-lg font-black text-slate-800 mb-1.5 tracking-tight">Liquidar Cuenta por Pagar</h2>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed font-semibold">
              Saldá la deuda pendiente con <span className="text-slate-700 font-extrabold">{pedidoAPagar.proveedor_nombre}</span>. El egreso de fondos se registrará en vivo de forma atómica.
            </p>

            {/* Resumen de la Deuda */}
            <div className="rounded-2xl bg-rose-50/50 border border-rose-100 p-4 mb-5 flex flex-col gap-2 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">ID Pedido:</span>
                <span className="font-bold text-slate-700">{pedidoAPagar.id}</span>
              </div>
              <div className="flex justify-between border-t border-rose-100/50 pt-2">
                <span className="text-slate-500">Monto Total a Pagar:</span>
                <span className="font-black text-rose-600 font-sans text-base">S/ {pedidoAPagar.monto_total.toFixed(2)}</span>
              </div>
            </div>

            {/* Canal de Egreso Finanzas */}
            <div className="flex flex-col gap-4 mb-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Canal Financiero de Débito:</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200/50">
                  <button
                    type="button"
                    onClick={() => setMetodoPagoDeuda('efectivo')}
                    className={`py-2 text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                      metodoPagoDeuda === 'efectivo'
                        ? 'bg-white text-slate-800 shadow-sm border border-slate-200/40'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Caja Física (Efectivo)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetodoPagoDeuda('billetera_digital')}
                    className={`py-2 text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                      metodoPagoDeuda === 'billetera_digital'
                        ? 'bg-white text-slate-800 shadow-sm border border-slate-200/40'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Billetera Digital
                  </button>
                </div>
              </div>

              {/* Selector de Billetera Digital si aplica */}
              {metodoPagoDeuda === 'billetera_digital' ? (
                <div className="flex flex-col gap-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Seleccionar Billetera Digital:</label>
                  <select
                    value={cuentaPagoId}
                    onChange={(e) => setCuentaPagoId(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                  >
                    {cuentasBilletera.map((cta) => (
                      <option key={cta.id} value={cta.id}>
                        {cta.nombre} (Disponible: S/ {cta.saldo.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] text-slate-500 font-semibold leading-relaxed">
                  * El efectivo físico se retirará directamente del arqueo en vivo de la caja diaria. Asegurate de tener suficiente sencillo disponible (Disponible en caja: S/ {efectivoCajaFisica.toFixed(2)}).
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPedidoAPagar(null)}
                className="w-1/2 bg-slate-100 hover:bg-slate-200/80 py-3.5 rounded-xl font-black text-slate-600 text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              
              <button
                type="button"
                onClick={handleConfirmarPagoDeuda}
                className="w-1/2 bg-rose-600 hover:bg-rose-700 py-3.5 rounded-xl font-black text-white text-xs uppercase tracking-wider hover:brightness-105 transition-all duration-300 shadow-md shadow-rose-600/10 cursor-pointer"
              >
                Saldar y Emitir Egreso
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default InventoryManager;
