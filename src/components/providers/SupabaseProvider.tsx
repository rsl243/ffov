"use client";

import { SupabaseAuthProvider } from '@/contexts/SupabaseAuthContext';

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  return <SupabaseAuthProvider>{children}</SupabaseAuthProvider>;
}
