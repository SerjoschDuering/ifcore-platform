import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { authClient } from "../../lib/auth-client";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    setError(null);
    setLoading(true);
    const { error } = await authClient.signIn.email({ email, password });
    setLoading(false);
    if (error) { setError(error.message ?? "Sign in failed"); return; }
    navigate({ to: "/" });
  }

  async function handleSignUp() {
    if (!name.trim()) { setError("Name is required to sign up"); return; }
    setError(null);
    setLoading(true);
    const { error } = await authClient.signUp.email({ email, password, name });
    setLoading(false);
    if (error) { setError(error.message ?? "Sign up failed"); return; }
    navigate({ to: "/" });
  }

  return (
    <div style={styles.page}>
      <div style={styles.sidebar}>
        <div style={styles.brand}>IFCore</div>
        <p style={styles.tagline}>Building Compliance Platform</p>
      </div>
      <div style={styles.content}>
        <div style={styles.card}>
          <h2 style={styles.heading}>Welcome</h2>
          <p style={styles.subheading}>Sign in or create an account to continue</p>

          {error && <div style={styles.errorBox}>{error}</div>}

          <label style={styles.label}>Name (required for sign up)</label>
          <input
            style={styles.input}
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <label style={styles.label}>Email</label>
          <input
            style={styles.input}
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label style={styles.label}>Password</label>
          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
          />

          <div style={styles.buttonRow}>
            <button style={styles.btnPrimary} onClick={handleSignIn} disabled={loading}>
              {loading ? "..." : "Log In"}
            </button>
            <button style={styles.btnSecondary} onClick={handleSignUp} disabled={loading}>
              {loading ? "..." : "Sign Up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "Inter, sans-serif",
  } as const,
  sidebar: {
    width: 240,
    background: "linear-gradient(180deg, #1a3a8f 0%, #0d1f5c 100%)",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem",
  } as const,
  brand: {
    color: "#fff",
    fontSize: "1.75rem",
    fontWeight: 700,
    letterSpacing: "-0.02em",
  } as const,
  tagline: {
    color: "rgba(255,255,255,0.6)",
    fontSize: "0.8rem",
    textAlign: "center" as const,
    marginTop: "0.5rem",
  } as const,
  content: {
    flex: 1,
    background: "#f5f7fa",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  } as const,
  card: {
    background: "#fff",
    borderRadius: 12,
    padding: "2.5rem",
    width: 400,
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.75rem",
  } as const,
  heading: {
    margin: 0,
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#0d1f5c",
  } as const,
  subheading: {
    margin: 0,
    fontSize: "0.875rem",
    color: "#6b7280",
  } as const,
  errorBox: {
    background: "#fee2e2",
    color: "#dc2626",
    padding: "0.75rem 1rem",
    borderRadius: 8,
    fontSize: "0.875rem",
  } as const,
  label: {
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "#374151",
  } as const,
  input: {
    padding: "0.625rem 0.875rem",
    borderRadius: 8,
    border: "1px solid #d1d5db",
    fontSize: "0.9rem",
    outline: "none",
    width: "100%",
    boxSizing: "border-box" as const,
  } as const,
  buttonRow: {
    display: "flex",
    gap: "0.75rem",
    marginTop: "0.5rem",
  } as const,
  btnPrimary: {
    flex: 1,
    padding: "0.625rem",
    background: "#1a3a8f",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontWeight: 600,
    fontSize: "0.9rem",
    cursor: "pointer",
  } as const,
  btnSecondary: {
    flex: 1,
    padding: "0.625rem",
    background: "#f3f4f6",
    color: "#1a3a8f",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    fontWeight: 600,
    fontSize: "0.9rem",
    cursor: "pointer",
  } as const,
};
