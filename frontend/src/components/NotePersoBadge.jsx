import { useState } from 'react';
import { toast } from 'sonner';
import { PenLine } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover';
import { Badge } from './ui/badge';
import { supabase } from '../lib/supabaseClient';

// Visible uniquement par l'admin connecté (le parent ne monte ce composant
// que si useAdmin().isAdmin est vrai). L'écriture reste vérifiée côté serveur
// par set_note_perso() quoi qu'il arrive côté front.
const NotePersoBadge = ({ articleId, notePerso, noteCorrigee, onChange }) => {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const handlePick = async (note) => {
    setSaving(true);
    try {
      const { data, error } = await supabase.rpc('set_note_perso', {
        p_article_id: articleId,
        p_note: note,
      });
      if (error) {
        toast.error('Note non enregistrée', { description: error.message });
        return;
      }
      const row = Array.isArray(data) ? data[0] : data;
      onChange?.(articleId, row);
      toast.success(`Ta note : ${note}`);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          aria-label="Noter manuellement cet article"
          title="Ta note"
        >
          <Badge
            variant="outline"
            className={`gap-1 cursor-pointer ${noteCorrigee ? 'border-amber-500 text-amber-500' : ''}`}
          >
            <PenLine className="w-3 h-3" />
            {notePerso ? `Ta note : ${notePerso}` : 'Noter'}
          </Badge>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" onClick={(e) => e.stopPropagation()}>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              disabled={saving}
              onClick={() => handlePick(n)}
              className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${
                n === notePerso
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotePersoBadge;
