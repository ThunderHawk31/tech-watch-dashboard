-- ============================================================================
-- TechWatch — notation à l'aveugle : list_unrated_articles ne renvoie plus
-- importance / sector / sentiment / score_reason au navigateur.
--
-- A EXECUTER TOI-MEME dans le SQL Editor Supabase. Non appliqué par Claude Code.
--
-- DROP obligatoire : CREATE OR REPLACE ne peut pas changer les colonnes de
-- retour d'une fonction RETURNS TABLE. Les grants sont donc recréés ici.
-- `analysis` reste renvoyé : il alimente le menu "Plus de contexte" (points
-- clés / résumé), fermé par défaut. Pas de `url` : pas de lien vers l'original.
-- ============================================================================

begin;

drop function if exists public.list_unrated_articles(integer);

create function public.list_unrated_articles(p_limit integer default 20)
returns table (
  article_id uuid, title text, published_at timestamptz,
  source text, analysis text
)
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_limit is null or p_limit < 1 or p_limit > 100 then
    p_limit := 20;
  end if;

  return query
  select t.article_id, t.title, t.published_at, t.source, t.analysis
  from public.techwatch_articles t
  where t.note_perso is null
  order by t.published_at desc
  limit p_limit;
end;
$function$;

revoke all on function public.list_unrated_articles(integer) from public;
revoke execute on function public.list_unrated_articles(integer) from anon;
grant execute on function public.list_unrated_articles(integer) to authenticated;

commit;
