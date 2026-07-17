export { getSupabase, supabase } from './supabase/client';
export {
  signInWithEmail,
  signUpWithEmail,
  signOut,
  resetPassword,
  getSession,
} from './supabase/auth';
export {
  fetchProfile,
  createProfile,
  isProfileComplete,
  type Profile,
  type ProfileInsert,
} from './supabase/profile';
