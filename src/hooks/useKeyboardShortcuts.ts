import { useHotkeys } from 'react-hotkeys-hook';
import { useCartStore } from '../store/useCartStore';
import { RefObject } from 'react';

interface KeyboardShortcutsProps {
  searchInputRef: RefObject<HTMLInputElement | null>;
  onProcessCheckout: () => void;
}

/**
 * Custom Hook para gestionar la navegación 100% por teclado en el POS.
 * Diseñado con prevención estricta de comportamientos nativos del navegador.
 * Habilita el funcionamiento global de atajos incluso cuando el foco está sobre campos de texto.
 */
export function useKeyboardShortcuts({
  searchInputRef,
  onProcessCheckout,
}: KeyboardShortcutsProps) {
  const {
    tabs,
    activeTabIndex,
    modo,
    selectedCartItemIndex,
    setActiveTab,
    setSelectedCartItemIndex,
    updateQuantity,
    removeFromCart,
    clearActiveTab
  } = useCartStore();

  const currentTab = tabs[activeTabIndex];
  const items = currentTab?.items || [];

  // Opciones de configuración global para react-hotkeys-hook
  const hotkeyOptions = {
    enableOnFormTags: true, // Habilita atajos mientras se escribe en inputs de búsqueda o cantidad
    preventDefault: true,   // Bloquea el comportamiento por defecto de la tecla en el navegador
  };

  // --- SELECCIÓN DE PESTAÑAS (F1 a F5) ---
  
  useHotkeys('f1', (e) => {
    e.preventDefault();
    setActiveTab(0);
  }, hotkeyOptions);

  useHotkeys('f2', (e) => {
    e.preventDefault();
    setActiveTab(1);
  }, hotkeyOptions);

  useHotkeys('f3', (e) => {
    e.preventDefault();
    setActiveTab(2);
  }, hotkeyOptions);

  useHotkeys('f4', (e) => {
    e.preventDefault();
    setActiveTab(3);
  }, hotkeyOptions);

  useHotkeys('f5', (e) => {
    e.preventDefault();
    setActiveTab(4);
  }, hotkeyOptions);


  // --- ENFOQUE DEL BUSCADOR DE PRODUCTOS (F8) ---
  
  useHotkeys('f8', (e) => {
    e.preventDefault();
    if (searchInputRef.current) {
      searchInputRef.current.focus();
      searchInputRef.current.select(); // Selecciona el texto existente para sobreescribir rápido
    }
  }, hotkeyOptions);


  // --- ENFOQUE RÁPIDO DEL COBRO (F9) ---
  
  useHotkeys('f9', (e) => {
    e.preventDefault();
    const cobroInput = document.querySelector('input[type="number"][placeholder="0.00"]') as HTMLInputElement | null;
    if (cobroInput) {
      cobroInput.focus();
      cobroInput.select();
    }
  }, hotkeyOptions);


  // --- NAVEGACIÓN DE ITEMS EN EL CARRITO CON TECLADO (Ctrl + Flechas) ---
  
  useHotkeys('ctrl+down', (e) => {
    e.preventDefault();
    if (items.length === 0) return;
    
    // Si no hay item seleccionado, seleccionamos el primero. Si no, bajamos.
    setSelectedCartItemIndex(
      selectedCartItemIndex < items.length - 1 ? selectedCartItemIndex + 1 : items.length - 1
    );
  }, hotkeyOptions);

  useHotkeys('ctrl+up', (e) => {
    e.preventDefault();
    if (items.length === 0) return;
    
    setSelectedCartItemIndex(
      selectedCartItemIndex > 0 ? selectedCartItemIndex - 1 : 0
    );
  }, hotkeyOptions);


  // --- ACCIONES EN EL ITEM DEL CARRITO SELECCIONADO (+ / - / Supr) ---
  
  useHotkeys('+', (e) => {
    // Solo aplicar si el buscador NO está enfocado con texto y hay un item del carrito seleccionado
    const isSearching = document.activeElement === searchInputRef.current;
    if (!isSearching && selectedCartItemIndex >= 0 && selectedCartItemIndex < items.length) {
      e.preventDefault();
      const targetItem = items[selectedCartItemIndex];
      updateQuantity(targetItem.id, targetItem.cantidad + 1);
    }
  }, { enableOnFormTags: true, preventDefault: false });

  useHotkeys('-', (e) => {
    const isSearching = document.activeElement === searchInputRef.current;
    if (!isSearching && selectedCartItemIndex >= 0 && selectedCartItemIndex < items.length) {
      e.preventDefault();
      const targetItem = items[selectedCartItemIndex];
      if (targetItem.cantidad > 1) {
        updateQuantity(targetItem.id, targetItem.cantidad - 1);
      }
    }
  }, { enableOnFormTags: true, preventDefault: false });

  useHotkeys('del, supr', (e) => {
    const activeElement = document.activeElement;
    const isEditingInput = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA';
    
    if (!isEditingInput && selectedCartItemIndex >= 0 && selectedCartItemIndex < items.length) {
      e.preventDefault();
      const targetItem = items[selectedCartItemIndex];
      removeFromCart(targetItem.id);
      
      // Ajustar index para que no quede fuera de rango
      const nextIndex = Math.min(selectedCartItemIndex, items.length - 2);
      setSelectedCartItemIndex(nextIndex);
    }
  }, hotkeyOptions);


  // --- PROCESAR / COBRAR LA VENTA (F12) ---
  useHotkeys('f12', (e) => {
    e.preventDefault();
    onProcessCheckout();
  }, hotkeyOptions);


  // --- PROCESAR / COBRAR LA VENTA (ENTER) ---
  useHotkeys('enter', (e) => {
    const activeElement = document.activeElement;
    const isEditingQuantity = activeElement?.getAttribute('name') === 'cantidad-item';
    const isSearching = activeElement === searchInputRef.current;
    const isInputDeCobro = activeElement?.getAttribute('name') === 'monto-pago';
    
    // Si está en el input de cobro, o si no está editando inputs de texto en general (salvo el de cobro)
    const isEditingOtherInput = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA';

    if (!isEditingQuantity && !isSearching && (isInputDeCobro || !isEditingOtherInput)) {
      e.preventDefault();
      onProcessCheckout();
    }
  }, {
    enableOnFormTags: true,
    preventDefault: false,
  });


  // --- LIMPIAR PESTAÑA O SELECCIÓN (ESC) ---
  
  useHotkeys('esc', (e) => {
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
    const confirmarLimpieza = window.confirm('¿Seguro que querés limpiar el carrito de este cliente?');
    if (confirmarLimpieza) {
      clearActiveTab();
    }
  }, hotkeyOptions);
}
export default useKeyboardShortcuts;
