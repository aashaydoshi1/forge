import { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';

interface AuthUIState {
  isPasswordVisible: boolean;
  togglePasswordVisibility: () => void;
}

export const useAuthUIStore = create<AuthUIState>((set) => ({
  isPasswordVisible: false,
  togglePasswordVisibility: () => set((state) => ({ isPasswordVisible: !state.isPasswordVisible })),
}));

export type AuthSession = Session | null;
export type AuthUser = User | null;
