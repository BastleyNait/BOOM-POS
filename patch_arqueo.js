const fs = require('fs');
const path = require('path');

const file = path.join('C:/Users/schir/OneDrive/Escritorio/BOOM POS/src/components/pos/CashRegister.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add state for Arqueo Modal
if (!content.includes('const [showArqueoModal, setShowArqueoModal] = useState(false);')) {
  content = content.replace(
    /const \[categoriaActiva, setCategoriaActiva\] = useState<string>\('Emporio'\);/,
    "const [categoriaActiva, setCategoriaActiva] = useState<string>('Emporio');\n  const [showArqueoModal, setShowArqueoModal] = useState(false);"
  );
}

// 2. Extract Arqueo section and replace with button
const arqueoSectionRegex = /\{\/\* Arqueo de Caja y Billeteras en Vivo \*\/\}\s*<div className=" border-t border-slate-100 pt-2 flex flex-col gap-2">[\s\S]*?<\/div>\s*<\/div>\s*\{\/\* Botón de Confirmación Principal \*\/\}/g;

const arqueoButton = `
            {/* Botón para Mostrar Arqueo */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowArqueoModal(true)}
                className="w-full p-3 bg-slate-50 border border-slate-200/80 hover:bg-slate-100 hover:border-slate-300 rounded-xl flex justify-between items-center transition-all shadow-sm group cursor-pointer"
              >
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider group-hover:text-slate-700">
                  📊 Ver Arqueo Financiero
                </span>
                <span className="text-xs font-black font-mono text-slate-700 bg-white px-2 py-1 rounded shadow-sm border border-slate-200">
                  S/ {(efectivoCajaFisica + cuentasBilletera.reduce((sum, c) => sum + c.saldo, 0)).toFixed(2)}
                </span>
              </button>
            </div>

          </div>

          {/* Botón de Confirmación Principal */}`;

content = content.replace(arqueoSectionRegex, arqueoButton);

// 3. Remove 'hidden xl:flex' from the center column
content = content.replace(
  /<div className="hidden xl:flex flex-1 min-w-\[240px\] bg-white/g,
  '<div className="flex flex-1 min-w-[240px] max-w-[500px] bg-white'
);

// 4. Add the Arqueo Modal JSX at the end
const arqueoModalJSX = `
      {/* Modal Arqueo Financiero en Vivo */}
      {showArqueoModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-slate-50 p-5 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2 uppercase">
                📊 Arqueo en Vivo
              </h2>
              <button 
                onClick={() => setShowArqueoModal(false)}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-4 bg-slate-50/50">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-white border border-slate-200/80 rounded-2xl flex flex-col shadow-sm">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Caja Física (Drawer)</span>
                  <span className="text-2xl font-black font-mono text-slate-800">
                    S/ {efectivoCajaFisica.toFixed(2)}
                  </span>
                </div>
                {cuentasBilletera.map((cta) => (
                  <div key={cta.id} className="p-4 bg-white border border-slate-200/80 rounded-2xl flex flex-col shadow-sm">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 truncate" title={cta.nombre}>
                      {cta.nombre}
                    </span>
                    <span className="text-2xl font-black font-mono text-orange-600">
                      S/ {cta.saldo.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="mt-2 bg-slate-900 text-white p-5 rounded-2xl flex justify-between items-center shadow-lg">
                <span className="text-xs font-black uppercase tracking-widest text-slate-300">Saldo Total Diario:</span>
                <span className="text-3xl font-black font-mono text-orange-400">
                  S/ {(efectivoCajaFisica + cuentasBilletera.reduce((sum, c) => sum + c.saldo, 0)).toFixed(2)}
                </span>
              </div>
            </div>
            
            <div className="p-5 border-t border-slate-200 bg-white flex justify-end">
               <button 
                  onClick={() => setShowArqueoModal(false)}
                  className="px-6 py-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-black uppercase tracking-wider transition-all cursor-pointer"
                >
                  Cerrar
                </button>
            </div>
          </div>
        </div>
      )}
`;

content = content.replace(/(      \{\/\* Modal Apertura de Caja Obligatoria \*\/})/g, arqueoModalJSX + '\n$1');

fs.writeFileSync(file, content, 'utf8');
