import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder-key';

export function getIsMockMode(): boolean {
  if (typeof window === 'undefined') return true;
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim().replace(/['"]/g, '');
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim().replace(/['"]/g, '');
  
  return !url || 
         url === 'undefined' ||
         url.includes('placeholder') || 
         url.includes('placeholder-project') || 
         !key || 
         key === 'undefined' ||
         key.includes('placeholder') || 
         key.includes('placeholder-key') ||
         key.includes('placeholder-signature');
}

export const isMockMode = true; // Default fallback, but components should query getIsMockMode()

if (typeof window !== 'undefined' && getIsMockMode()) {
  console.warn('%c[BOOM POS] Corriendo en Modo Demo Local (Zustand DB). Los datos transaccionales se simulan y persisten localmente en el navegador.', 'color: #10b981; font-weight: bold; font-size: 12px;');
}

// Cliente Singleton para el navegador.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);


