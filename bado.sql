-- Supprimer les triggers et fonctions existants
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
DROP TRIGGER IF EXISTS update_utilisateur_updated_at ON public.utilisateur;

-- Supprimer les fonctions
DROP FUNCTION IF EXISTS handle_new_user;
DROP FUNCTION IF EXISTS handle_user_updated;
DROP FUNCTION IF EXISTS update_updated_at_column;

-- Supprimer les tables inutiles
DROP TABLE IF EXISTS public.utilisateur_rappels;
DROP TABLE IF EXISTS public.cours_rappels;

-- Enable les extensions nécessaires
create extension if not exists "uuid-ossp";

-- Table principale Utilisateur avec une colonne rappel
create table public.utilisateur (
    id uuid primary key references auth.users(id),
    sub text null,
    full_name text null,
    email text null,
    avatar_url text null,
    "group" char(2) default null,
    api_requests_count integer default 0,
    rappel integer default 15 not null check (rappel > 0),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Fonction pour synchroniser les métadonnées utilisateur et définir le rappel par défaut
create or replace function handle_new_user()
returns trigger as $$
begin
    -- Insérer le nouvel utilisateur avec le rappel défini à 15 minutes par défaut
    insert into public.utilisateur (id, sub, full_name, email, avatar_url, rappel)
    values (
        new.id,
        new.raw_user_meta_data->>'sub',
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'email',
        new.raw_user_meta_data->>'avatar_url',
        15 -- Rappel par défaut de 15 minutes
    );
    
    return new;
end;
$$ language plpgsql security definer;

-- Trigger pour gérer les nouveaux utilisateurs
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function handle_new_user();

-- Fonction pour mettre à jour les métadonnées utilisateur
create or replace function handle_user_updated()
returns trigger as $$
begin
    update public.utilisateur
    set
        sub = new.raw_user_meta_data->>'sub',
        full_name = new.raw_user_meta_data->>'full_name',
        email = new.raw_user_meta_data->>'email',
        avatar_url = new.raw_user_meta_data->>'avatar_url',
        updated_at = now()
    where id = new.id;
    return new;
end;
$$ language plpgsql security definer;

-- Trigger pour gérer les mises à jour des utilisateurs
create trigger on_auth_user_updated
    after update of raw_user_meta_data on auth.users
    for each row execute function handle_user_updated();

-- Trigger pour mettre à jour updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger update_utilisateur_updated_at
    before update on public.utilisateur
    for each row
    execute function update_updated_at_column();

-- Policies pour la sécurité RLS
alter table public.utilisateur enable row level security;

-- Policies pour utilisateur
create policy "Les utilisateurs peuvent voir leur propre profil"
    on public.utilisateur for select
    using (auth.uid() = id);

create policy "Les utilisateurs peuvent modifier leur propre profil"
    on public.utilisateur for update
    using (auth.uid() = id);

create policy "Les utilisateurs peuvent supprimer leur propre profil"
	on public.utilisateur for delete
	using (auth.uid() = id);

-- Ajout des contraintes d'unicité
alter table public.utilisateur 
    add constraint utilisateur_sub_unique unique (sub),
    add constraint utilisateur_full_name_unique unique (full_name),
    add constraint utilisateur_email_unique unique (email);



















----------------------------------------------------------------------------------------------------------------------
-- Cette fonction trie par ordre alphabétique les utilisateurs d'un groupe entré en paramètre
DROP FUNCTION IF EXISTS trie_par_groupe(groupe varchar);
CREATE OR REPLACE FUNCTION trie_par_groupe(groupe varchar) RETURNS setof utilisateur
AS $$

BEGIN
	PERFORM *
	FROM    utilisateur
	WHERE   "group" LIKE groupe || '%';

	IF NOT FOUND THEN
		RAISE EXCEPTION 'Le groupe % est inexistant', groupe;
	END IF;

	RETURN QUERY
	SELECT          *
	FROM            utilisateur
	WHERE           "group" LIKE groupe || '%'
	ORDER BY        full_name;
END;

$$ LANGUAGE PlpgSQL;

SELECT * FROM trie_par_groupe('A');



-- -- Cette fonction permet de modifier le rappel de l'utilisateur en fonction de son id et du temps passer en paramètre
-- DROP FUNCTION IF EXISTS modifier_rappel(identifiant uuid, nouveau_rappel integer);
-- CREATE OR REPLACE FUNCTION modifier_rappel(identifiant uuid, nouveau_rappel integer) RETURNS VOID
-- AS $$
--
-- BEGIN
-- 	PERFORM id
-- 	FROM    utilisateur
-- 	WHERE   id = identifiant;
--
-- 	IF NOT FOUND THEN
-- 		RAISE EXCEPTION 'identifiant inexistant : %', identifiant;
-- 	END IF;
--
-- 	UPDATE utilisateur SET rappel = nouveau_rappel WHERE id = identifiant;
--
--   RETURN;
--
-- END;
-- $$ LANGUAGE PlpgSQL;


-- Cette fonction incrémente de 1 le nombre de requete faite de l'utilisateur entré en paramètre. Cela correspond à son nombre de requête faite à l'API
DROP FUNCTION IF EXISTS incrementation_nb_requete(identifiant id);
CREATE OR REPLACE FUNCTION incrementation_nb_requete(identifiant id) RETURNS VOID
AS $$

BEGIN
	PERFORM id
	FROM    utilisateur
	WHERE   id = identifiant;

	IF NOT FOUND THEN
		RAISE EXCEPTION 'identifiant inexistant : %', identifiant;
	END IF;

	UPDATE utilisateur SET api_requests_count = api_requests_count + 1 WHERE id = identifiant;

  RETURN;

END;
$$ LANGUAGE PlpgSQL;


