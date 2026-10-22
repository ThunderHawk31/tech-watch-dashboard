-- ============================================================================
-- TechWatch — note personnelle admin-only ("note_perso")
--
-- A EXECUTER TOI-MEME dans le SQL Editor Supabase, projet bdhggllidtuwtcygsupk.
-- Ce fichier n'est pas appliqué automatiquement par Claude Code.
--
-- Vérifications faites avant d'écrire ce fichier (lecture seule, 2026-10-22) :
--   - techwatch_articles.article_id est un uuid (PK), pas un int.
--   - RLS techwatch_articles : une seule policy "anyone_can_read" (SELECT USING true).
--     Aucune policy INSERT/UPDATE/DELETE n'existe -> ces opérations sont déjà
--     bloquées par RLS pour tout rôle qui n'est pas propriétaire de la table.
--   - Grants anon/authenticated sur techwatch_articles : SELECT colonne par colonne
--     uniquement (pas de blanket GRANT), aucun GRANT INSERT/UPDATE/DELETE au niveau
--     table. C'est le durcissement du 18/10 — ce script ne le remplace pas, il
--     ajoute des colonnes et NE touche à aucun grant/policy existant sur les
--     colonnes déjà présentes.
--   - auth.users contient 2 comptes dans ce projet (partagé avec InvestIQ) :
--       nolanfirstiron@gmail.com  -> id 98b438f9-ccc4-47b5-a423-837740bae207
--       nolan.mace49@gmail.com    -> id a69335d6-2779-4cdb-92fa-4fe4444781cf
--     Le check admin ci-dessous est volontairement restreint au PREMIER uuid.
--     ARRETE-TOI ET VERIFIE cette ligne avant d'exécuter si ce n'est pas le bon
--     compte : tout le modèle de sécurité repose sur cet UUID étant le tien et
--     uniquement le tien.
-- ============================================================================

begin;

-- 1. Colonnes ------------------------------------------------------------
alter table public.techwatch_articles
  add column if not exists note_perso smallint
    constraint note_perso_range check (note_perso between 1 and 5),
  add column if not exists note_perso_at timestamptz;

-- Générée : jamais écrite directement, par qui que ce soit (postgres compris) —
-- Postgres refuse toute écriture explicite sur une colonne GENERATED ALWAYS.
alter table public.techwatch_articles
  add column if not exists note_corrigee boolean
    generated always as (note_perso is not null and note_perso <> importance) stored;

comment on column public.techwatch_articles.note_perso is
  'Note manuelle admin (1-5), vérité terrain pour calibrer le prompt de scoring. Écrite uniquement via public.set_note_perso().';
comment on column public.techwatch_articles.note_perso_at is
  'Horodatage de la dernière note manuelle.';
comment on column public.techwatch_articles.note_corrigee is
  'true si note_perso diffère de importance (note auto corrigée). false si identique ou si pas encore noté. Colonne générée, non modifiable.';

-- 2. Verrou colonnes -------------------------------------------------------
-- Défense en profondeur : même si personne n'a aujourd'hui de GRANT UPDATE sur
-- la table, un futur "GRANT UPDATE ON techwatch_articles TO authenticated" pour
-- une autre fonctionnalité ne doit pas exposer note_perso/note_perso_at en même
-- temps. REVOKE explicite, indépendant de l'état actuel des grants.
revoke update (note_perso, note_perso_at) on public.techwatch_articles from anon, authenticated;

