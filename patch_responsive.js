const fs = require('fs');
const path = require('path');

const baseDir = 'C:/Users/schir/OneDrive/Escritorio/BOOM POS/src';

// 1. Patch Sidebar.tsx
const sidebarFile = path.join(baseDir, 'components/layout/Sidebar.tsx');
let sidebarContent = fs.readFileSync(sidebarFile, 'utf8');
sidebarContent = sidebarContent.replace(
  /\$\{isCollapsed \? 'w-20' : 'w-64'\}/,
  "${isCollapsed ? 'w-20' : 'w-56 2xl:w-64'}"
);
fs.writeFileSync(sidebarFile, sidebarContent, 'utf8');
console.log('Sidebar patched.');

// 2. Patch CashRegister.tsx
const cashFile = path.join(baseDir, 'components/pos/CashRegister.tsx');
let cashContent = fs.readFileSync(cashFile, 'utf8');
cashContent = cashContent.replace(
  /flex-1 max-w-\[440px\] min-w-\[320px\]/g,
  "flex-1 max-w-[340px] 2xl:max-w-[440px] min-w-[280px]"
);
cashContent = cashContent.replace(
  /grid grid-cols-2 xl:grid-cols-3 gap-3 pr-1 align-content-start/g,
  "grid grid-cols-2 2xl:grid-cols-3 gap-3 pr-1 align-content-start"
);
cashContent = cashContent.replace(
  /w-\[420px\] xl:w-\[420px\] rounded-3xl border/g,
  "w-[320px] xl:w-[360px] 2xl:w-[420px] rounded-3xl border"
);
fs.writeFileSync(cashFile, cashContent, 'utf8');
console.log('CashRegister patched.');

// 3. Patch InventoryManager.tsx
const inventoryFile = path.join(baseDir, 'components/inventario/InventoryManager.tsx');
let inventoryContent = fs.readFileSync(inventoryFile, 'utf8');
inventoryContent = inventoryContent.replace(
  /w-\[420px\] flex flex-col gap-5/g,
  "w-[340px] xl:w-[380px] 2xl:w-[420px] flex flex-col gap-5"
);
fs.writeFileSync(inventoryFile, inventoryContent, 'utf8');
console.log('InventoryManager patched.');
