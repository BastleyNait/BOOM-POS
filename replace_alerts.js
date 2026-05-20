const fs = require('fs');
const path = require('path');

const replacements = [
  { file: 'src/components/pos/CashRegister.tsx', search: "alert('¡El carrito está vacío! Agregá productos antes de cobrar, hermano.');", replace: "addToast('El carrito está vacío. Agregue productos antes de proceder al cobro.', 'warning');" },
  { file: 'src/components/pos/CashRegister.tsx', search: "alert('La caja del día está cerrada. Abrí la caja antes de registrar ventas, loco.');", replace: "addToast('La caja diaria está cerrada. Por favor, realice la apertura de caja antes de registrar ventas.', 'error');" },
  { file: 'src/components/pos/CashRegister.tsx', search: "alert('Por favor, seleccioná una cuenta o billetera digital para recibir el cobro.');", replace: "addToast('Por favor, seleccione una cuenta o billetera digital para recibir el cobro.', 'warning');" },
  { file: 'src/components/pos/CashRegister.tsx', search: "alert('El monto ingresado es menor al total a cobrar, ponete las pilas.');", replace: "addToast('El monto ingresado es insuficiente para cubrir el total a cobrar.', 'error');" },
  { file: 'src/components/pos/CashRegister.tsx', search: "alert(`Error al procesar: ${res.error}`);", replace: "addToast(`Error al procesar la venta: ${res.error}`, 'error');" },
  { file: 'src/components/pos/CashRegister.tsx', search: "alert('Error inesperado al intentar facturar.');", replace: "addToast('Error inesperado al intentar facturar.', 'error');" },
  { file: 'src/components/pos/CashRegister.tsx', search: "alert('Ingresá un monto de apertura válido.');", replace: "addToast('Por favor, ingrese un monto de apertura válido.', 'warning');" },
  { file: 'src/components/pos/CashRegister.tsx', search: "alert(`Error al abrir caja: ${res.error}`);", replace: "addToast(`Error al abrir la caja: ${res.error}`, 'error');" },
  { file: 'src/components/pos/CashRegister.tsx', search: "alert('Error de conexión al abrir la caja diaria.');", replace: "addToast('Error de conexión al abrir la caja diaria.', 'error');" },
  { file: 'src/components/pos/CashRegister.tsx', search: "alert('Por favor, ingresá un precio o monto válido, loco.');", replace: "addToast('Por favor, ingrese un precio o monto numérico válido.', 'warning');" },
  { file: 'src/components/pos/CashRegister.tsx', search: "alert('Por favor, ingresá un monto de efectivo real auditado.');", replace: "addToast('Por favor, ingrese un monto de efectivo validado.', 'warning');" },
  { file: 'src/components/pos/CashRegister.tsx', search: "alert(`Error en el cierre: ${res.error}`);", replace: "addToast(`Error durante el cierre de caja: ${res.error}`, 'error');" },
  { file: 'src/components/pos/CashRegister.tsx', search: "alert('Por favor, ingresá un nombre para la billetera digital.');", replace: "addToast('Por favor, ingrese un nombre para la billetera digital.', 'warning');" },
  { file: 'src/components/pos/CashRegister.tsx', search: "window.confirm('¿Seguro que querés vaciar el carrito?');", replace: "window.confirm('¿Está seguro que desea vaciar el carrito de compras?');" },

  { file: 'src/components/inventario/InventoryManager.tsx', search: "alert('Ya existe un producto con ese RUC/Código/Nombre. Resolvelo en el modal premium, hermano.');", replace: "addToast('Ya existe un producto con ese RUC/Código/Nombre.', 'warning');" },
  { file: 'src/components/inventario/InventoryManager.tsx', search: "alert(`Error al guardar: ${res.error}`);", replace: "addToast(`Error al guardar: ${res.error}`, 'error');" },
  { file: 'src/components/inventario/InventoryManager.tsx', search: "alert('Ingresá una cantidad válida de stock mayor a cero, loco.');", replace: "addToast('Ingrese una cantidad válida de stock mayor a cero.', 'warning');" },
  { file: 'src/components/inventario/InventoryManager.tsx', search: "alert(`¡Buenísimo! Se consolidaron ${adicional} unidades al producto '${prod.nombre}'. Nuevo stock: ${actualizado.stock}.`);", replace: "addToast(`Se consolidaron ${adicional} unidades al producto '${prod.nombre}'. Nuevo stock: ${actualizado.stock}.`, 'success');" },
  { file: 'src/components/inventario/InventoryManager.tsx', search: "alert(`Error al consolidar: ${res.error}`);", replace: "addToast(`Error al consolidar el stock: ${res.error}`, 'error');" },
  { file: 'src/components/inventario/InventoryManager.tsx', search: "alert('Completá Nombre y RUC del proveedor.');", replace: "addToast('Por favor, complete el Nombre y RUC del proveedor.', 'warning');" },
  { file: 'src/components/inventario/InventoryManager.tsx', search: "alert('El RUC debe tener exactamente 11 dígitos numéricos, ponete las pilas.');", replace: "addToast('El RUC debe contener exactamente 11 dígitos numéricos.', 'error');" },
  { file: 'src/components/inventario/InventoryManager.tsx', search: "alert('Elegí una billetera digital para realizar el débito.');", replace: "addToast('Seleccione una billetera digital para realizar el débito.', 'warning');" },
  { file: 'src/components/inventario/InventoryManager.tsx', search: "alert(`Deuda pagada correctamente de forma atómica. Canal de Egreso: ${metodoPagoDeuda === 'efectivo' ? 'Efectivo en Caja' : ctaNombre}. Monto liquidado: S/ ${pedidoAPagar.monto_total.toFixed(2)}.`);", replace: "addToast(`Deuda pagada exitosamente. Canal: ${metodoPagoDeuda === 'efectivo' ? 'Efectivo en Caja' : ctaNombre}. Monto: S/ ${pedidoAPagar.monto_total.toFixed(2)}.`, 'success');" },
  { file: 'src/components/inventario/InventoryManager.tsx', search: "alert(`Error al saldar la deuda: ${res.error}`);", replace: "addToast(`Error al saldar la deuda: ${res.error}`, 'error');" },
  { file: 'src/components/inventario/InventoryManager.tsx', search: "alert('Sugerencias recalculadas en base al stock crítico de productos (< 5 unidades).');", replace: "addToast('Sugerencias recalculadas según el stock crítico (< 5 unidades).', 'info');" },
  { file: 'src/components/inventario/InventoryManager.tsx', search: "alert('Mercadería recibida. Se actualizó el stock físico del inventario.');", replace: "addToast('Mercadería recibida. Stock físico actualizado.', 'success');" },
  { file: 'src/components/inventario/InventoryManager.tsx', search: "alert(msg);", replace: "addToast(msg, 'info');" },
  { file: 'src/components/inventario/InventoryManager.tsx', search: "window.confirm('¿Eliminás este proveedor? Se desvinculará de los productos asociados.')", replace: "window.confirm('¿Está seguro que desea eliminar este proveedor? Se desvinculará de los productos asociados.')" },

  { file: 'src/components/pos/ProductFinder.tsx', search: "alert(`¡Ojo! '${prod.nombre}' no tiene stock disponible.`);", replace: "useToastStore.getState().addToast(`El producto '${prod.nombre}' no tiene stock disponible.`, 'error');" },
  
  { file: 'src/hooks/useKeyboardShortcuts.ts', search: "window.confirm('¿Seguro que querés limpiar el carrito de este cliente?');", replace: "window.confirm('¿Está seguro que desea limpiar el carrito de este cliente?');" }
];

