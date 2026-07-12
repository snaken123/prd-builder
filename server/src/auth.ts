import jwt from "jsonwebtoken";

const SESSION_COOKIE = "admin_session";
const MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET is not set");
  return s;
}

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

export function createSessionCookie(): string {
  const token = jwt.sign({ role: "admin" }, secret(), { expiresIn: MAX_AGE_SECONDS });
  const secureFlag = isProduction() ? " Secure;" : "";
  return `${SESSION_COOKIE}=${token}; HttpOnly;${secureFlag} SameSite=Lax; Path=/; Max-Age=${MAX_AGE_SECONDS}`;
}

export function clearSessionCookie(): string {
  const secureFlag = isProduction() ? " Secure;" : "";
  return `${SESSION_COOKIE}=; HttpOnly;${secureFlag} SameSite=Lax; Path=/; Max-Age=0`;
}

export function isValidSession(cookieHeader: string | undefined): boolean {
  if (!cookieHeader) return false;
  const match = cookieHeader.match(new RegExp(`(?:^|; )${SESSION_COOKIE}=([^;]+)`));
  if (!match) return false;
  try {
    jwt.verify(match[1], secret());
    return true;
  } catch {
    return false;
  }
}

export function checkPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) throw new Error("ADMIN_PASSWORD is not set");
  return password === expected;
}
