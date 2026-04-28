import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';

export type AuthSession = Session;

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? '';

export const isAuthConfigured = supabaseUrl.length > 0 && supabaseAnonKey.length > 0;

const client: SupabaseClient | null = isAuthConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

export const getSupabaseClient = (): SupabaseClient | null => client;

const requireSupabaseClient = (): SupabaseClient => {
  if (!client) throw new Error('Supabase account sync is not configured.');
  return client;
};

export const getAuthSession = async (): Promise<AuthSession | null> => {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);
  return data.session;
};

export const onAuthSessionChange = (callback: (session: AuthSession | null) => void): (() => void) => {
  const supabase = getSupabaseClient();
  if (!supabase) return () => undefined;

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return () => data.subscription.unsubscribe();
};

export const signInWithEmail = async (email: string, password: string): Promise<void> => {
  const supabase = requireSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
};

export const signUpWithEmail = async (email: string, password: string): Promise<void> => {
  const supabase = requireSupabaseClient();
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) throw new Error(error.message);
};

export const signInWithGoogle = async (): Promise<void> => {
  const supabase = requireSupabaseClient();
  const redirectTo = typeof window === 'undefined' ? undefined : window.location.origin;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo
    }
  });
  if (error) throw new Error(error.message);
};

export const signOut = async (): Promise<void> => {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
};
