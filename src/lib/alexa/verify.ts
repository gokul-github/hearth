import { X509Certificate, createVerify } from "node:crypto";
import { databaseConfigured } from "./config.ts";

const MAX_AGE_MS = 150_000;
const CERT_HOST = "s3.amazonaws.com";
const CERT_PATH = "/echo.api/";
const ECHO_HOST = "echo-api.amazon.com";

function firstPem(pem: string): string {
  const match = pem.match(/-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/);
  return match ? match[0] : pem;
}

/** Normalize and allowlist SignatureCertChainUrl (Alexa HTTPS hosting rules). */
export function isAlexaCertUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    url.hash = "";
    url.pathname = url.pathname.replace(/\/+/g, "/");
    if (url.protocol !== "https:") return false;
    if (url.hostname.toLowerCase() !== CERT_HOST) return false;
    if (url.port && url.port !== "443") return false;
    if (!url.pathname.startsWith(CERT_PATH)) return false;
    return true;
  } catch {
    return false;
  }
}

function header(headers: Headers, name: string): string | null {
  return headers.get(name) ?? headers.get(name.toLowerCase());
}

/**
 * Alexa signs HTTPS skill requests. Skip verification only on the local PGLite
 * path so you can curl the endpoint. Deployed apps always verify.
 */
export async function verifyAlexaSignature(request: Request, body: string): Promise<boolean> {
  if (!databaseConfigured()) {
    const certUrl = header(request.headers, "SignatureCertChainUrl");
    const signature = header(request.headers, "Signature-256");
    if (!certUrl && !signature) return true;
  }

  const certUrl = header(request.headers, "SignatureCertChainUrl");
  const signature = header(request.headers, "Signature-256");
  if (!certUrl || !signature) return false;
  if (!isAlexaCertUrl(certUrl)) return false;

  try {
    const parsed = JSON.parse(body) as { request?: { timestamp?: string } };
    const timestamp = parsed.request?.timestamp;
    if (!timestamp) return false;
    const age = Math.abs(Date.now() - Date.parse(timestamp));
    if (!Number.isFinite(age) || age > MAX_AGE_MS) return false;
  } catch {
    return false;
  }

  const res = await fetch(certUrl);
  if (!res.ok) return false;
  const pem = firstPem(await res.text());
  const cert = new X509Certificate(pem);
  const now = Date.now();
  if (new Date(cert.validFrom).getTime() > now) return false;
  if (new Date(cert.validTo).getTime() < now) return false;
  if (cert.checkHost(ECHO_HOST) === undefined && !cert.subject.includes(ECHO_HOST)) {
    const san = cert.subjectAltName ?? "";
    if (!san.includes(ECHO_HOST)) return false;
  }

  const verifier = createVerify("RSA-SHA256");
  verifier.update(body);
  verifier.end();
  return verifier.verify(cert.publicKey, signature, "base64");
}
