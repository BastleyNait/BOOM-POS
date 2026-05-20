'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCartStore, MockProduct, MockProveedor, MockPedido } from '../../store/useCartStore';

export function InventoryManager() {
  // Pestaña Activa: 'productos' | 'compras' | 'proveedores'
  const [activeTab, setActiveTab] = useState<'productos' | 'compras' | 'proveedores'>('productos');

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
    mockMovimientos
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

  // Sincronizar el primer id de cuenta digital para el pago de deudas
  useEffect(() => {
    if (cuentasBilletera.length > 0 && !cuentaPagoId) {
      setCuentaPagoId(cuentasBilletera[0].id);
    }
  }, [cuentasBilletera, cuentaPagoId]);

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
      alert('Ya existe un producto con ese RUC/Código/Nombre. Resolvelo en el modal premium, hermano.');
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
      alert(`Error al guardar: ${res.error}`);
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
      alert('Ingresá una cantidad válida de stock mayor a cero, loco.');
      return;
    }

    const actualizado: MockProduct = {
      ...prod,
      stock: prod.stock + adicional
    };

    const res = updateMockProduct(actualizado);
    if (res.success) {
      alert(`¡Buenísimo! Se consolidaron ${adicional} unidades al producto '${prod.nombre}'. Nuevo stock: ${actualizado.stock}.`);
      handleResetForm();
      setStockAConsolidar('');
    } else {
      alert(`Error al consolidar: ${res.error}`);
    }
  };

  // ----------------------------------------------------
  // ACCIONES PROVEEDORES CRUD (Pestaña 3)
  // ----------------------------------------------------
  const handleSaveProveedor = (e: React.FormEvent) => {
    e.preventDefault();

    if (!provNombre.trim() || !provRuc.trim()) {
      alert('Completá Nombre y RUC del proveedor.');
      return;
    }

    // Validación básica de RUC peruano (11 dígitos)
    if (!/^\d{11}$/.test(provRuc)) {
      alert('El RUC debe tener exactamente 11 dígitos numéricos, ponete las pilas.');
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
      alert('Elegí una billetera digital para realizar el débito.');
      return;
    }

    const res = pagarPedidoProveedor(pedidoAPagar.id, metodoPagoDeuda, cuentaPagoId);
    if (res.success) {
      const ctaObj = cuentasBilletera.find(c => c.id === cuentaPagoId);
      const ctaNombre = ctaObj ? ctaObj.nombre : 'Billetera Digital';
      alert(`Deuda pagada correctamente de forma atómica. Canal de Egreso: ${metodoPagoDeuda === 'efectivo' ? 'Efectivo en Caja' : ctaNombre}. Monto liquidado: S/ ${pedidoAPagar.monto_total.toFixed(2)}.`);
      setPedidoAPagar(null);
    } else {
      alert(`Error al saldar la deuda: ${res.error}`);
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
    <div className="flex h-screen bg-slate-50 text-slate-800 p-6 gap-6 font-sans antialiased overflow-hidden">
      
      {/* Columna Izquierda: Panel de Trabajo e Indicadores Financieros */}
      <div className="flex flex-1 flex-col gap-5 overflow-hidden">
        
        {/* Encabezado Principal */}
        <header className="flex w-full items-center justify-between border-b border-slate-200/80 pb-4 flex-shrink-0">
          <div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent tracking-tight leading-none">
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
              💵 IR A CAJA / POS
            </Link>

            {/* Menú de Pestañas Premium */}
            <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 shadow-inner">
            <button
              onClick={() => setActiveTab('productos')}
              className={`px-4 py-2 text-xs font-black rounded-xl transition-all duration-300 cursor-pointer ${
                activeTab === 'productos' 
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/10' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              📦 STOCK E INVENTARIO
            </button>
            <button
              onClick={() => setActiveTab('compras')}
              className={`px-4 py-2 text-xs font-black rounded-xl transition-all duration-300 cursor-pointer relative ${
                activeTab === 'compras' 
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/10' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              🚚 COMPRAS Y DEUDAS
              {deudasPendientes > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[8px] font-black text-white animate-bounce">
                  !
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('proveedores')}
              className={`px-4 py-2 text-xs font-black rounded-xl transition-all duration-300 cursor-pointer ${
                activeTab === 'proveedores' 
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/10' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              👤 PROVEEDORES
            </button>
          </div>
        </div>
      </header>

        {/* -------------------------------------------------------------------------
            CONTENIDO PESTAÑA: STOCK E INVENTARIO
            ------------------------------------------------------------------------- */}
        {activeTab === 'productos' && (
          <div className="flex-1 overflow-hidden bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm flex flex-col">
            <h2 className="text-sm font-bold text-slate-700 mb-4 flex justify-between items-center">
              <span>Listado de Stock Físico</span>
              <span className="text-xs bg-slate-100 text-slate-600 border border-slate-200/50 px-2.5 py-0.5 rounded-full font-black">
                {mockProducts.length} Productos
              </span>
            </h2>

            <div className="flex-1 overflow-y-auto pr-1">
              <table className="w-full border-collapse text-left text-sm text-slate-600">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <th className="pb-3 font-extrabold">Producto</th>
                    <th className="pb-3 font-extrabold">Código</th>
                    <th className="pb-3 text-right font-extrabold">Costo</th>
                    <th className="pb-3 text-right font-extrabold">Venta</th>
                    <th className="pb-3 text-right font-extrabold">Margen %</th>
                    <th className="pb-3 text-right font-extrabold">Stock</th>
                    <th className="pb-3 text-center font-extrabold">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {mockProducts.map((prod) => {
                    const isLow = prod.stock < 5;
                    const provObj = mockProveedores.find(p => p.id === prod.proveedor_id);
                    const margenImpl = prod.precio_costo > 0 ? (((prod.precio_venta / prod.precio_costo) - 1) * 100) : 0;
                    
                    return (
                      <tr key={prod.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 font-sans font-bold text-slate-800">
                          {prod.nombre}
                          {provObj && (
                            <span className="block text-[10px] text-emerald-600 font-sans font-normal mt-0.5">
                              Visita: {provObj.dia_visita} ({provObj.nombre})
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 text-xs text-slate-400">{prod.codigo}</td>
                        <td className="py-3.5 text-right text-slate-600">S/ {prod.precio_costo.toFixed(2)}</td>
                        <td className="py-3.5 text-right text-emerald-600 font-bold">S/ {prod.precio_venta.toFixed(2)}</td>
                        <td className="py-3.5 text-right text-indigo-600 font-extrabold">{margenImpl.toFixed(1)}%</td>
                        <td className={`py-3.5 text-right font-black ${isLow ? 'text-rose-600 font-extrabold' : 'text-slate-800'}`}>
                          {prod.stock} {isLow && '⚠️'}
                        </td>
                        <td className="py-3.5 text-center">
                          <button
                            onClick={() => handleEditProductClick(prod)}
                            className="px-3 py-1.5 text-[10px] rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-black text-slate-500 uppercase tracking-wider transition-all cursor-pointer shadow-sm"
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
              <button
                onClick={() => {
                  generateMockSugerencias();
                  alert('Sugerencias recalculadas en base al stock crítico de productos (< 5 unidades).');
                }}
                className="px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:brightness-105 transition-all shadow-md shadow-emerald-600/10 cursor-pointer"
              >
                Recalcular Pedidos
              </button>
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
                            'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {ped.estado}
                          </span>

                          {ped.estado === 'completado' && (
                            <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase border ${
                              ped.estado_pago === 'pagado'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                : 'bg-rose-100 text-rose-800 border-rose-200 animate-pulse'
                            }`}>
                              {ped.estado_pago === 'pagado' ? 'PAGADO' : 'POR PAGAR'}
                            </span>
                          )}
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
                          )}
                          <button
                            onClick={() => {
                              completeMockPedido(ped.id);
                              alert('Mercadería recibida. Se actualizó el stock físico del inventario.');
                            }}
                            className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[9px] uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                          >
                            Recibir Mercadería ✓
                          </button>
                        </div>
                      )}

                      {/* Botón premium de Liquidación de Deudas */}
                      {tieneDeuda && (
                        <button
                          onClick={() => setPedidoAPagar(ped)}
                          className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-[9px] uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-rose-600/10"
                        >
                          💸 Liquidar Deuda con Proveedor
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
            ------------------------------------------------------------------------- */}
        {activeTab === 'proveedores' && (
          <div className="flex-1 overflow-hidden bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm flex flex-col">
            <h2 className="text-sm font-bold text-slate-700 mb-4 flex justify-between items-center">
              <span>Listado de Proveedores Registrados</span>
              <span className="text-xs bg-slate-100 text-slate-600 border border-slate-200/50 px-2.5 py-0.5 rounded-full font-black">
                {mockProveedores.length} Proveedores
              </span>
            </h2>

            <div className="flex-1 overflow-y-auto pr-1">
              <table className="w-full border-collapse text-left text-sm text-slate-600">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <th className="pb-3 font-extrabold">Nombre</th>
                    <th className="pb-3 font-extrabold">RUC</th>
                    <th className="pb-3 font-extrabold">Teléfono</th>
                    <th className="pb-3 font-extrabold">Día de Visita</th>
                    <th className="pb-3 text-center font-extrabold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {mockProveedores.map((prov) => (
                    <tr key={prov.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 font-sans font-bold text-slate-800">{prov.nombre}</td>
                      <td className="py-3.5 text-xs text-slate-500">{prov.ruc}</td>
                      <td className="py-3.5 text-xs text-slate-500">{prov.telefono}</td>
                      <td className="py-3.5 font-sans text-xs text-teal-700 font-extrabold uppercase">{prov.dia_visita}</td>
                      <td className="py-3.5 text-center flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleEditProveedorClick(prov)}
                          className="px-2.5 py-1.5 text-[9px] rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-black text-slate-500 uppercase tracking-wider transition-all cursor-pointer"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('¿Eliminás este proveedor? Se desvinculará de los productos asociados.')) {
                              eliminarMockProveedor(prov.id);
                            }
                          }}
                          className="px-2.5 py-1.5 text-[9px] rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 font-black text-rose-700 uppercase tracking-wider transition-all cursor-pointer"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Columna Derecha: Formulario Contextual */}
      <div className="w-[420px] flex flex-col gap-5 overflow-hidden flex-shrink-0">

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
              <span className="text-lg font-black font-mono text-emerald-600 mt-1">S/ {cuentasBilletera.reduce((sum, c) => sum + c.saldo, 0).toFixed(2)}</span>
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
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-sm"
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
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-sm font-mono"
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
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-sm font-mono"
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
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-sm font-mono"
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
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-sm font-mono"
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
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-sm font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Proveedor:</label>
                  <select
                    value={proveedorId}
                    onChange={(e) => setProveedorId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-bold text-slate-700 focus:border-emerald-500 focus:bg-white transition-all outline-none shadow-sm cursor-pointer"
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
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:brightness-105 active:scale-95 shadow-md shadow-emerald-600/10'
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
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-sm"
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
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-sm font-mono"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Teléfono de contacto:</label>
                <input
                  type="text"
                  value={provTelefono}
                  onChange={(e) => setProvTelefono(e.target.value)}
                  placeholder="Ej. 987654321"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-sm font-mono"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Día Programado de Visita:</label>
                <select
                  value={provDiaVisita}
                  onChange={(e) => setProvDiaVisita(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-bold text-slate-700 focus:border-emerald-500 focus:bg-white transition-all outline-none shadow-sm cursor-pointer"
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
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-xs uppercase tracking-wider hover:brightness-105 active:scale-95 shadow-md shadow-emerald-600/10 cursor-pointer"
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
            <svg className="h-10 w-10 text-emerald-600/80 mb-2 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Flujo de Caja Digital</h3>
            <p className="text-[11px] text-slate-400 font-semibold px-4 leading-relaxed">
              Toda egresión física o transferencia digital a proveedores disminuye de forma atómica tus balances generales. Sincronización instantánea con arqueo de Caja en vivo.
            </p>
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
              <span className="text-2xl">⚠️</span>
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
                  className="w-1/2 rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleConsolidarStock}
                  className="w-1/2 bg-emerald-600 hover:bg-emerald-700 py-2.5 rounded-xl font-black text-white text-[10px] uppercase tracking-wider transition-all cursor-pointer shadow-sm shadow-emerald-600/10"
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
                    className={`py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                      metodoPagoDeuda === 'efectivo'
                        ? 'bg-white text-slate-800 shadow-sm border border-slate-200/40'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    💵 Caja Física (Efectivo)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetodoPagoDeuda('billetera_digital')}
                    className={`py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                      metodoPagoDeuda === 'billetera_digital'
                        ? 'bg-white text-slate-800 shadow-sm border border-slate-200/40'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    📱 Billetera Digital
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
