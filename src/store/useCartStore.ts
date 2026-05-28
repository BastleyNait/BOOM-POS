'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  nombre: string;
  codigo: string;
  precio_costo: number;
  precio_venta: number;
  cantidad: number;
  descuento: number;
  tipo_descuento: 'porcentaje' | 'monto';
  nota?: string;
}

export interface Cliente {
  id: string;
  nombre: string;
}

export interface TabState {
  items: CartItem[];
  cliente: Cliente | null;
  undoStack?: CartItem[][];
  redoStack?: CartItem[][];
}

export interface MockProduct {
  id: string;
  nombre: string;
  codigo: string;
  precio_costo: number;
  precio_venta: number;
  stock: number;
  proveedor_id?: string | null;
  margen_ganancia?: number;
}

export interface MockProveedor {
  id: string;
  nombre: string;
  ruc: string;
  telefono: string;
  dia_visita: string;
}

export interface MockPedido {
  id: string;
  proveedor_id: string;
  proveedor_nombre: string;
  estado: 'pendiente' | 'ordenado' | 'completado';
  estado_pago?: 'pendiente_de_pago' | 'pagado';
  monto_total: number;
  fecha: string;
  productos: {
    id: string;
    nombre: string;
    cantidad_sugerida: number;
    precio_costo: number;
  }[];
  repartidor?: string;
  fecha_solicitud?: string;
  fecha_pago_descarga?: string;
}

export interface FaltanteFresco {
  id: string;
  nombre: string;
  cantidad: string;
  notas?: string;
  comprado: boolean;
  fecha: string;
}

export interface MockMovimiento {
  id: string;
  caja_id: string;
  tipo: 'apertura' | 'cierre' | 'ingreso' | 'egreso';
  monto: number;
  motivo: string;
  fecha: string;
  metodo_pago: 'efectivo' | 'billetera_digital';
  cuenta_id: string | null; // Id de la Billetera Digital si no es efectivo
}

export interface CuentaBilletera {
  id: string;
  nombre: string;
  saldo: number;
}

export interface CierreDiario {
  id: string;
  cajaId: string;
  fechaApertura: string;
  fechaCierre: string;
  montoApertura: number;
  ventasEfectivo: number;
  ventasBilletera: number;
  egresosEfectivo: number;
  egresosBilletera: number;
  saldoFinalEfectivo: number;
  saldoFinalBilleteras: Record<string, number>;
  efectivoDeclarado: number;
  desviacion: number;
  totalNeto: number;
}

interface CartStore {
  tabs: TabState[];
  activeTabIndex: number;
  modo: 'rapido' | 'clasico';
  cajaActivaId: string | null;
  selectedCartItemIndex: number;
  
  // Base Actions
  setModo: (modo: 'rapido' | 'clasico') => void;
  setCajaActivaId: (id: string | null) => void;
  setActiveTab: (index: number) => void;
  setSelectedCartItemIndex: (index: number) => void;
  addToCart: (product: Omit<CartItem, 'cantidad' | 'descuento' | 'tipo_descuento' | 'nota'> & { cantidad?: number }) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, qty: number) => void;
  updateDiscount: (itemId: string, discount: number, type: 'porcentaje' | 'monto') => void;
  updateNote: (itemId: string, note: string) => void;
  clearActiveTab: () => void;
  undoClearActiveTab: () => void;
  redoClearActiveTab: () => void;
  getActiveTabTotal: () => { subtotal: number; descuentoTotal: number; total: number };

  // Local/Mock Database Store (Demo Mode)
  mockProducts: MockProduct[];
  mockPedidos: MockPedido[];
  mockMovimientos: MockMovimiento[];
  mockProveedores: MockProveedor[];
  cuentasBilletera: CuentaBilletera[];
  historialCierres: CierreDiario[];
  faltantesFrescos: FaltanteFresco[];

  addMockProduct: (prod: Omit<MockProduct, 'id'> & { id?: string }) => { success: boolean; error?: string };
  updateMockProduct: (prod: MockProduct) => { success: boolean; error?: string };
  addMockMovimiento: (mov: Omit<MockMovimiento, 'id' | 'fecha'>) => void;
  generateMockSugerencias: () => void;
  completeMockPedido: (pedidoId: string) => void;
  subtractStockFromActiveTab: () => void;
  
  // Acciones Premium de Flujo Multicanal & Proveedores
  agregarCuentaBilletera: (nombre: string, saldoInicial: number) => void;
  pagarPedidoProveedor: (pedidoId: string, metodoPago: 'efectivo' | 'billetera_digital', cuentaId?: string) => { success: boolean; error?: string };
  agregarMockProveedor: (prov: Omit<MockProveedor, 'id'>) => void;
  eliminarMockProveedor: (id: string) => void;
  actualizarMockProveedor: (prov: MockProveedor) => void;
  
  // Acciones de Apertura/Cierre Diario
  abrirCajaDiaria: (montoApertura: number) => { success: boolean; data?: { cajaId: string } };
  cerrarCajaDiaria: (efectivoDeclarado: number) => { success: boolean; data?: CierreDiario; error?: string };

  // Acciones de Faltantes de Frescos & Compras Manuales
  agregarFaltanteFresco: (item: Omit<FaltanteFresco, 'id' | 'comprado' | 'fecha'>) => void;
  toggleFaltanteFresco: (id: string) => void;
  eliminarFaltanteFresco: (id: string) => void;
  limpiarFaltantesFrescos: () => void;
  agregarMockPedido: (pedido: Omit<MockPedido, 'id' | 'estado' | 'estado_pago'>) => void;
}

