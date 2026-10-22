import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../lib/supabaseClient';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

// Atteinte via le lien envoyé par Supabase ("mot de passe oublié" / reset
// admin depuis le dashboard). Le lien contient un jeton de récupération dans
// l'URL qu'on laisse supabase-js convertir en session temporaire (détection
// automatique au chargement du client, cf. lib/supabaseClient.js) ; cette
// page se contente d'afficher le formulaire une fois cette session présente.
const AdminResetPasswordPage = () => {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
      setReady(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(!!session);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('8 caractères minimum');
      return;
    }
    if (password !== confirm) {
      toast.error('Les deux mots de passe ne correspondent pas');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error('Échec de la mise à jour', { description: error.message });
        return;
      }
      toast.success('Mot de passe mis à jour');
      navigate('/admin-review', { replace: true });
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready) return null;

  if (!hasSession) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-sm text-center">
        <p className="text-muted-foreground mb-4">
          Lien invalide ou expiré. Redemande un lien de réinitialisation.
        </p>
        <Button variant="outline" onClick={() => navigate('/admin-login')}>
          Retour à la connexion
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-sm">
      <h1 className="text-2xl font-semibold mb-6">Nouveau mot de passe</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-password">Nouveau mot de passe</Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirm-password">Confirme-le</Label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={8}
          />
        </div>
        <Button type="submit" disabled={submitting} className="mt-2">
          {submitting ? 'Enregistrement…' : 'Valider'}
        </Button>
      </form>
    </div>
  );
};

export default AdminResetPasswordPage;
