'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useCartStore } from '../../store/useCartStore';
import { useToastStore } from '../../store/useToastStore';
import { supabase, isMockMode } from '../../lib/supabase/client';

interface Product {
  id: string;
  nombre: string;
  codigo: string;
  precio_costo: number;
  precio_venta: number;
  stock: number;
}

interface ProductFinderProps {
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export function ProductFinder({ inputRef }: ProductFinderProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const { addToCart, mockProducts } = useCartStore();
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Escaneo o Búsqueda interactiva
  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);

    debounceTimeout.current = setTimeout(async () => {
      try {
        if (isMockMode) {
          // =========================================================================
          // BÚSQUEDA EN MODO MOCK (ZUSTAND LOCAL)
          // =========================================================================
          const qNormalized = query.trim().toLowerCase();
          
          // 1. Buscar coincidencia exacta por código (Lector de barras)
          const exactMatch = mockProducts.find((p) => p.codigo === query.trim());
          if (exactMatch) {
            addToCart({
              id: exactMatch.id,
              nombre: exactMatch.nombre,
              codigo: exactMatch.codigo,
              precio_costo: Number(exactMatch.precio_costo),
              precio_venta: Number(exactMatch.precio_venta),
            });
            setQuery('');
            setResults([]);
            setLoading(false);
            return;
          }

          // 2. Coincidencias parciales en memoria
          const partialMatches = mockProducts.filter((p) => 
            p.nombre.toLowerCase().includes(qNormalized) ||
            p.codigo.includes(query.trim())
          ).slice(0, 5);

          setResults(partialMatches);
          setSelectedIndex(partialMatches.length > 0 ? 0 : -1);
          setLoading(false);
          return;
        }

        // =========================================================================
        // BÚSQUEDA REAL DE SUPABASE
        // =========================================================================
        // 1. Buscar coincidencia exacta por código de barras primero
        const { data: exactMatch, error: exactError } = await supabase
          .from('productos')
          .select('id, nombre, codigo, precio_costo, precio_venta, stock')
          .eq('codigo', query.trim())
          .maybeSingle();

        if (exactMatch && !exactError) {
          addToCart({
            id: exactMatch.id,
            nombre: exactMatch.nombre,
            codigo: exactMatch.codigo,
            precio_costo: Number(exactMatch.precio_costo),
            precio_venta: Number(exactMatch.precio_venta),
          });
          
          setQuery('');
          setResults([]);
          setLoading(false);
          return;
        }

        // 2. Si no es un código de barras exacto, buscar por coincidencia parcial
        const { data: partialMatches, error: partialError } = await supabase
          .from('productos')
          .select('id, nombre, codigo, precio_costo, precio_venta, stock')
          .or(`nombre.ilike.%${query}%,codigo.ilike.%${query}%`)
          .limit(5);

        if (partialMatches && !partialError) {
          setResults(partialMatches);
          setSelectedIndex(partialMatches.length > 0 ? 0 : -1);
        }
      } catch (err) {
        console.error('Error en búsqueda de producto:', err);
      } finally {
        setLoading(false);
      }
    }, 250); // Debounce de 250ms

    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [query, addToCart, mockProducts]);

  // Manejo de eventos de navegación con flechas en la lista
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        const prod = results[selectedIndex];
        if (prod.stock <= 0) {
          useToastStore.getState().addToast(`El producto '${prod.nombre}' no tiene stock disponible.`, 'error');
        }
        
        addToCart({
          id: prod.id,
          nombre: prod.nombre,
          codigo: prod.codigo,
          precio_costo: Number(prod.precio_costo),
          precio_venta: Number(prod.precio_venta),
        });
        
        setQuery('');
        setResults([]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setQuery('');
      setResults([]);
    }
  };

  const handleSelectProduct = (prod: Product) => {
    addToCart({
      id: prod.id,
      nombre: prod.nombre,
      codigo: prod.codigo,
      precio_costo: Number(prod.precio_costo),
      precio_venta: Number(prod.precio_venta),
    });
    setQuery('');
    setResults([]);
  };

  return (
    <div className="relative w-full">
      {/* Input de Búsqueda */}
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="[F8] Escanear código o escribir nombre del producto..."
          className="
            w-full rounded-2xl border border-slate-200 bg-white px-6 py-4 pl-12 pr-12 text-sm text-slate-800 placeholder-slate-400
            transition-all duration-300 outline-none
            focus:border-orange-600 focus:bg-white focus:shadow-[0_4px_20px_-3px_rgba(16,185,129,0.12)] focus:ring-1 focus:ring-orange-600/20
          "
        />
        
        {/* Ícono de Búsqueda (Lupa) */}
        <div className="absolute left-4 text-slate-400">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="absolute right-4">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
          </div>
        )}
      </div>

      {/* Resultados de Búsqueda / Sugerencias Flotantes */}
      {results.length > 0 && (
        <div className="
          absolute left-0 right-0 z-50 mt-2 max-h-60 overflow-y-auto rounded-2xl border border-slate-200
          bg-white p-2 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200
        ">
          {results.map((prod, idx) => {
            const isSelected = selectedIndex === idx;
            return (
              <button
                key={prod.id}
                onClick={() => handleSelectProduct(prod)}
                className={`
                  flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition-all duration-200
                  ${isSelected 
                    ? 'bg-gradient-to-r from-orange-50 to-amber-50 text-slate-800 border-l-4 border-orange-600 font-medium' 
                    : 'text-slate-600 hover:bg-slate-50'
                  }
                `}
              >
                <div>
                  <div className="font-semibold text-sm">{prod.nombre}</div>
                  <div className="font-mono text-[11px] text-slate-400">Cod: {prod.codigo}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-orange-600">S/ {Number(prod.precio_venta).toFixed(2)}</div>
                  <div className={`text-[10px] ${prod.stock < 5 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                    Stock: {prod.stock}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ProductFinder;
