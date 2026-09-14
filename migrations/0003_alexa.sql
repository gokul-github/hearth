-- Alexa Skills Kit account linking (Hearth is the OAuth authorization server).

create table if not exists alexa_oauth_codes (
  code text primary key,
  user_id text not null,
  client_id text not null,
  redirect_uri text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists alexa_oauth_codes_user_id_idx on alexa_oauth_codes (user_id);

create table if not exists alexa_access_tokens (
  token_hash text primary key,
  user_id text not null,
  client_id text not null,
  refresh_hash text unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists alexa_access_tokens_user_id_idx on alexa_access_tokens (user_id);
