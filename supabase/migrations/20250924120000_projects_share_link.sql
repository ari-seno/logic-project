-- Read-only project sharing.
-- A project can expose an unguessable token; anyone holding it can view the
-- project read-only at /share/<token>. Disabling sharing or rotating the token
-- revokes existing links.

alter table public.projects
  add column if not exists share_token text,
  add column if not exists share_enabled boolean not null default false;

create unique index if not exists projects_share_token_idx
  on public.projects (share_token)
  where share_token is not null;
