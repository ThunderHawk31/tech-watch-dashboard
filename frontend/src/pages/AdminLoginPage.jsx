import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../lib/supabaseClient';
import { useAdmin } from '../contexts/AdminContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

// Route volontairement non liée dans la nav (header, menu mobile). Accès
// uniquement par URL directe. Le sign-up est désactivé côté Supabase Auth.
const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAdmin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isAdmin) {
    navigate('/admin-review', { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        // Message volontairement générique : ne pas révéler si l'email existe.
        toast.error('Connexion refusée');
        return;
      }
      toast.success('Connecté');
      navigate('/admin-review', { replace: true });
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error('Entre ton email d\'abord');
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin-reset-password`,
    });
    // Message générique dans les deux cas : ne pas révéler si l'email existe.
    if (error) {
      toast.error('Envoi impossible pour le moment');
      return;
    }
    toast.success('Si ce compte existe, un email a été envoyé');
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-sm">
      <h1 className="text-2xl font-semibold mb-6">Connexion admin</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="admin-email">Email</Label>
          <Input
            id="admin-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="admin-password">Mot de passe</Label>
          <Input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" disabled={submitting} className="mt-2">
          {submitting ? 'Connexion…' : 'Se connecter'}
        </Button>
        <button
          type="button"
          onClick={handleForgotPassword}
          className="text-sm text-muted-foreground hover:text-foreground underline text-center"
        >
          Mot de passe oublié ?
        </button>
      </form>
    </div>
  );
};

export default AdminLoginPage;
