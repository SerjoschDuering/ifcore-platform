import { useEffect, useState, useCallback } from "react";

export interface User {
  id: string;
  name?: string;
  email?: string;
  emailVerified?: boolean;
  image?: string;
  role: "member" | "captain";
  createdAt?: string;
  updatedAt?: string;
}

export interface Session {
  user: User;
  expiresAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthClient {
  signUp: (email: string, password: string, name: string) => Promise<Session>;
  signIn: (email: string, password: string) => Promise<Session>;
  signOut: () => Promise<void>;
  getSession: () => Promise<Session | null>;
}

const API_BASE = "/api/auth";

/**
 * Create auth client for communicating with Better Auth endpoints
 */
export function createAuthClient(): AuthClient {
  return {
    async signUp(email, password, name) {
      const res = await fetch(`${API_BASE}/sign-up`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Sign up failed");
      }

      return res.json();
    },

    async signIn(email, password) {
      const res = await fetch(`${API_BASE}/sign-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Sign in failed");
      }

      return res.json();
    },

    async signOut() {
      const res = await fetch(`${API_BASE}/sign-out`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Sign out failed");
      }
    },

    async getSession() {
      try {
        const res = await fetch(`${API_BASE}/session`, {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          if (res.status === 401) {
            return null;
          }
          throw new Error("Failed to fetch session");
        }

        return res.json();
      } catch (error) {
        console.error("Error fetching session:", error);
        return null;
      }
    },
  };
}

const authClient = createAuthClient();

/**
 * React hook to access current session
 * Returns { data: Session | null, isLoading: boolean, error: Error | null }
 */
export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await authClient.getSession();
      setSession(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  return {
    data: session,
    isLoading,
    error,
    refetch: fetchSession,
  };
}

export { authClient };
