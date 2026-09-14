const env = (key: string): string | undefined => {
  const value = process.env[key]?.trim();
  return value ? value : undefined;
};

/** OAuth client id Alexa sends. Set the same value in the Alexa developer console. */
export function alexaClientId(): string {
  return env("ALEXA_OAUTH_CLIENT_ID") ?? "hearth-alexa";
}

/** Shared secret Alexa uses at the token endpoint. Required when DATABASE_URL is set. */
export function alexaClientSecret(): string | undefined {
  return env("ALEXA_OAUTH_CLIENT_SECRET");
}

/** Optional: reject skill requests whose applicationId does not match. */
export function alexaSkillId(): string | undefined {
  return env("ALEXA_SKILL_ID");
}

export function databaseConfigured(): boolean {
  return Boolean(env("DATABASE_URL"));
}

const AMAZON_REDIRECT =
  /^https:\/\/(pitangui\.amazon\.com|layla\.amazon\.com|alexa\.amazon\.co\.jp)\/api\/skill\/link\/[A-Za-z0-9._~-]+$/;

export function isAllowedAlexaRedirect(uri: string): boolean {
  return AMAZON_REDIRECT.test(uri);
}