const INITIAL_TABS: TabState[] = [
  { items: [], cliente: null, undoStack: [], redoStack: [] },
  { items: [], cliente: null, undoStack: [], redoStack: [] },
  { items: [], cliente: null, undoStack: [], redoStack: [] },
  { items: [], cliente: null, undoStack: [], redoStack: [] },
  { items: [], cliente: null, undoStack: [], redoStack: [] },
];

const INITIAL_MOCK_PRODUCTS: MockProduct[] = [
  { id: 'p1', nombre: 'Coca-Cola Sabor Original 1.5L', codigo: '7790070411314', precio_costo: 4.50, precio_venta: 6.50, stock: 15, proveedor_id: 'prov1', margen_ganancia: 44.4 },
  { id: 'p2', nombre: 'Papas Fritas Lays Clásicas 150g', codigo: '7790310000155', precio_costo: 3.50, precio_venta: 5.00, stock: 8, proveedor_id: 'prov1', margen_ganancia: 42.8 },
  { id: 'p3', nombre: 'Galletitas Oreo Original 117g', codigo: '7622300741407', precio_costo: 1.80, precio_venta: 2.50, stock: 20, proveedor_id: 'prov2', margen_ganancia: 38.9 },
  { id: 'p4', nombre: 'Cerveza Pilsen Callao Lata 473ml', codigo: '7790820000551', precio_costo: 4.00, precio_venta: 5.50, stock: 18, proveedor_id: 'prov2', margen_ganancia: 37.5 },
  { id: 'p5', nombre: 'Jabón Dove Original 90g', codigo: '7891150028227', precio_costo: 3.20, precio_venta: 4.50, stock: 10, proveedor_id: 'prov3', margen_ganancia: 40.6 },
  { id: 'p6', nombre: 'Leche Evaporada Gloria Azul 400g', codigo: '7790080012013', precio_costo: 3.50, precio_venta: 4.80, stock: 25, proveedor_id: 'prov1', margen_ganancia: 37.1 },
  { id: 'p7', nombre: 'Chocolate Sublime Extragrande 100g', codigo: '7622300840506', precio_costo: 2.80, precio_venta: 4.00, stock: 15, proveedor_id: 'prov3', margen_ganancia: 42.8 }
];

const INITIAL_MOCK_PROVIDERS: MockProveedor[] = [
  { id: 'prov1', nombre: 'Distribuidora San Ignacio S.A.C. (Gloria/Coca-Cola)', ruc: '20546789123', telefono: '987654321', dia_visita: 'Lunes' },
  { id: 'prov2', nombre: 'Unión de Cervecerías Peruanas Backus y Johnston', ruc: '20100143890', telefono: '016111000', dia_visita: 'Miércoles' },
  { id: 'prov3', nombre: 'Nestlé Perú S.A.', ruc: '20100166598', telefono: '080010210', dia_visita: 'Viernes' }
];

