import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "./env";

export const SESSION_COOKIE_NAME = "hamrin_session";

const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30 days

export interface SessionPayload {
  installationId: string;
  stripeAccountId: string;
  issuedAt: number;
}

function getSecret(): string {
  const s = env.SESSION_SECRET;
  if (!s || s.length < 32) return "";
  return s;
}

function encodeBase64Url(buf: Buffer): string {
  return buf.toString("base64url");
}

function decodeBase64Url(str: string): Buffer | null {
  try {
    return Buffer.from(str, "base64url");
  } catch {
    return null;
  }
}

/**
 * Create a signed session string to set as the cookie value.
 * Returns empty string if SESSION_SECRET is not set (session disabled).
 */
export function createSessionToken(payload: SessionPayload): string {
  const secret = getSecret();
  if (!secret) return "";

  const payloadJson = JSON.stringify(payload);
  const payloadB64 = encodeBase64Url(Buffer.from(payloadJson, "utf-8"));
  const signature = createHmac("sha256", secret).update(payloadB64).digest();
  const sigB64 = encodeBase64Url(signature);

  return `${payloadB64}.${sigB64}`;
}

/**
 * Verify and parse the session cookie value. Returns null if invalid or session disabled.
 */
export function getSessionFromToken(token: string | undefined): SessionPayload | null {
  if (!token || !token.includes(".")) return null;

  const secret = getSecret();
  if (!secret) return null;

  const [payloadB64, sigB64] = token.split(".");
  if (!payloadB64 || !sigB64) return null;

  const expectedSig = createHmac("sha256", secret).update(payloadB64).digest();
  const receivedSig = decodeBase64Url(sigB64);
  if (!receivedSig || receivedSig.length !== expectedSig.length) return null;
  if (!timingSafeEqual(expectedSig, receivedSig)) return null;

  const payloadBuf = decodeBase64Url(payloadB64);
  if (!payloadBuf) return null;

  try {
    const payload = JSON.parse(payloadBuf.toString("utf-8")) as SessionPayload;
    if (
      typeof payload.installationId !== "string" ||
      typeof payload.stripeAccountId !== "string" ||
      typeof payload.issuedAt !== "number"
    ) {
      return null;
    }
    // Optional: reject if issuedAt too old (e.g. > 30 days)
    const maxAge = SESSION_MAX_AGE_SEC * 1000;
    if (Date.now() - payload.issuedAt > maxAge) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getSessionCookieOptions(): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
} {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  };
}

/** Whether session auth is enabled (SESSION_SECRET set and long enough). */
export function isSessionEnabled(): boolean {
  return getSecret().length >= 32;
}
