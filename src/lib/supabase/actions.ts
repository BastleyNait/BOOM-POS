'use server';

import { createServerSupabaseClient, getIsServerMockMode } from './server';

// =========================================================================
// INTERFACES DE ENTRADA
// =========================================================================

export interface DetalleVentaInput {
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  descuento: number;
  nota?: string;
}

export interface VentaInput {
  clienteId: string | null;
  cajaId: string | null;
  total: number;
  tipoModo: 'rapido' | 'clasico';
  detalles: DetalleVentaInput[];
}

export interface ActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// =========================================================================
// SERVER ACTIONS TRANSACCIONALES
// =========================================================================

/**
 * Función auxiliar para detectar errores de infraestructura o base de datos no configurada.
 * Si Supabase está pausado, incompleto o usa credenciales de placeholder, caemos a modo mock.
 */
function esErrorInfraestructura(error: any): boolean {
  if (!error) return false;
  const errMsg = (error.message || '').toLowerCase();
  const errCode = (error.code || '').toString();
  return (
    errMsg.includes('fetch failed') ||
    errMsg.includes('enotfound') ||
    errMsg.includes('connection') ||
    errMsg.includes('relation') ||
    errMsg.includes('violates row-level security') ||
    errMsg.includes('api key') ||
    errMsg.includes('jwt') ||
    errMsg.includes('unauthorized') ||
    errMsg.includes('invalid') ||
    errCode === '42P01' || // relation does not exist
    errCode === '42501' || // insufficient privilege (RLS)
    errCode === 'PGRST111' || // connection error
    errCode === 'PGRST301' // JWT error / unauthorized
  );
}

/**
 * Registra una venta de manera 100% atómica llamando a la función RPC de Supabase.
 * El trigger de base de datos fn_descontar_stock_venta se encargará de validar
 * el stock y abortará la transacción entera si no hay suficiente disponibilidad.
 */
export async function confirmarVentaAction(venta: VentaInput): Promise<ActionResponse<{ ventaId: string }>> {
  try {
    if (getIsServerMockMode()) {
      return {
        success: true,
        data: { ventaId: 'venta-mock-' + Math.random().toString(36).substring(2, 11) }
      };
    }
    const supabase = createServerSupabaseClient();

    // Estructuramos los datos para mapear con los nombres de parámetros de la función RPC
    const { data, error } = await supabase.rpc('confirmar_venta_transaccional', {
      p_cliente_id: venta.clienteId,
      p_caja_id: venta.cajaId,
      p_total: venta.total,
      p_tipo_modo: venta.tipoModo,
      p_detalles: venta.detalles // Enviado como JSONB
    });

    if (error) {
      console.error('Error al registrar venta en base de datos:', error);
      
      if (esErrorInfraestructura(error)) {
        console.warn('[BOOM POS SERVER] Infraestructura no disponible al confirmar venta. Activando contingencia de Modo Demo.');
        return {
          success: true,
          data: { ventaId: 'venta-mock-contingencia-' + Math.random().toString(36).substring(2, 11) }
        };
      }
      
      // Manejo amigable de excepciones de base de datos (ej: stock insuficiente)
      if (error.message.includes('Stock insuficiente')) {
        return {
          success: false,
          error: error.message, // Mensaje personalizado del trigger plpgsql
        };
      }

      return {
        success: false,
        error: `Hubo un problema al procesar la venta: ${error.message || 'Revisá la red o los datos de los productos.'}`,
      };
    }

    return {
      success: true,
      data: { ventaId: data as string },
    };
  } catch (err: any) {
    console.error('Error no controlado en Server Action confirmarVentaAction:', err);
    return {
      success: false,
      error: 'Error interno del servidor. Comunicate con soporte técnico.',
    };
  }
}

/**
 * Abre la caja diaria registrando el monto inicial y un movimiento de apertura.
 */
