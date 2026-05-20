const fs = require('fs');
const path = require('path');

const file = path.join('C:/Users/schir/OneDrive/Escritorio/BOOM POS', 'src/hooks/useKeyboardShortcuts.ts');
let content = fs.readFileSync(file, 'utf8');

// 1. Añadir imports
if (!content.includes('useConfirmStore')) {
  content = content.replace("import { useCartStore } from '../store/useCartStore';", "import { useCartStore } from '../store/useCartStore';\nimport { useConfirmStore } from '../store/useConfirmStore';");
}

// 2. Extraer dependencias nuevas del hook 
if (!content.includes('undoClearActiveTab')) {
  content = content.replace("const {\n    modo,\n    setModo,", "const {\n    modo,\n    setModo,\n    undoClearActiveTab,\n    redoClearActiveTab,");
}

// 3. Reemplazar la lógica de ESC
const escReplacement = `  useHotkeys('esc', async (e) => {
    e.preventDefault();
    
    // Si tenemos un item seleccionado en el carrito, quitamos la selección primero
    if (selectedCartItemIndex >= 0) {
      setSelectedCartItemIndex(-1);
      return;
    }
    
    // Si el foco está en el input de búsqueda y tiene texto, limpiamos el input primero
    if (document.activeElement === searchInputRef.current && searchInputRef.current?.value) {
      searchInputRef.current.value = '';
      return;
    }
    
    // Si no, limpia la pestaña actual (carrito vacío)
    const confirmarLimpieza = await useConfirmStore.getState().requestConfirm('¿Está seguro que desea limpiar el carrito de este cliente?');
    if (confirmarLimpieza) {
      clearActiveTab();
    }
  }, hotkeyOptions);

  // Undo / Redo for cleared carts
  useHotkeys('ctrl+z, meta+z', (e) => {
    e.preventDefault();
    undoClearActiveTab();
  }, hotkeyOptions);

  useHotkeys('ctrl+y, meta+y', (e) => {
    e.preventDefault();
    redoClearActiveTab();
  }, hotkeyOptions);`;

// Regex para reemplazar useHotkeys('esc'...
content = content.replace(/useHotkeys\('esc',\s*\(e\)\s*=>\s*\{[\s\S]*?\},\s*hotkeyOptions\);/, escReplacement);

fs.writeFileSync(file, content, 'utf8');