const INITIAL_CUENTAS_BILLETERA: CuentaBilletera[] = [
  { id: 'yape-bcp', nombre: 'Yape - BCP', saldo: 150.00 },
  { id: 'plin-bbva', nombre: 'Plin - BBVA', saldo: 80.00 }
];

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      tabs: INITIAL_TABS,
      activeTabIndex: 0,
      modo: 'rapido',
      cajaActivaId: null,
      selectedCartItemIndex: -1,
      
      // Local Mock DB Lists
      mockProducts: INITIAL_MOCK_PRODUCTS,
      mockPedidos: [],
      mockMovimientos: [],
      mockProveedores: INITIAL_MOCK_PROVIDERS,
      cuentasBilletera: INITIAL_CUENTAS_BILLETERA,
      historialCierres: [],
      faltantesFrescos: [],

      setModo: (modo) => set({ modo }),
      
      setCajaActivaId: (cajaActivaId) => set({ cajaActivaId }),
      
      setActiveTab: (activeTabIndex) => set({ activeTabIndex, selectedCartItemIndex: -1 }),
      
      setSelectedCartItemIndex: (selectedCartItemIndex) => set({ selectedCartItemIndex }),
      
      addToCart: (product) => set((state) => {
        const newTabs = [...state.tabs];
        const activeTab = { ...newTabs[state.activeTabIndex] };
        
        // Soporte para códigos repetidos pero con diferentes cantidades/pesos
        const existingItemIndex = activeTab.items.findIndex((item) => item.id === product.id);
        const cantidadAAgregar = Number(product.cantidad) || 1;

        if (existingItemIndex > -1) {
          const updatedItem = {
            ...activeTab.items[existingItemIndex],
            cantidad: Number((activeTab.items[existingItemIndex].cantidad + cantidadAAgregar).toFixed(3)),
          };
          const newItems = [...activeTab.items];
          newItems.splice(existingItemIndex, 1);
          activeTab.items = [updatedItem, ...newItems];
        } else {
          activeTab.items = [
            {
              ...product,
              cantidad: cantidadAAgregar,
              descuento: 0,
              tipo_descuento: 'porcentaje' as const,
              nota: '',
            },
            ...activeTab.items,
          ];
        }

        newTabs[state.activeTabIndex] = activeTab;
        return { tabs: newTabs };
      }),

      removeFromCart: (itemId) => set((state) => {
        const newTabs = [...state.tabs];
        const activeTab = { ...newTabs[state.activeTabIndex] };
        activeTab.items = activeTab.items.filter((item) => item.id !== itemId);
        newTabs[state.activeTabIndex] = activeTab;
        return { tabs: newTabs };
      }),

      updateQuantity: (itemId, qty) => set((state) => {
        const newTabs = [...state.tabs];
        const activeTab = { ...newTabs[state.activeTabIndex] };
        activeTab.items = activeTab.items.map((item) => {
          if (item.id === itemId) {
            return { ...item, cantidad: Math.max(1, qty) };
          }
          return item;
        });
        newTabs[state.activeTabIndex] = activeTab;
        return { tabs: newTabs };
      }),

      updateDiscount: (itemId, discount, type) => set((state) => {
        const newTabs = [...state.tabs];
        const activeTab = { ...newTabs[state.activeTabIndex] };
        activeTab.items = activeTab.items.map((item) => {
          if (item.id === itemId) {
            return { ...item, descuento: Math.max(0, discount), tipo_descuento: type };
          }
          return item;
        });
        newTabs[state.activeTabIndex] = activeTab;
        return { tabs: newTabs };
      }),

      updateNote: (itemId, note) => set((state) => {
        const newTabs = [...state.tabs];
        const activeTab = { ...newTabs[state.activeTabIndex] };
        activeTab.items = activeTab.items.map((item) => {
          if (item.id === itemId) {
            return { ...item, nota: note };
          }
          return item;
        });
        newTabs[state.activeTabIndex] = activeTab;
        return { tabs: newTabs };
      }),

      clearActiveTab: () => set((state) => {
        const newTabs = [...state.tabs];
        const currentTab = newTabs[state.activeTabIndex];
        newTabs[state.activeTabIndex] = { 
          ...currentTab, 
          items: [], 
          cliente: null,
          undoStack: [...(currentTab.undoStack || []), currentTab.items],
          redoStack: [] // Clear redo stack on new action
        };
        return { tabs: newTabs, selectedCartItemIndex: -1 };
      }),

      undoClearActiveTab: () => set((state) => {
        const newTabs = [...state.tabs];
        const currentTab = newTabs[state.activeTabIndex];
        const undoStack = currentTab.undoStack || [];
        
        if (undoStack.length === 0) return state; // Nothing to undo
        
        const previousItems = undoStack[undoStack.length - 1];
        const newUndoStack = undoStack.slice(0, -1);
        
        newTabs[state.activeTabIndex] = {
          ...currentTab,
          items: previousItems,
          undoStack: newUndoStack,
          redoStack: [...(currentTab.redoStack || []), currentTab.items]
        };
        
        return { tabs: newTabs };
      }),

      redoClearActiveTab: () => set((state) => {
        const newTabs = [...state.tabs];
        const currentTab = newTabs[state.activeTabIndex];
        const redoStack = currentTab.redoStack || [];
        
        if (redoStack.length === 0) return state; // Nothing to redo
        
        const nextItems = redoStack[redoStack.length - 1];
        const newRedoStack = redoStack.slice(0, -1);
        
        newTabs[state.activeTabIndex] = {
          ...currentTab,
          items: nextItems,
          undoStack: [...(currentTab.undoStack || []), currentTab.items],
          redoStack: newRedoStack
        };
        
        return { tabs: newTabs };
      }),

      getActiveTabTotal: () => {
        const state = get();
        const activeTab = state.tabs[state.activeTabIndex];
        if (!activeTab || !activeTab.items) {
          return { subtotal: 0, descuentoTotal: 0, total: 0 };
        }

        let subtotal = 0;
        let descuentoTotal = 0;

        activeTab.items.forEach((item) => {
          const itemSubtotal = item.precio_venta * item.cantidad;
          let itemDescuento = 0;
          if (item.descuento > 0) {
            itemDescuento = item.tipo_descuento === 'porcentaje'
              ? itemSubtotal * (item.descuento / 100)
              : item.descuento * item.cantidad;
          }
          subtotal += itemSubtotal;
          descuentoTotal += itemDescuento;
        });

        const total = Math.max(0, subtotal - descuentoTotal);
        return { subtotal, descuentoTotal, total };
      },

      // Mock DB Actions
      addMockProduct: (prod) => {
        const state = get();
        
        // Verificar duplicados por código
        const duplicadoCod = state.mockProducts.find(
          p => p.codigo.trim() === prod.codigo.trim()
        );
        if (duplicadoCod) {
          return { success: false, error: 'Código de barras ya existe en el inventario, hermano.' };
        }

        // Verificar duplicados por nombre
        const duplicadoNom = state.mockProducts.find(
          p => p.nombre.toLowerCase().trim() === prod.nombre.toLowerCase().trim()
        );
        if (duplicadoNom) {
          return { success: false, error: 'Ya existe un producto registrado con ese mismo nombre.' };
        }

        const newId = prod.id || 'p' + (state.mockProducts.length + 1) + '-' + Math.random().toString(36).substring(2, 5);
        
        let finalVenta = Number(prod.precio_venta) || 0;
        if (finalVenta <= 0) {
          finalVenta = Math.round(Number(prod.precio_costo) * 1.3);
        }

        const newProduct: MockProduct = {
          ...prod,
          id: newId,
          precio_venta: finalVenta,
          margen_ganancia: prod.margen_ganancia || 30
        };

        set({
          mockProducts: [...state.mockProducts, newProduct]
        });

        return { success: true };
      },

      updateMockProduct: (updatedProd) => {
        const state = get();
        
        // Verificar duplicados excluyendo el id actual
        const duplicadoCod = state.mockProducts.find(
          p => p.codigo.trim() === updatedProd.codigo.trim() && p.id !== updatedProd.id
        );
        if (duplicadoCod) {
          return { success: false, error: 'Código de barras ya existe en el inventario para otro producto.' };
        }

        const duplicadoNom = state.mockProducts.find(
          p => p.nombre.toLowerCase().trim() === updatedProd.nombre.toLowerCase().trim() && p.id !== updatedProd.id
        );
        if (duplicadoNom) {
          return { success: false, error: 'Ya existe otro producto registrado con ese mismo nombre.' };
        }

        let finalVenta = Number(updatedProd.precio_venta) || 0;
        if (finalVenta <= 0) {
          finalVenta = Math.round(Number(updatedProd.precio_costo) * 1.3);
        }

        const updatedProducts = state.mockProducts.map((p) => 
          p.id === updatedProd.id ? { ...updatedProd, precio_venta: finalVenta } : p
        );

        set({ mockProducts: updatedProducts });
        return { success: true };
      },

      addMockMovimiento: (mov) => set((state) => {
        const newMov: MockMovimiento = {
          ...mov,
          id: 'mov-' + Math.random().toString(36).substring(2, 9),
          fecha: new Date().toISOString()
        };

        let nuevasCuentas = [...state.cuentasBilletera];
        if (mov.metodo_pago === 'billetera_digital' && mov.cuenta_id) {
          nuevasCuentas = state.cuentasBilletera.map((cta) => {
            if (cta.id === mov.cuenta_id) {
              const delta = mov.tipo === 'ingreso' || mov.tipo === 'apertura' ? mov.monto : -mov.monto;
              return { ...cta, saldo: Math.max(0, cta.saldo + delta) };
            }
            return cta;
          });
        }

        return {
          mockMovimientos: [...state.mockMovimientos, newMov],
          cuentasBilletera: nuevasCuentas
        };
      }),

      generateMockSugerencias: () => set((state) => {
        const criticalProds = state.mockProducts.filter((p) => p.stock < 5 && p.proveedor_id);
        if (criticalProds.length === 0) return {};

        // Agrupar por proveedor
        const groups: Record<string, typeof criticalProds> = {};
        criticalProds.forEach((p) => {
          const provId = p.proveedor_id!;
          if (!groups[provId]) groups[provId] = [];
          groups[provId].push(p);
        });

        const newPedidos: MockPedido[] = Object.keys(groups).map((provId) => {
          const prods = groups[provId];
          const provObj = state.mockProveedores.find((p) => p.id === provId);
          const provNombre = provObj ? provObj.nombre : 'Proveedor Desconocido';
          
          const pedidoProds = prods.map((p) => ({
            id: p.id,
            nombre: p.nombre,
            cantidad_sugerida: Math.max(1, 20 - p.stock),
            precio_costo: p.precio_costo
          }));

          const total = pedidoProds.reduce((sum, item) => sum + (item.cantidad_sugerida * item.precio_costo), 0);

          return {
            id: 'ped-' + Math.random().toString(36).substring(2, 9),
            proveedor_id: provId,
            proveedor_nombre: provNombre,
            estado: 'pendiente',
            estado_pago: 'pendiente_de_pago',
            monto_total: total,
            fecha: new Date().toLocaleDateString(),
            productos: pedidoProds
          };
        });

        return {
          mockPedidos: [...state.mockPedidos, ...newPedidos]
        };
      }),

      completeMockPedido: (pedidoId) => set((state) => {
        const targetPedido = state.mockPedidos.find((p) => p.id === pedidoId);
        if (!targetPedido || targetPedido.estado === 'completado') return {};

        const updatedPedidos = state.mockPedidos.map((p) => 
          p.id === pedidoId ? { ...p, estado: 'completado' as const, estado_pago: 'pendiente_de_pago' as const } : p
        );

        const updatedProducts = state.mockProducts.map((prod) => {
          const itemPedido = targetPedido.productos.find((item) => item.id === prod.id);
          if (itemPedido) {
            return {
              ...prod,
              stock: prod.stock + itemPedido.cantidad_sugerida
            };
          }
          return prod;
        });

        return {
          mockPedidos: updatedPedidos,
          mockProducts: updatedProducts
        };
      }),

      subtractStockFromActiveTab: () => set((state) => {
        const activeTab = state.tabs[state.activeTabIndex];
        if (!activeTab || activeTab.items.length === 0) return {};

        const updatedProducts = state.mockProducts.map((prod) => {
          const itemCart = activeTab.items.find((item) => item.id === prod.id);
          if (itemCart) {
            return {
              ...prod,
              stock: Math.max(0, prod.stock - itemCart.cantidad)
            };
          }
          return prod;
        });

        return {
          mockProducts: updatedProducts
        };
      }),

      agregarCuentaBilletera: (nombre, saldoInicial) => set((state) => {
        const id = nombre.toLowerCase().trim().replace(/\s+/g, '-').normalize("NFD").replace(/[\u0300-\u036f]/g, "") + '-' + Math.random().toString(36).substring(2, 5);
        const nueva: CuentaBilletera = { id, nombre, saldo: Number(saldoInicial) || 0 };
        return {
          cuentasBilletera: [...state.cuentasBilletera, nueva]
        };
      }),

      pagarPedidoProveedor: (pedidoId, metodoPago, cuentaId) => {
        const state = get();
        const ped = state.mockPedidos.find(p => p.id === pedidoId);
        if (!ped) return { success: false, error: 'No se encontró el pedido sugerido en el sistema.' };
        if (ped.estado_pago === 'pagado') return { success: false, error: 'Este pedido ya fue pagado anteriormente.' };

        if (metodoPago === 'billetera_digital') {
          if (!cuentaId) return { success: false, error: 'Por favor, seleccioná una cuenta o billetera digital de destino.' };
          const cta = state.cuentasBilletera.find(c => c.id === cuentaId);
          if (!cta) return { success: false, error: 'Billetera digital no encontrada en el sistema.' };
          if (cta.saldo < ped.monto_total) {
            return { success: false, error: `Saldo insuficiente en ${cta.nombre}. Saldo disponible: S/ ${cta.saldo.toFixed(2)}. Deuda: S/ ${ped.monto_total.toFixed(2)}.` };
          }
        }

        if (metodoPago === 'efectivo') {
          if (!state.cajaActivaId) {
            return { success: false, error: 'No hay una caja diaria activa para extraer efectivo físico.' };
          }
        }

        state.addMockMovimiento({
          caja_id: state.cajaActivaId || 'caja-global',
          tipo: 'egreso',
          monto: ped.monto_total,
          motivo: `Pago a Proveedor: ${ped.proveedor_nombre} (Pedido ${ped.id})`,
          metodo_pago: metodoPago,
          cuenta_id: cuentaId || null
        });

        const updatedPedidos = state.mockPedidos.map((p) => 
          p.id === pedidoId ? { ...p, estado_pago: 'pagado' as const } : p
        );

        set({ mockPedidos: updatedPedidos });
        return { success: true };
      },

      agregarMockProveedor: (prov) => set((state) => {
        const id = 'prov-' + Math.random().toString(36).substring(2, 9);
        const nuevo: MockProveedor = { ...prov, id };
        return {
          mockProveedores: [...state.mockProveedores, nuevo]
        };
      }),

      eliminarMockProveedor: (id) => set((state) => ({
        mockProveedores: state.mockProveedores.filter(p => p.id !== id)
      })),

      actualizarMockProveedor: (prov) => set((state) => ({
        mockProveedores: state.mockProveedores.map(p => p.id === prov.id ? prov : p)
      })),

      abrirCajaDiaria: (montoApertura) => {
        const state = get();
        const newCajaId = 'caja-mock-' + Math.random().toString(36).substring(2, 11);
        
        // Resetear billeteras digitales a 0 al abrir una nueva caja
        const cuentasCero = state.cuentasBilletera.map(c => ({ ...c, saldo: 0 }));

        set({
          cajaActivaId: newCajaId,
          cuentasBilletera: cuentasCero,
        });

        // Registrar movimiento de apertura
        get().addMockMovimiento({
          caja_id: newCajaId,
          tipo: 'apertura',
          monto: montoApertura,
          motivo: 'Apertura de caja diaria (Modo Demo)',
          metodo_pago: 'efectivo',
          cuenta_id: null
        });

        return { success: true, data: { cajaId: newCajaId } };
      },

      cerrarCajaDiaria: (efectivoDeclarado) => {
        const state = get();
        if (!state.cajaActivaId) return { success: false, error: 'No hay ninguna caja abierta.' };

        const cajaId = state.cajaActivaId;
        const movimientos = state.mockMovimientos.filter(m => m.caja_id === cajaId);

        // Calcular flujos
        const montoApertura = movimientos
          .filter(m => m.tipo === 'apertura')
          .reduce((sum, m) => sum + m.monto, 0);

        const ventasEfectivo = movimientos
          .filter(m => m.tipo === 'ingreso' && m.metodo_pago === 'efectivo')
          .reduce((sum, m) => sum + m.monto, 0);

        const ventasBilletera = movimientos
          .filter(m => m.tipo === 'ingreso' && m.metodo_pago === 'billetera_digital')
          .reduce((sum, m) => sum + m.monto, 0);

        const egresosEfectivo = movimientos
          .filter(m => m.tipo === 'egreso' && m.metodo_pago === 'efectivo')
          .reduce((sum, m) => sum + m.monto, 0);

        const egresosBilletera = movimientos
          .filter(m => m.tipo === 'egreso' && m.metodo_pago === 'billetera_digital')
          .reduce((sum, m) => sum + m.monto, 0);

        const saldoFinalEfectivo = montoApertura + ventasEfectivo - egresosEfectivo;

        const saldoFinalBilleteras: Record<string, number> = {};
        state.cuentasBilletera.forEach(c => {
          saldoFinalBilleteras[c.id] = c.saldo;
        });

        const totalNeto = saldoFinalEfectivo + Object.values(saldoFinalBilleteras).reduce((sum, s) => sum + s, 0);

        const desviacion = efectivoDeclarado - saldoFinalEfectivo;

        const nuevoCierre: CierreDiario = {
          id: 'cierre-' + Math.random().toString(36).substring(2, 11),
          cajaId,
          fechaApertura: movimientos.find(m => m.tipo === 'apertura')?.fecha || new Date().toISOString(),
          fechaCierre: new Date().toISOString(),
          montoApertura,
          ventasEfectivo,
          ventasBilletera,
          egresosEfectivo,
          egresosBilletera,
          saldoFinalEfectivo,
          saldoFinalBilleteras,
          efectivoDeclarado,
          desviacion,
          totalNeto
        };

        // Agregar movimiento de cierre
        get().addMockMovimiento({
          caja_id: cajaId,
          tipo: 'cierre',
          monto: efectivoDeclarado,
          motivo: `Cierre de caja. Declarado: S/ ${efectivoDeclarado.toFixed(2)}. Esperado: S/ ${saldoFinalEfectivo.toFixed(2)}.`,
          metodo_pago: 'efectivo',
          cuenta_id: null
        });

        // Guardar cierre, cerrar caja y vaciar billeteras
        const cuentasCierreCero = state.cuentasBilletera.map(c => ({ ...c, saldo: 0 }));

        set({
          cajaActivaId: null,
          cuentasBilletera: cuentasCierreCero,
          historialCierres: [nuevoCierre, ...state.historialCierres]
        });

        return { success: true, data: nuevoCierre };
      },

      agregarFaltanteFresco: (item) => set((state) => {
        const id = 'fresco-' + Math.random().toString(36).substring(2, 9);
        const nuevo: FaltanteFresco = {
          ...item,
          id,
          comprado: false,
          fecha: new Date().toLocaleDateString()
        };
        return {
          faltantesFrescos: [...state.faltantesFrescos, nuevo]
        };
      }),

      toggleFaltanteFresco: (id) => set((state) => ({
        faltantesFrescos: state.faltantesFrescos.map(f => f.id === id ? { ...f, comprado: !f.comprado } : f)
      })),

      eliminarFaltanteFresco: (id) => set((state) => ({
        faltantesFrescos: state.faltantesFrescos.filter(f => f.id !== id)
      })),

      limpiarFaltantesFrescos: () => set({
        faltantesFrescos: []
      }),

      agregarMockPedido: (pedido) => set((state) => {
        const id = 'ped-manual-' + Math.random().toString(36).substring(2, 9);
        const nuevo: MockPedido = {
          ...pedido,
          id,
          estado: 'pendiente',
          estado_pago: 'pendiente_de_pago'
        };
        return {
          mockPedidos: [...state.mockPedidos, nuevo]
        };
      }),
    }),
    {
      name: 'boom-pos-cart-storage',
      skipHydration: true,
    }
  )
);
