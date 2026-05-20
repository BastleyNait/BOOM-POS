const fs = require('fs');
const path = require('path');

const file = path.join('C:/Users/schir/OneDrive/Escritorio/BOOM POS', 'src/components/inventario/InventoryManager.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Añadir CierreDiario al import si no está (ya está importado en la línea 31 destructuring, pero necesitamos el tipo)
if (!content.includes('CierreDiario')) {
  content = content.replace("import { useCartStore, MockProduct, MockProveedor, MockPedido } from '../../store/useCartStore';", "import { useCartStore, MockProduct, MockProveedor, MockPedido, CierreDiario } from '../../store/useCartStore';");
} else {
    // Asegurarse de que esté exportado desde el store, wait, let's just use `any` or import it. It's exported as interface in useCartStore.ts.
    // Let's replace the import line.
    content = content.replace(
        "import { useCartStore, MockProduct, MockProveedor, MockPedido } from '../../store/useCartStore';", 
        "import { useCartStore, MockProduct, MockProveedor, MockPedido, CierreDiario } from '../../store/useCartStore';"
    );
}

// 2. Add state
const stateHook = `  const [pedidoAPagar, setPedidoAPagar] = useState<MockPedido | null>(null);
  const [metodoPagoDeuda, setMetodoPagoDeuda] = useState<'efectivo' | 'billetera_digital'>('efectivo');
  const [cuentaPagoId, setCuentaPagoId] = useState('');
  
  // ESTADO MODAL AUDITORIA
  const [selectedAuditCierre, setSelectedAuditCierre] = useState<CierreDiario | null>(null);`;

content = content.replace(/  const \[pedidoAPagar, setPedidoAPagar\] = useState<MockPedido \| null>\(null\);\s*const \[metodoPagoDeuda, setMetodoPagoDeuda\] = useState<'efectivo' \| 'billetera_digital'>\('efectivo'\);\s*const \[cuentaPagoId, setCuentaPagoId\] = useState\(''\);/, stateHook);


// 3. Reemplazar el botón de Ver Auditoría
const oldButtonRegex = /<button\s*onClick=\{[^}]*\s*let msg = `📄 AUDITORÍA DETALLADA DE CAJA\\n`;[\s\S]*?addToast\(msg, 'info'\);\s*\}\}\s*className="[^"]*"\s*>\s*🔍 Ver Auditoría\s*<\/button>/g;

const newButton = `<button
                              onClick={() => setSelectedAuditCierre(cierre)}
                              className="px-4 py-2 text-[10px] rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-black text-slate-600 uppercase tracking-wider transition-all cursor-pointer shadow-sm hover:border-slate-300"
                            >
                              📄 Detalles
                            </button>`;

content = content.replace(oldButtonRegex, newButton);


// 4. Agregar el JSX del modal al final antes del último cierre de div
const modalJSX = `
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
                  <span className="text-2xl">📄</span> Auditoría Detallada de Caja
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
                    💵 Contabilidad de Efectivo
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

                    <div className={\`pt-3 mt-3 border-t border-slate-200 flex justify-between items-center rounded-xl p-3 \${Math.abs(selectedAuditCierre.desviacion) < 0.01 ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : selectedAuditCierre.desviacion < 0 ? 'bg-rose-50 text-rose-800 border-rose-100' : 'bg-teal-50 text-teal-800 border-teal-100'}\`}>
                      <span className="font-black uppercase tracking-wider text-xs">
                        {Math.abs(selectedAuditCierre.desviacion) < 0.01 ? '✓ Cuadre Perfecto' : selectedAuditCierre.desviacion < 0 ? '⚠️ Faltante Detectado' : '💰 Sobrante Detectado'}
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
                    📱 Billeteras Digitales
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
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            {nombre}
                          </span>
                          <span className="font-mono font-black text-emerald-700">S/ {saldo.toFixed(2)}</span>
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
`;

content = content.replace(/(      \{\/\* Columna Derecha: Formulario Contextual \*\/})/g, modalJSX + '\n$1');

fs.writeFileSync(file, content, 'utf8');
