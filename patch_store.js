const fs = require('fs');
const path = require('path');

const file = path.join('C:/Users/schir/OneDrive/Escritorio/BOOM POS', 'src/store/useCartStore.ts');
let content = fs.readFileSync(file, 'utf8');

// Update TabState interface
content = content.replace(
  'export interface TabState {\n  items: CartItem[];\n  cliente: Cliente | null;\n}',
  'export interface TabState {\n  items: CartItem[];\n  cliente: Cliente | null;\n  undoStack?: CartItem[][];\n  redoStack?: CartItem[][];\n}'
);

// Update CartStore interface
content = content.replace(
  'clearActiveTab: () => void;',
  'clearActiveTab: () => void;\n  undoClearActiveTab: () => void;\n  redoClearActiveTab: () => void;'
);

// Update clearActiveTab implementation
const clearImplSearch = `  clearActiveTab: () => set((state) => {
    const newTabs = [...state.tabs];
    newTabs[state.activeTabIndex] = { ...newTabs[state.activeTabIndex], items: [] };
    return { tabs: newTabs, selectedCartItemIndex: -1 };
  }),`;

// Need to find exactly how clearActiveTab is implemented in useCartStore.ts
// Let's print it to check if my assumption is correct.