const workspace = 'C:/Users/schir/OneDrive/Escritorio/BOOM POS';

// First add imports and hook instances
const filesToEnhance = [
  {
    path: 'src/components/pos/CashRegister.tsx',
    import: "import { useToastStore } from '../../store/useToastStore';",
    hook: "  const { addToast } = useToastStore();",
    importAfter: "import { useCartStore } from '../../store/useCartStore';",
    hookAfter: "export function CashRegister() {"
  },
  {
    path: 'src/components/inventario/InventoryManager.tsx',
    import: "import { useToastStore } from '../../store/useToastStore';",
    hook: "  const { addToast } = useToastStore();",
    importAfter: "import { useCartStore, MockProduct, MockProveedor, MockPedido } from '../../store/useCartStore';",
    hookAfter: "export function InventoryManager() {"
  },
  {
    path: 'src/components/pos/ProductFinder.tsx',
    import: "import { useToastStore } from '../../store/useToastStore';",
    hook: "", // We'll use getState() directly here or hook
    importAfter: "import { useCartStore } from '../../store/useCartStore';",
    hookAfter: ""
  }
];

filesToEnhance.forEach(enh => {
  const fPath = path.join(workspace, enh.path);
  if (fs.existsSync(fPath)) {
    let content = fs.readFileSync(fPath, 'utf8');
    if (!content.includes('useToastStore')) {
      content = content.replace(enh.importAfter, `${enh.importAfter}\n${enh.import}`);
      if (enh.hook && enh.hookAfter) {
        content = content.replace(enh.hookAfter, `${enh.hookAfter}\n${enh.hook}`);
      }
      fs.writeFileSync(fPath, content, 'utf8');
    }
  }
});

// Then apply exact string replacements
replacements.forEach(rep => {
  const fPath = path.join(workspace, rep.file);
  if (fs.existsSync(fPath)) {
    let content = fs.readFileSync(fPath, 'utf8');
    content = content.split(rep.search).join(rep.replace);
    fs.writeFileSync(fPath, content, 'utf8');
  }
});

console.log('Success');
