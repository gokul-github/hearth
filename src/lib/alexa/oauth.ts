import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { getSql } from "@/lib/db";
import { alexaClientId, alexaClientSecret, isAllowedAlexaRedirect } from "./config.ts";
import { pkceMatches } from "./pkce.ts";

const CODE_TTL_MS = 10 * 60 * 1000;
const ACCESS_TTL_SEC = 60 * 60;
const REFRESH_TTL_MS = 180 * 24 * 60 * 60 * 1000;

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function token(): string {
  return randomBytes(32).toString("base64url");
}

function secretsEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function configuredClientSecret(): string | null {
  const secret = alexaClientSecret();
  if (secret) return secret;
  // Local/preview only — production must set ALEXA_OAUTH_CLIENT_SECRET.
  if (process.env.DATABASE_URL?.trim()) return null;
  return "hearth-alexa-preview-secret";
}

export function assertAlexaClient(clientId: string, clientSecret?: string): boolean {
  if (clientId !== alexaClientId()) return false;
  const expected = configuredClientSecret();
  if (!expected) return false;
  if (clientSecret === undefined) return true;
  return secretsEqual(clientSecret, expected);
}

export async function issueAuthorizationCode(input: {
  userId: string;
  clientId: string;
  redirectUri: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
}): Promise<string> {
  if (!isAllowedAlexaRedirect(input.redirectUri)) {
    throw new Error("Invalid redirect_uri");
  }
  if (input.clientId !== alexaClientId()) throw new Error("Unknown client");
  const method = input.codeChallengeMethod || (input.codeChallenge ? "S256" : "");
  if (method && method !== "S256" && method !== "plain") {
    throw new Error("invalid_request");
  }
  const code = token();
  const sql = await getSql();
  await sql`
    insert into alexa_oauth_codes (
      code, user_id, client_id, redirect_uri, expires_at, code_challenge, code_challenge_method
    )
    values (
      ${sha256(code)},
      ${input.userId},
      ${input.clientId},
      ${input.redirectUri},
      ${new Date(Date.now() + CODE_TTL_MS).toISOString()}::timestamptz,
      ${input.codeChallenge || null},
      ${method || null}
    )
  `;
  return code;
}

export async function exchangeAuthorizationCode(input: {
  code: string;
  clientId: string;
  redirectUri: string;
  codeVerifier?: string;
}): Promise<{ access_token: string; refresh_token: string; expires_in: number; token_type: "Bearer" }> {
  const sql = await getSql();
  const rows = await sql<{
    user_id: string;
    client_id: string;
    redirect_uri: string;
    expires_at: string;
    code_challenge: string | null;
    code_challenge_method: string | null;
  }>`
    select
      user_id,
      client_id,
      redirect_uri,
      expires_at::text as expires_at,
      code_challenge,
      code_challenge_method
    from alexa_oauth_codes
    where code = ${sha256(input.code)}
  `;
  const row = rows[0];
  await sql`delete from alexa_oauth_codes where code = ${sha256(input.code)}`;
  if (!row) throw new Error("invalid_grant");
  if (row.client_id !== input.clientId) throw new Error("invalid_grant");
  if (row.redirect_uri !== input.redirectUri) throw new Error("invalid_grant");
  if (Date.parse(row.expires_at) < Date.now()) throw new Error("invalid_grant");
  if (!pkceMatches(input.codeVerifier ?? "", row.code_challenge, row.code_challenge_method)) {
    throw new Error("invalid_grant");
  }
  return issueTokens(row.user_id, input.clientId);
}

export async function exchangeRefreshToken(input: {
  refreshToken: string;
  clientId: string;
}): Promise<{ access_token: string; refresh_token: string; expires_in: number; token_type: "Bearer" }> {
  const sql = await getSql();
  const hash = sha256(input.refreshToken);
  const rows = await sql<{
    user_id: string;
    client_id: string;
    refresh_expires_at: string | null;
  }>`
    select user_id, client_id, refresh_expires_at::text as refresh_expires_at
    from alexa_access_tokens
    where refresh_hash = ${hash}
  `;
  const row = rows[0];
  if (!row || row.client_id !== input.clientId) throw new Error("invalid_grant");
  if (row.refresh_expires_at && Date.parse(row.refresh_expires_at) < Date.now()) {
    throw new Error("invalid_grant");
  }
  // Keep the previous row so Alexa still has a valid token if this response is lost.
  return issueTokens(row.user_id, input.clientId);
}

async function issueTokens(userId: string, clientId: string) {
  const access = token();
  const refresh = token();
  const sql = await getSql();
  await sql`
    delete from alexa_access_tokens
    where refresh_expires_at is not null and refresh_expires_at < now()
  `;
  await sql`
    insert into alexa_access_tokens (
      token_hash, user_id, client_id, refresh_hash, expires_at, refresh_expires_at
    )
    values (
      ${sha256(access)},
      ${userId},
      ${clientId},
      ${sha256(refresh)},
      ${new Date(Date.now() + ACCESS_TTL_SEC * 1000).toISOString()}::timestamptz,
      ${new Date(Date.now() + REFRESH_TTL_MS).toISOString()}::timestamptz
    )
  `;
  return {
    access_token: access,
    refresh_token: refresh,
    expires_in: ACCESS_TTL_SEC,
    token_type: "Bearer" as const,
  };
}

export async function userIdFromAccessToken(accessToken: string | undefined): Promise<string | null> {
  if (!accessToken) return null;
  const sql = await getSql();
  const rows = await sql<{ user_id: string; expires_at: string }>`
    select user_id, expires_at::text as expires_at
    from alexa_access_tokens
    where token_hash = ${sha256(accessToken)}
  `;
  const row = rows[0];
  if (!row) return null;
  if (Date.parse(row.expires_at) < Date.now()) return null;
  return row.user_id;
}

export function parseBasicClient(header: string | null): { id: string; secret: string } | null {
  if (!header?.startsWith("Basic ")) return null;
  try {
    const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
    const idx = decoded.indexOf(":");
    if (idx < 0) return null;
    return { id: decoded.slice(0, idx), secret: decoded.slice(idx + 1) };
  } catch {
    return null;
  }
}
