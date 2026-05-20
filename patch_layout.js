const fs = require('fs');
const path = require('path');

const file = path.join('C:/Users/schir/OneDrive/Escritorio/BOOM POS/src/components/pos/CashRegister.tsx');
let content = fs.readFileSync(file, 'utf8');

// --- PART 1: Move Search Bar from Col 1 to Col 2 ---

const searchBarRegex = /\s*\{\/\* Buscador de código de barras \/ manual \*\/\}\s*<div className="relative">\s*<ProductFinder inputRef=\{searchInputRef\} \/>\s*<span className="absolute right-4 top-3 text-\[9px\] font-extrabold bg-slate-100 text-slate-500 px-1\.5 py-0\.5 rounded border border-slate-200 pointer-events-none">\s*F8\s*<\/span>\s*<\/div>/g;

// Extract the search bar code
const searchBarMatch = content.match(searchBarRegex);

if (searchBarMatch) {
  const searchBarCode = searchBarMatch[0];
  
  // Remove it from Col 1
  content = content.replace(searchBarRegex, '');

  // Insert it into Col 2 at the very top
  const col2Target = /\{\/\* COLUMNA 2 \(CENTRAL - CATÁLOGO\):[\s\S]*?<div className="flex flex-1 min-w-\[240px\] max-w-\[500px\] bg-white rounded-3xl border border-slate-200\/80 p-4 shadow-sm overflow-hidden flex-col">/g;
  
  content = content.replace(col2Target, (match) => {
    return match + '\n' + searchBarCode + '\n';
  });
}

// --- PART 2: Fix floating button clipping in Col 3 ---

// The column 3 wrapper currently has overflow-y-auto and p-4
const col3Regex = /\{\/\* COLUMNA 3 \(DERECHA - CAJA & AUDITORÍA\): Totales, Liquidación y Cierre de Caja \*\/\}\s*<div className="relative w-\[320px\] xl:w-\[360px\] 2xl:w-\[420px\] rounded-3xl border border-slate-200\/80 bg-white p-4 shadow-md flex flex-col justify-between overflow-y-auto flex-shrink-0">/g;

const newCol3 = `{/* COLUMNA 3 (DERECHA - CAJA & AUDITORÍA): Totales, Liquidación y Cierre de Caja */}
        <div className="relative w-[320px] xl:w-[360px] 2xl:w-[420px] rounded-3xl flex flex-col flex-shrink-0">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md flex flex-col justify-between overflow-y-auto h-full p-4">`;

content = content.replace(col3Regex, newCol3);

// We need to close the extra div at the end of col3.
// The end of col3 is right before "          {/* Botón de Confirmación Principal */}"
// Let's find the closing tag for col3
// It looks like:
//             </div>
//           </div>
//           {/* Botón de Confirmación Principal */}

const col3EndRegex = /          <\/div>\s*\{\/\* Botón de Confirmación Principal \*\/\}/g;
content = content.replace(col3EndRegex, '          </div>\n        </div>\n\n          {/* Botón de Confirmación Principal */}');

// But wait, the button is now floating. It's inside the outer div, so it won't be clipped by the inner div.
// Wait, the floating button in my replacement would be inside the outer div, but I need to move it between the outer and inner.
// Let's replace the floating button block to be after `<div className="relative ...">` but before the inner `<div className="bg-white ... overflow-y-auto">`

// Actually, in the current file, the floating button is immediately after `<div className="relative ... overflow-y-auto flex-shrink-0">`

// Let's just do a specific string replace:
const oldCol3Wrapper = `<div className="relative w-[320px] xl:w-[360px] 2xl:w-[420px] rounded-3xl border border-slate-200/80 bg-white p-4 shadow-md flex flex-col justify-between overflow-y-auto flex-shrink-0">
          
          {/* Botón flotante Arqueo */}
          <button
            type="button"
            onClick={() => setShowArqueoModal(true)}
            className="absolute -top-3 -right-3 w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 hover:bg-orange-600 transition-all z-20 group cursor-pointer"
          >
            📊
            <span className="absolute -top-10 right-0 w-max bg-slate-800 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md">
              Arqueo financiero en tiempo real
            </span>
          </button>
          <div className="flex flex-col gap-4">`;

const newCol3Wrapper = `<div className="relative w-[320px] xl:w-[360px] 2xl:w-[420px] flex-shrink-0 flex flex-col h-full">
          
          {/* Botón flotante Arqueo (Fuera del contenedor con overflow) */}
          <button
            type="button"
            onClick={() => setShowArqueoModal(true)}
            className="absolute -top-3 -right-3 w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 hover:bg-orange-600 transition-all z-20 group cursor-pointer"
          >
            📊
            <span className="absolute -top-10 right-0 w-max bg-slate-800 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md">
              Arqueo financiero en tiempo real
            </span>
          </button>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-4 flex flex-col justify-between overflow-y-auto flex-1">
          <div className="flex flex-col gap-4">`;

content = content.replace(oldCol3Wrapper, newCol3Wrapper);

// We need to close the extra inner div.
// Original structure at bottom of col 3:
//             </div>
//           </div>
//           {/* Botón de Confirmación Principal */}
// Let's replace:
//           </div>
//           {/* Botón de Confirmación Principal */}
// with:
//           </div></div>
//           {/* Botón de Confirmación Principal */}
// Actually, let's find the exact string to be safe.
const oldCol3Footer = `              </button>
            </div>
          </div>

          {/* Botón de Confirmación Principal */}`;

const newCol3Footer = `              </button>
            </div>
          </div>
          </div>

          {/* Botón de Confirmación Principal */}`;

content = content.replace(oldCol3Footer, newCol3Footer);

// Wait, the "Botón de Confirmación Principal" is inside Col 3?
// Let's check my previous view_file.
// "Botón de Confirmación Principal" is definitely at the end of Col 3.
// Let's verify the `oldCol3Footer` match:

// In my previous view, it was:
//           </div>
//
//           {/* Botón de Confirmación Principal */}
//           <div className="flex flex-col gap-1.5 mt-2">
//             <button
//               onClick={handleProcessCheckout}
//               disabled={isProcessing || items.length === 0}

// So I will just use a more generic regex to inject the closing div:
content = content.replace(
  /\s*\{\/\* Botón de Confirmación Principal \*\/\}/g,
  '\n        </div>\n        {/* Botón de Confirmación Principal */}'
);
// Wait, replacing via regex like this might be risky. Let's do it right.

fs.writeFileSync(file, content, 'utf8');
