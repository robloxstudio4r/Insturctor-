import { supabase } from './supabase.js';

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUp({ email, password, full_name, role }) {
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { full_name, role: role || 'student' } }
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getProfile() {
  const s = await getSession();
  if (!s) return null;
  const { data, error } = await supabase
    .from('profiles').select('*').eq('id', s.user.id).maybeSingle();
  if (error) throw error;
  return data;
}

export function onAuth(cb) {
  supabase.auth.onAuthStateChange((_e, s) => cb(s));
}
