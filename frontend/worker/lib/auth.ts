import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import type { Bindings } from "../types";
import * as schema from "./schema";

function uint8ToBase64(arr: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]);
  return btoa(binary);
}

function base64ToUint8(b64: string): Uint8Array {
  const binary = atob(b64);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return arr;
}

const ITERATIONS = 10_000;

async function pbkdf2Hash(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" }, key, 256
  );
  return `pbkdf2:${ITERATIONS}:${uint8ToBase64(salt)}:${uint8ToBase64(new Uint8Array(bits))}`;
}

async function pbkdf2Verify(data: { password: string; hash: string }): Promise<boolean> {
  const parts = data.hash.split(":");
  if (parts[0] !== "pbkdf2") return false;
  const iterations = parseInt(parts[1]);
  const salt = base64ToUint8(parts[2]);
  const expected = parts[3];
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(data.password), "PBKDF2", false, ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" }, key, 256
  );
  return uint8ToBase64(new Uint8Array(bits)) === expected;
}

let _authInstance: ReturnType<typeof betterAuth> | null = null;

export function createAuth(env: Bindings) {
  if (_authInstance) return _authInstance;
  const db = drizzle(env.DB, { schema });

  _authInstance = betterAuth({
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL || "https://ifcore-platform.tralala798.workers.dev",
    basePath: "/api/auth",
    database: drizzleAdapter(db, { provider: "sqlite" }),
    trustedOrigins: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://localhost:5176",
      "https://ifcore-platform.pages.dev",
      "https://ifcore-platform.tralala798.workers.dev",
    ],
    user: {
      tableName: "users",
    },
    emailAndPassword: {
      enabled: true,
      password: { hash: pbkdf2Hash, verify: pbkdf2Verify },
    },
  });
  return _authInstance;
}

/** Extract current user from session cookie. Returns null if not authenticated. */
export async function getSessionUser(env: Bindings, req: Request): Promise<{ id: string; email: string; name: string | null } | null> {
  try {
    const auth = createAuth(env);
    const session = await auth.api.getSession({ headers: req.headers });
    return session?.user ?? null;
  } catch {
    return null;
  }
}