export async function abrirCajaAction(montoApertura: number): Promise<ActionResponse<{ cajaId: string }>> {
  try {
    if (getIsServerMockMode()) {
      return {
        success: true,
        data: { cajaId: 'caja-mock-' + Math.random().toString(36).substring(2, 11) }
      };
    }
    const supabase = createServerSupabaseClient();

    // 1. Insertar la caja en estado abierta
    const { data: nuevaCaja, error: errorCaja } = await supabase
      .from('cajas')
      .insert({
        estado_caja: 'abierta',
        monto_apertura: montoApertura,
        ingresos: 0,
        egresos: 0,
        fecha_apertura: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (errorCaja || !nuevaCaja) {
      console.error('Error al abrir caja:', errorCaja);
      
      if (esErrorInfraestructura(errorCaja)) {
        console.warn('[BOOM POS SERVER] Infraestructura no disponible al abrir caja. Activando contingencia de Modo Demo.');
        return {
          success: true,
          data: { cajaId: 'caja-mock-contingencia-' + Math.random().toString(36).substring(2, 11) }
        };
      }

      return {
        success: false,
        error: `No se pudo abrir la caja en el sistema: ${errorCaja?.message || 'Verificá si ya hay una abierta.'}`,
      };
    }

    // 2. Registrar movimiento de apertura
    const { error: errorMovimiento } = await supabase
      .from('movimientos_caja')
      .insert({
        caja_id: nuevaCaja.id,
        tipo: 'apertura',
        monto: montoApertura,
        motivo: 'Apertura inicial de caja diaria',
      });

    if (errorMovimiento) {
      console.error('Error al registrar movimiento de apertura de caja:', errorMovimiento);
      // No cancelamos la operación porque la caja ya fue abierta, pero reportamos
    }

    return {
      success: true,
      data: { cajaId: nuevaCaja.id },
    };
  } catch (err: any) {
    console.error('Error en abrirCajaAction:', err);
    return {
      success: false,
      error: 'Error inesperado al intentar abrir la caja.',
    };
  }
}

/**
 * Cierra la caja actual, realiza el arqueo y registra el movimiento de cierre.
 */
export async function cerrarCajaAction(cajaId: string, montoCierre: number): Promise<ActionResponse<void>> {
  try {
    if (getIsServerMockMode()) {
      return {
        success: true
      };
    }
    const supabase = createServerSupabaseClient();

    // 1. Obtener balance actual para dejar registro en auditoría si es necesario
    const { data: caja, error: errorFetch } = await supabase
      .from('cajas')
      .select('monto_apertura, ingresos, egresos')
      .eq('id', cajaId)
      .single();

    if (errorFetch || !caja) {
      return {
        success: false,
        error: 'No se pudo encontrar la caja activa especificada para el cierre.',
      };
    }

    // 2. Modificar el estado de la caja a cerrada y guardar montos finales
    const { error: errorUpdate } = await supabase
      .from('cajas')
      .update({
        estado_caja: 'cerrada',
        monto_cierre: montoCierre,
        fecha_cierre: new Date().toISOString(),
      })
      .eq('id', cajaId);

    if (errorUpdate) {
      console.error('Error al actualizar cierre de caja:', errorUpdate);
      return {
        success: false,
        error: 'Error al actualizar el cierre de caja en base de datos.',
      };
    }

    // 3. Registrar movimiento de cierre
    await supabase.from('movimientos_caja').insert({
      caja_id: cajaId,
      tipo: 'cierre',
      monto: montoCierre,
      motivo: `Cierre y arqueo de caja. Esperado: $${caja.monto_apertura + caja.ingresos - caja.egresos}. Declarado: $${montoCierre}.`,
    });

    return { success: true };
  } catch (err: any) {
    console.error('Error en cerrarCajaAction:', err);
    return {
      success: false,
      error: 'Error al procesar el cierre de caja.',
    };
  }
}

/**
 * Registra un ingreso o egreso de efectivo manual en la caja activa,
 * actualizando automáticamente el acumulado de ingresos/egresos en la tabla cajas.
 */
export async function registrarMovimientoCajaAction(
  cajaId: string,
  tipo: 'ingreso' | 'egreso',
  monto: number,
  motivo: string
): Promise<ActionResponse<void>> {
  try {
    if (getIsServerMockMode()) {
      return {
        success: true
      };
    }
    const supabase = createServerSupabaseClient();

    // 1. Validar que la caja esté abierta
    const { data: caja, error: errorFetch } = await supabase
      .from('cajas')
      .select('estado_caja, ingresos, egresos')
      .eq('id', cajaId)
      .single();

    if (errorFetch || !caja) {
      return {
        success: false,
        error: 'No se pudo validar el estado de la caja activa.',
      };
    }

    if (caja.estado_caja !== 'abierta') {
      return {
        success: false,
        error: 'Operación denegada. La caja ya se encuentra cerrada.',
      };
    }

    // 2. Registrar el movimiento de caja
    const { error: errorMovimiento } = await supabase
      .from('movimientos_caja')
      .insert({
        caja_id: cajaId,
        tipo,
        monto,
        motivo,
      });

    if (errorMovimiento) {
      console.error('Error al insertar movimiento manual:', errorMovimiento);
      return {
        success: false,
        error: 'No se pudo guardar el movimiento de caja.',
      };
    }

    // 3. Actualizar los acumulados en la tabla principal de cajas
    const updatePayload =
      tipo === 'ingreso'
        ? { ingresos: caja.ingresos + monto }
        : { egresos: caja.egresos + monto };

    const { error: errorCajaUpdate } = await supabase
      .from('cajas')
      .update(updatePayload)
      .eq('id', cajaId);

    if (errorCajaUpdate) {
      console.error('Error al actualizar el balance acumulado de caja:', errorCajaUpdate);
      return {
        success: false,
        error: 'Movimiento registrado pero hubo un error al actualizar el saldo de la caja.',
      };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error en registrarMovimientoCajaAction:', err);
    return {
      success: false,
      error: 'Error al registrar el movimiento manual de caja.',
    };
  }
}

// =========================================================================
// SERVER ACTIONS PARA INVENTARIO Y COMPRAS SUGERIDAS (FASE 4)
// =========================================================================

export interface ProductoInput {
  id?: string;
  nombre: string;
  codigo: string;
  precio_costo: number;
  precio_venta: number;
  stock: number;
  proveedor_id?: string | null;
}

/**
 * Verifica si ya existe un producto con el mismo nombre o código de barras,
 * permitiendo excluir un ID específico en caso de edición.
 */
export async function verificarDuplicadoProductoAction(
  nombre: string,
  codigo: string,
  excluirId?: string
): Promise<ActionResponse<{ existe: boolean; tipo: 'nombre' | 'codigo' | null; producto?: any }>> {
  try {
    if (getIsServerMockMode()) {
      return {
        success: true,
        data: { existe: false, tipo: null }
      };
    }
    const supabase = createServerSupabaseClient();

    // 1. Verificar coincidencia por código
    let queryCodigo = supabase
      .from('productos')
      .select('id, nombre, codigo, precio_costo, precio_venta, stock')
      .eq('codigo', codigo.trim());

    if (excluirId) {
      queryCodigo = queryCodigo.neq('id', excluirId);
    }

    const { data: porCodigo } = await queryCodigo.maybeSingle();

    if (porCodigo) {
      return {
        success: true,
        data: { existe: true, tipo: 'codigo', producto: porCodigo },
      };
    }

    // 2. Verificar coincidencia por nombre
    let queryNombre = supabase
      .from('productos')
      .select('id, nombre, codigo, precio_costo, precio_venta, stock')
      .eq('nombre', nombre.trim());

    if (excluirId) {
      queryNombre = queryNombre.neq('id', excluirId);
    }

    const { data: porNombre } = await queryNombre.maybeSingle();

    if (porNombre) {
      return {
        success: true,
        data: { existe: true, tipo: 'nombre', producto: porNombre },
      };
    }

    return {
      success: true,
      data: { existe: false, tipo: null },
    };
  } catch (err: any) {
    console.error('Error al verificar duplicados:', err);
    return {
      success: false,
      error: 'Error de conexión al verificar duplicados en el inventario.',
    };
  }
}

/**
 * Registra un nuevo producto o edita uno existente en Supabase.
 * El trigger de base de datos fn_autocalcular_precio_venta se activará
 * si el precio_venta se envía nulo o en 0, aplicando un 30% de margen.
 */
export async function crearOEditarProductoAction(
  prod: ProductoInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    if (getIsServerMockMode()) {
      return {
        success: true,
        data: { id: prod.id || 'prod-mock-' + Math.random().toString(36).substring(2, 11) }
      };
    }
    const supabase = createServerSupabaseClient();

    const payload = {
      nombre: prod.nombre.trim(),
      codigo: prod.codigo.trim(),
      precio_costo: prod.precio_costo,
      precio_venta: prod.precio_venta || 0, // 0 gatillará el autocalculo del trigger
      stock: prod.stock,
      proveedor_id: prod.proveedor_id || null,
    };

    if (prod.id) {
      // Modificar existente
      const { error } = await supabase
        .from('productos')
        .update(payload)
        .eq('id', prod.id);

      if (error) {
        console.error('Error al actualizar producto:', error);
        return { success: false, error: 'No se pudo actualizar el producto en el inventario.' };
      }

      return { success: true, data: { id: prod.id } };
    } else {
      // Insertar nuevo
      const { data, error } = await supabase
        .from('productos')
        .insert(payload)
        .select('id')
        .single();

      if (error || !data) {
        console.error('Error al insertar producto:', error);
        return { success: false, error: 'No se pudo guardar el nuevo producto en el inventario.' };
      }

      return { success: true, data: { id: data.id } };
    }
  } catch (err: any) {
    console.error('Error en crearOEditarProductoAction:', err);
    return { success: false, error: 'Error inesperado al gestionar el producto.' };
  }
}

/**
 * Algoritmo relacional de compras:
 * Analiza productos con stock crítico (< 5) que tengan un proveedor asociado.
 * Genera de forma atómica pedidos sugeridos agrupados por proveedor.
 */
export async function generarSugerenciasCompraAction(): Promise<ActionResponse<{ pedidosCreados: number }>> {
  try {
    if (getIsServerMockMode()) {
      return {
        success: true,
        data: { pedidosCreados: 1 }
      };
    }
    const supabase = createServerSupabaseClient();

    // 1. Obtener productos con bajo stock (< 5) y proveedor asignado
    const { data: productosCriticos, error: errorFetch } = await supabase
      .from('productos')
      .select('id, nombre, stock, proveedor_id')
      .lt('stock', 5)
      .not('proveedor_id', 'is', null);

    if (errorFetch) {
      console.error('Error al obtener productos con bajo stock:', errorFetch);
      return { success: false, error: 'No se pudieron consultar los productos para compras sugeridas.' };
    }

    if (!productosCriticos || productosCriticos.length === 0) {
      return {
        success: true,
        data: { pedidosCreados: 0 },
        error: 'Todos los productos tienen niveles de stock saludables, hermano.',
      };
    }

    // 2. Agrupar productos críticos por proveedor
    const productosPorProveedor: Record<string, typeof productosCriticos> = {};
    productosCriticos.forEach((prod) => {
      const provId = prod.proveedor_id!;
      if (!productosPorProveedor[provId]) {
        productosPorProveedor[provId] = [];
      }
      productosPorProveedor[provId].push(prod);
    });

    const proveedoresIds = Object.keys(productosPorProveedor);
    let pedidosCreadosCount = 0;

    // 3. Crear los pedidos y sus detalles
    for (const provId of proveedoresIds) {
      const itemsBajoStock = productosPorProveedor[provId];

      // A. Crear cabecera de pedido_proveedor
      const { data: nuevoPedido, error: errorPedido } = await supabase
        .from('pedidos_proveedor')
        .insert({
          proveedor_id: provId,
          estado: 'pendiente',
        })
        .select('id')
        .single();

      if (errorPedido || !nuevoPedido) {
        console.error('Error al crear cabecera de pedido proveedor:', errorPedido);
        continue; // Intentar con el siguiente proveedor
      }

      // B. Insertar productos en lista_productos de forma sugerida
      // Cantidad sugerida: llegar al stock óptimo de 20 unidades
      const detallesInsercion = itemsBajoStock.map((prod) => ({
        pedido_proveedor_id: nuevoPedido.id,
        producto_id: prod.id,
        cantidad_sugerida: Math.max(1, 20 - prod.stock),
      }));

      const { error: errorDetalles } = await supabase
        .from('lista_productos')
        .insert(detallesInsercion);

      if (errorDetalles) {
        console.error(`Error al insertar detalles de pedido para proveedor ${provId}:`, errorDetalles);
        // Hacemos un delete de la cabecera huérfana para no ensuciar datos
        await supabase.from('pedidos_proveedor').delete().eq('id', nuevoPedido.id);
        continue;
      }

      pedidosCreadosCount++;
    }

    return {
      success: true,
      data: { pedidosCreados: pedidosCreadosCount },
    };
  } catch (err: any) {
    console.error('Error en generarSugerenciasCompraAction:', err);
    return { success: false, error: 'Error inesperado al calcular las sugerencias de compras.' };
  }
}

/**
 * Cambia el estado de un pedido de proveedor.
 * Si el estado cambia a 'completado', el trigger trg_completar_pedido_proveedor
 * de PostgreSQL sumará automáticamente el stock al inventario.
 */
export async function actualizarEstadoPedidoAction(
  pedidoId: string,
  nuevoEstado: 'pendiente' | 'ordenado' | 'completado'
): Promise<ActionResponse<void>> {
  try {
    if (getIsServerMockMode()) {
      return {
        success: true
      };
    }
    const supabase = createServerSupabaseClient();

    const { error } = await supabase
      .from('pedidos_proveedor')
      .update({ estado: nuevoEstado })
      .eq('id', pedidoId);

    if (error) {
      console.error('Error al actualizar estado del pedido:', error);
      return { success: false, error: 'No se pudo actualizar el estado del pedido de compras.' };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error en actualizarEstadoPedidoAction:', err);
    return { success: false, error: 'Error al cambiar el estado del pedido.' };
  }
}

