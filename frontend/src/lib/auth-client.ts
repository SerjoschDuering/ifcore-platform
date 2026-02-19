import { createAuthClient } from "better-auth/react";

let _client: ReturnType<typeof createAuthClient> | null = null;

function getClient() {
  if (!_client) {
    try {
      _client = createAuthClient({
        baseURL: window.location.origin + "/api/auth",
        fetchOptions: { credentials: "include" },
      });
    } catch (e) {
      console.warn("Auth client init failed, running in anonymous mode:", e);
    }
  }
  return _client;
}

const ANON_SESSION = { data: null, isPending: false, error: null } as const;

export function useSession() {
  const client = getClient();
  if (!client) return ANON_SESSION;
  try {
    return client.useSession();
  } catch {
    return ANON_SESSION;
  }
}

// Proxy that degrades gracefully — any method call returns a no-op
export const authClient = new Proxy({} as ReturnType<typeof createAuthClient>, {
  get(_target, prop) {
    const client = getClient();
    if (client) return (client as any)[prop];
    if (prop === "useSession") return () => ANON_SESSION;
    return () => Promise.resolve(null);
  },
});
