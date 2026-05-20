import { CartItem } from '../../store/useCartStore';

interface TicketData {
  ventaId: string;
  items: CartItem[];
  subtotal: number;
  descuentoTotal: number;
  total: number;
  tipoModo: 'rapido' | 'clasico';
  cajero?: string;
  clienteNombre?: string;
  cajaId?: string;
}

/**
 * Formatea una venta en un string de texto plano optimizado para impresión térmica.
 * Soporta anchos estándar de 58mm (32 caracteres de ancho) y 80mm (48 caracteres de ancho).
 */
export function formatTicketForThermalPrinter(
  data: TicketData,
  paperWidth: 58 | 80 = 58
): string {
  const charLimit = paperWidth === 58 ? 32 : 48;
  const separator = '-'.repeat(charLimit);
  const doubleSeparator = '='.repeat(charLimit);

  // Helper para centrar texto
  const centerText = (text: string): string => {
    if (text.length >= charLimit) return text.substring(0, charLimit);
    const spaces = ' '.repeat(Math.floor((charLimit - text.length) / 2));
    return `${spaces}${text}${spaces}`.padEnd(charLimit);
  };

  // Helper para alinear columnas (izq texto, der precio)
  const formatRow = (left: string, right: string): string => {
    const leftSpace = charLimit - right.length;
    if (left.length >= leftSpace) {
      return `${left.substring(0, leftSpace - 1)} ${right}`;
    }
    return left.padEnd(leftSpace) + right;
  };

  const lines: string[] = [];

  // 1. Encabezado Premium del Ticket
  lines.push(centerText('*** BOOM POS ***'));
  lines.push(centerText('GESTION DE INVENTARIO INTELIGENTE'));
  lines.push(centerText('Vercel + Supabase Stack'));
  lines.push(separator);

  // 2. Información del Ticket
  const fechaStr = new Date().toLocaleString('es-PE', {
    timeZone: 'America/Lima',
  });
  lines.push(`Fecha: ${fechaStr}`);
  lines.push(`Ticket ID: ${data.ventaId.substring(0, 8).toUpperCase()}`);
  lines.push(`Modo: ${data.tipoModo.toUpperCase()}`);
  if (data.cajaId) lines.push(`Caja ID: ${data.cajaId.substring(0, 8).toUpperCase()}`);
  if (data.clienteNombre) lines.push(`Cliente: ${data.clienteNombre.toUpperCase()}`);
  lines.push(separator);

  // 3. Encabezado de Productos
  // Cant x Prod -> Subtotal
  lines.push(formatRow('Cant x Producto', 'Total'));
  lines.push(separator);

  // 4. Detalle de Items
  data.items.forEach((item) => {
    // Fila Principal: Cantidad x PrecioUnit
    const priceInfo = `${item.cantidad}xS/ ${item.precio_venta.toFixed(2)}`;
    lines.push(priceInfo);

    // Fila del Producto y su Subtotal
    const itemSubtotal = item.precio_venta * item.cantidad;
    let detailText = item.nombre;
    
    if (item.descuento > 0) {
      const descVal = item.tipo_descuento === 'porcentaje' 
        ? itemSubtotal * (item.descuento / 100) 
        : item.descuento * item.cantidad;
      detailText += ` (Desc. -S/ ${descVal.toFixed(2)})`;
    }

    const itemTotalFinal = Math.max(0, itemSubtotal - (item.descuento > 0 ? (item.tipo_descuento === 'porcentaje' ? itemSubtotal * (item.descuento / 100) : item.descuento * item.cantidad) : 0));
    lines.push(formatRow(`  ${detailText}`, `S/ ${itemTotalFinal.toFixed(2)}`));

    // Si tiene notas del Modo Clásico, las imprimimos abajo del item
    if (item.nota) {
      lines.push(`   * Nota: ${item.nota}`);
    }
  });

  lines.push(doubleSeparator);

  // 5. Totales
  lines.push(formatRow('SUBTOTAL:', `S/ ${data.subtotal.toFixed(2)}`));
  if (data.descuentoTotal > 0) {
    lines.push(formatRow('DESCUENTO TOTAL:', `-S/ ${data.descuentoTotal.toFixed(2)}`));
  }
  lines.push(formatRow('TOTAL A PAGAR:', `S/ ${data.total.toFixed(2)}`));

  lines.push(doubleSeparator);

  // 6. Pie de Página
  lines.push(centerText('¡Muchas gracias por su compra!'));
  lines.push(centerText('Factura simplificada en terminal'));
  lines.push('\n\n\n'); // Espacio físico para corte de papel

  return lines.join('\n');
}
export default formatTicketForThermalPrinter;
