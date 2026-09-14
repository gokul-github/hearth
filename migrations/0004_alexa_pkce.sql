-- PKCE for Alexa account linking, plus refresh-token expiry.

alter table alexa_oauth_codes
  add column if not exists code_challenge text,
  add column if not exists code_challenge_method text;

alter table alexa_access_tokens
  add column if not exists refresh_expires_at timestamptz;
