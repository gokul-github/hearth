import { createHash, timingSafeEqual } from "node:crypto";

/** RFC 7636 S256: BASE64URL(SHA256(verifier)). */
export function s256Challenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

export function pkceMatches(
  verifier: string,
  challenge: string | null | undefined,
  method: string | null | undefined,
): boolean {
  if (!challenge) return true;
  if (!verifier) return false;
  const computed = method === "plain" ? verifier : s256Challenge(verifier);
  const a = Buffer.from(computed);
  const b = Buffer.from(challenge);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
