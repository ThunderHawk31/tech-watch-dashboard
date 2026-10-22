import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

// isAdmin ici ne sert qu'à l'affichage (afficher/cacher le sélecteur de note).
// La vérification qui compte se fait côté serveur, à chaque appel RPC
// (public.is_admin() relu dans set_note_perso/get_my_notes/...) — un front
// trompé ne donne aucun accès en écriture.
const AdminContext = createContext({
  session: null,
  isAdmin: false,
  loading: true,
  signOut: async () => {},
});

export function AdminProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshAdminStatus = useCallback(async (currentSession) => {
    if (!currentSession) {
      setIsAdmin(false);
      return;
    }
    try {
      const { data, error } = await supabase.rpc('is_admin');
      setIsAdmin(!error && data === true);
    } catch {
      setIsAdmin(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!active) return;
      setSession(s);
      refreshAdminStatus(s).finally(() => active && setLoading(false));
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      refreshAdminStatus(s);
      // Supabase atterrit sur le Site URL configuré (souvent juste la racine)
      // après un clic sur le lien de réinitialisation, quelle que soit la page
      // d'où la demande est partie. On redirige nous-mêmes vers la page qui
      // sait traiter cette session de récupération, pour ne jamais la perdre
      // silencieusement.
      if (event === 'PASSWORD_RECOVERY' && window.location.pathname !== '/admin-reset-password') {
        window.location.assign('/admin-reset-password');
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [refreshAdminStatus]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <AdminContext.Provider value={{ session, isAdmin, loading, signOut }}>
      {children}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => useContext(AdminContext);