-- Lecture : le GRANT SELECT existant sur techwatch_articles pour anon/authenticated
-- est au niveau TABLE (pas colonne par colonne — vérifié : les 3 nouvelles colonnes
-- ont hérité automatiquement du SELECT public dès leur création, ce qu'un grant
-- colonne par colonne n'aurait pas fait). Un grant table-level ne peut pas être
-- neutralisé par un REVOKE colonne par colonne sur une colonne précise : il faut
-- révoquer le SELECT table-level puis le remplacer par un grant explicite listant
-- les colonnes publiques, en excluant note_perso/note_perso_at/note_corrigee.
-- Transaction unique pour qu'il n'y ait jamais d'instant où anon n'a plus aucun accès.
revoke select on public.techwatch_articles from anon, authenticated;

grant select (
  article_id, title, published_at, url, analysis, importance, sentiment,
  tickers, sector, tokens, created_at, title_en, original_title,
  impact_marches, opportunites, points_cles, source_count, source,
  score_reason, category, in_scope, slug
) on public.techwatch_articles to anon, authenticated;

-- 3. Index ------------------------------------------------------------------
-- Retrouver vite les articles pas encore notés (vue de notation).
create index if not exists idx_techwatch_articles_note_perso_null
  on public.techwatch_articles (published_at desc)
  where note_perso is null;

-- Retrouver vite les articles où la note manuelle diffère du score auto.
create index if not exists idx_techwatch_articles_note_corrigee
  on public.techwatch_articles (published_at desc)
  where note_corrigee;

-- 4. Table d'audit -----------------------------------------------------------
create table if not exists public.note_perso_audit (
  id bigint generated always as identity primary key,
  article_id uuid references public.techwatch_articles (article_id) on delete set null,
  admin_user_id uuid not null,
  old_note smallint,
  new_note smallint not null,
  changed_at timestamptz not null default now()
);

comment on table public.note_perso_audit is
  'Journal des modifications de note_perso. Écrit uniquement par public.set_note_perso() (SECURITY DEFINER). article_id -> NULL si l''article est supprimé plus tard, pour garder l''historique.';

alter table public.note_perso_audit enable row level security;
-- Aucune policy créée = aucun accès via PostgREST pour anon/authenticated,
-- RLS sans policy = deny-all pour tout rôle qui n'est pas propriétaire de la
-- table. Les fonctions SECURITY DEFINER (propriétaire postgres) contournent
-- RLS par définition et peuvent y écrire/lire normalement.
revoke all on public.note_perso_audit from anon, authenticated, public;

-- Note sur le "modifié plusieurs fois" évoqué en discussion : pas de colonne
-- dédiée. `select count(*) from note_perso_audit where article_id = ...` donne
-- directement le nombre de corrections — pas besoin de dupliquer l'info.

-- 5. Fonction : is_admin() ---------------------------------------------------
-- Pas besoin de SECURITY DEFINER ici : auth.uid() est appelable par n'importe
-- quel rôle authentifié sans privilège élevé. Moins de privilège = plus sûr.
create or replace function public.is_admin()
returns boolean
language sql
stable
security invoker
set search_path to ''
as $function$
  select auth.uid() = '98b438f9-ccc4-47b5-a423-837740bae207'::uuid;
$function$;

comment on function public.is_admin() is
  'Vrai uniquement pour le compte admin TechWatch (UUID en dur, jamais dérivé d''une colonne modifiable par l''utilisateur).';

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- 6. Fonction : set_note_perso(article_id, note) -----------------------------
create or replace function public.set_note_perso(p_article_id uuid, p_note smallint)
returns table (
  article_id uuid, note_perso smallint, note_perso_at timestamptz,
  note_corrigee boolean, importance integer
)
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_old_note smallint;
  v_recent_writes integer;
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_note is null or p_note < 1 or p_note > 5 then
    raise exception 'note_perso must be between 1 and 5';
  end if;

  -- Débit généreux pour un rythme de notation manuelle (une toutes les 3s
  -- en continu), mais assez bas pour bloquer une rafale anormale (bug
  -- client, boucle, script) plutôt que de la laisser tourner.
  select count(*) into v_recent_writes
  from public.note_perso_audit
  where admin_user_id = auth.uid()
    and changed_at > now() - interval '1 minute';

  if v_recent_writes >= 20 then
    raise exception 'rate limit exceeded: max 20 writes/min';
  end if;

  select t.note_perso into v_old_note
  from public.techwatch_articles t
  where t.article_id = p_article_id;

  if not found then
    raise exception 'article not found';
  end if;

  update public.techwatch_articles t
  set note_perso = p_note,
      note_perso_at = now()
  where t.article_id = p_article_id;

  insert into public.note_perso_audit (article_id, admin_user_id, old_note, new_note)
  values (p_article_id, auth.uid(), v_old_note, p_note);

  return query
  select t.article_id, t.note_perso, t.note_perso_at, t.note_corrigee, t.importance
  from public.techwatch_articles t
  where t.article_id = p_article_id;
end;
$function$;

comment on function public.set_note_perso(uuid, smallint) is
  'Seul point d''écriture de note_perso. Vérifie is_admin() + limite de débit avant d''écrire, journalise dans note_perso_audit.';

-- ATTENTION : Supabase a une default privilege sur le schéma public qui donne
-- EXECUTE à anon ET authenticated directement (pas via PUBLIC) sur toute
-- nouvelle fonction créée par postgres. "revoke all ... from public" ne retire
-- donc PAS ce droit à anon — il faut le révoquer explicitement.
revoke all on function public.set_note_perso(uuid, smallint) from public;
revoke execute on function public.set_note_perso(uuid, smallint) from anon;
grant execute on function public.set_note_perso(uuid, smallint) to authenticated;

-- 7. Fonction : get_my_notes(article_ids) ------------------------------------
-- Utilisée par le front pour afficher "ta note" à côté de la note auto sur les
-- articles déjà visibles à l'écran (liste paginée, modale).
create or replace function public.get_my_notes(p_article_ids uuid[])
returns table (
  article_id uuid, note_perso smallint, note_perso_at timestamptz, note_corrigee boolean
)
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
  select t.article_id, t.note_perso, t.note_perso_at, t.note_corrigee
  from public.techwatch_articles t
  where t.article_id = any (p_article_ids);
end;
$function$;

revoke all on function public.get_my_notes(uuid[]) from public;
revoke execute on function public.get_my_notes(uuid[]) from anon;
grant execute on function public.get_my_notes(uuid[]) to authenticated;

-- 8. Fonction : list_unrated_articles(limit) ---------------------------------
-- Alimente la vue de notation : articles sans note_perso, les plus récents
-- d'abord, via l'index partiel créé plus haut.
create or replace function public.list_unrated_articles(p_limit integer default 20)
returns table (
  article_id uuid, slug text, title text, published_at timestamptz,
  importance integer, sector text, sentiment text, analysis text, score_reason text
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
  select t.article_id, t.slug, t.title, t.published_at,
         t.importance, t.sector, t.sentiment, t.analysis, t.score_reason
  from public.techwatch_articles t
  where t.note_perso is null
  order by t.published_at desc
  limit p_limit;
end;
$function$;

revoke all on function public.list_unrated_articles(integer) from public;
revoke execute on function public.list_unrated_articles(integer) from anon;
grant execute on function public.list_unrated_articles(integer) to authenticated;

-- 9. Fonction : export_notes_dataset(limit, offset) --------------------------
-- Dataset pour l'export CSV (comparaison note auto / note perso). Paginée :
-- 933 articles aujourd'hui, le plafond Supabase par défaut est 1000 lignes.
create or replace function public.export_notes_dataset(p_limit integer default 1000, p_offset integer default 0)
returns table (
  article_id uuid, slug text, title text, published_at timestamptz,
  importance integer, note_perso smallint, note_perso_at timestamptz, note_corrigee boolean
)
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_limit is null or p_limit < 1 or p_limit > 1000 then
    p_limit := 1000;
  end if;
  if p_offset is null or p_offset < 0 then
    p_offset := 0;
  end if;

  return query
  select t.article_id, t.slug, t.title, t.published_at,
         t.importance, t.note_perso, t.note_perso_at, t.note_corrigee
  from public.techwatch_articles t
  order by t.published_at desc
  limit p_limit offset p_offset;
end;
$function$;

revoke all on function public.export_notes_dataset(integer, integer) from public;
revoke execute on function public.export_notes_dataset(integer, integer) from anon;
grant execute on function public.export_notes_dataset(integer, integer) to authenticated;

-- 10. Nettoyage hebdomadaire : ne jamais supprimer un article noté -----------
-- Option retenue : exclusion simple (note_perso is null) plutôt qu'une table
-- d'évaluation séparée qui dupliquerait le contenu. set_note_perso() et
-- export_notes_dataset() sont déjà la source unique de vérité pour les
-- articles notés ; une table séparée n'ajouterait que de la maintenance.
-- A reconsidérer seulement si le volume noté devenait disproportionné par
-- rapport au volume total conservé.
--
-- Cette fonction existait déjà (appelée par le workflow n8n, pas modifiée ici
-- côté n8n) — seule la clause WHERE change, le reste est identique à l'original.
create or replace function public.cleanup_old_articles()
returns json
language plpgsql
security definer
set search_path to ''
as $function$
declare
  deleted_articles integer;
  deleted_skipped integer;
begin
  delete from public.techwatch_articles
  where note_perso is null
    and (
      (importance <= 1 and published_at < now() - interval '3 weeks')
      or (importance between 2 and 3 and published_at < now() - interval '13 weeks')
      or (importance = 4 and published_at < now() - interval '11 weeks')
      or (importance = 5 and published_at < now() - interval '52 weeks')
    );

  get diagnostics deleted_articles = row_count;

  delete from public.techwatch_skipped
  where skipped_at < now() - interval '4 weeks';

  get diagnostics deleted_skipped = row_count;

  return json_build_object(
    'deleted_articles', deleted_articles,
    'deleted_skipped', deleted_skipped
  );
end;
$function$;

commit;

-- ============================================================================
-- Après exécution, vérifier :
--   select note_perso, note_perso_at, note_corrigee from public.techwatch_articles limit 1;
--   select public.is_admin();  -- doit renvoyer true si exécuté en tant que toi via l'API avec ton JWT, false/erreur sinon
-- ============================================================================
