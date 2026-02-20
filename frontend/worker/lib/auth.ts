import { betterAuth } from "better-auth";
import { d1 } from "better-auth/database";
import type { Bindings } from "../types";

export function createAuthInstance(env: Bindings) {
  return betterAuth({
    database: d1(env.DB),
    secret: env.BETTER_AUTH_SECRET || "development-secret-change-in-production",
    baseURL: env.BETTER_AUTH_URL || "http://localhost:5173",
    appName: "IFCore",
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      // Better Auth uses PBKDF2 by default (works in Cloudflare Workers)
    },
    user: {
      additionalFields: {
        role: {
          type: "string",
          default: "member",
          required: false,
        },
      },
    },
    trustedOrigins: [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://ifcore-platform.tralala798.workers.dev",
    ],
  });
}

export type AuthInstance = ReturnType<typeof createAuthInstance>;
