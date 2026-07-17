import { Session, User } from '@supabase/supabase-js';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { isSupabaseConfigured } from '@/config/env';
import { getSupabase } from '@/lib/supabase/client';
import { fetchProfile, isProfileComplete, type Profile } from '@/lib/supabase/profile';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  hasProfile: boolean;
  isLoading: boolean;
  isProfileLoading: boolean;
  isConfigured: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  const loadProfile = useCallback(async (userId: string) => {
    setIsProfileLoading(true);
    try {
      const data = await fetchProfile(userId);
      setProfile(data);
    } catch {
      setProfile(null);
    } finally {
      setIsProfileLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!session?.user?.id) {
      setProfile(null);
      return;
    }
    await loadProfile(session.user.id);
  }, [loadProfile, session]);

  useEffect(() => {
    const supabase = getSupabase();

    if (!supabase) {
      return;
    }

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setIsLoading(false);

      if (currentSession?.user?.id) {
        loadProfile(currentSession.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsLoading(false);

      if (nextSession?.user?.id) {
        loadProfile(nextSession.user.id);
      } else {
        setProfile(null);
        setIsProfileLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      hasProfile: isProfileComplete(profile),
      isLoading,
      isProfileLoading,
      isConfigured: isSupabaseConfigured,
      refreshProfile,
    }),
    [session, profile, isLoading, isProfileLoading, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
