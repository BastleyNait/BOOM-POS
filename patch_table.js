const fs = require('fs');
const path = require('path');

const file = path.join('C:/Users/schir/OneDrive/Escritorio/BOOM POS/src/components/inventario/InventoryManager.tsx');
let content = fs.readFileSync(file, 'utf8');

const tableRegex = /<table className="w-full border-collapse text-left text-sm text-slate-600">[\s\S]*?<\/table>/g;

const newTable = `<div className="overflow-x-auto rounded-xl border border-slate-200/60 shadow-sm bg-white">
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
                      const esPositiva = cierre.desviacion > 0.01;

                      return (
                        <tr key={cierre.id} className="hover:bg-orange-50/30 transition-colors">
                          <td className="p-3 font-sans">
                            <span className="font-bold text-slate-800 block text-xs">
                              📅 {new Date(cierre.fechaApertura).toLocaleDateString()}
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
                                0.00 ✓
                              </span>
                            ) : esNegativa ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-[9px] font-black bg-rose-50 text-rose-700 border border-rose-200/60 animate-pulse">
                                {cierre.desviacion.toFixed(2)} ⚠️
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-[9px] font-black bg-amber-50 text-amber-700 border border-amber-200/60">
                                +{cierre.desviacion.toFixed(2)} 💰
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
                              📄 Detalles
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>`;

content = content.replace(tableRegex, newTable);

fs.writeFileSync(file, content, 'utf8');
