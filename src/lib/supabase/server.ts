import { createClient } from '@supabase/supabase-js';

export function getIsServerMockMode(): boolean {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim().replace(/['"]/g, '');
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim().replace(/['"]/g, '');
  
  const isMock = !url || 
                 url === 'undefined' ||
                 url.includes('placeholder') || 
                 url.includes('placeholder-project') || 
                 !key || 
                 key === 'undefined' ||
                 key.includes('placeholder') || 
                 key.includes('placeholder-key') ||
                 key.includes('placeholder-signature');
                 
  console.log('[BOOM POS SERVER] getIsServerMockMode URL:', url);
  console.log('[BOOM POS SERVER] getIsServerMockMode RESULT:', isMock);
  return isMock;
}

export const isServerMockMode = true; // Default fallback, but functions should query getIsServerMockMode()

export function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder-key';

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
  });
}


