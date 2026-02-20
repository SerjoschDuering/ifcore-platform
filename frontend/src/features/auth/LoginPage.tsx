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
      <div style={styles.backdropGlow} />
      <div style={styles.card}>
        <div style={styles.brandRow}>
          <div style={styles.brandBadge}>AI</div>
          <div>
            <h1 style={styles.brand}>IFCore</h1>
            <p style={styles.tagline}>Compliance Platform Access</p>
          </div>
        </div>

        <p style={styles.subheading}>Sign in or create an account to continue.</p>

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
  );
}

const styles = {
  page: {
    position: "relative" as const,
    display: "grid",
    placeItems: "center",
    minHeight: "100vh",
    padding: "1.2rem",
    fontFamily: "inherit",
    overflow: "hidden",
  } as const,
  backdropGlow: {
    position: "absolute" as const,
    inset: 0,
    background:
      "radial-gradient(560px 320px at 50% 20%, rgba(79, 141, 255, 0.24), transparent 62%), radial-gradient(700px 440px at 40% 80%, rgba(53, 196, 255, 0.14), transparent 70%)",
    pointerEvents: "none" as const,
  } as const,
  card: {
    position: "relative" as const,
    zIndex: 1,
    width: "min(460px, 92vw)",
    borderRadius: 24,
    padding: "1.3rem",
    border: "1px solid var(--border-strong)",
    background: "rgba(18, 24, 36, 0.94)",
    boxShadow: "0 24px 60px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.08)",
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.65rem",
  } as const,
  brandRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.65rem",
  } as const,
  brandBadge: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    background: "rgba(79, 141, 255, 0.2)",
    border: "1px solid rgba(156, 202, 255, 0.42)",
    display: "grid",
    placeItems: "center",
    color: "#a8d4ff",
    fontSize: "0.72rem",
    fontWeight: 700,
  } as const,
  brand: {
    margin: 0,
    color: "var(--text)",
    fontSize: "1.16rem",
    fontWeight: 700,
    letterSpacing: "-0.01em",
  } as const,
  tagline: {
    margin: 0,
    fontSize: "0.78rem",
    color: "var(--text-muted)",
  } as const,
  subheading: {
    margin: "0 0 0.2rem",
    fontSize: "0.86rem",
    color: "var(--text-muted)",
  } as const,
  errorBox: {
    background: "rgba(239, 68, 68, 0.14)",
    border: "1px solid rgba(255, 120, 120, 0.35)",
    color: "#ffb4b4",
    padding: "0.6rem 0.72rem",
    borderRadius: 12,
    fontSize: "0.82rem",
  } as const,
  label: {
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "var(--text-muted)",
    marginTop: "0.15rem",
  } as const,
  input: {
    padding: "0.62rem 0.8rem",
    borderRadius: 12,
    border: "1px solid var(--border)",
    background: "rgba(30, 41, 61, 0.54)",
    color: "var(--text)",
    fontSize: "0.86rem",
    outline: "none",
    width: "100%",
    boxSizing: "border-box" as const,
  } as const,
  buttonRow: {
    display: "flex",
    gap: "0.62rem",
    marginTop: "0.45rem",
  } as const,
  btnPrimary: {
    flex: 1,
    padding: "0.62rem",
    background: "linear-gradient(145deg, rgba(92, 153, 255, 0.96), rgba(57, 112, 255, 0.92))",
    color: "#f6fbff",
    border: "1px solid rgba(177, 212, 255, 0.45)",
    borderRadius: 999,
    fontWeight: 600,
    fontSize: "0.86rem",
    cursor: "pointer",
    boxShadow: "0 10px 22px rgba(62, 121, 255, 0.32), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
  } as const,
  btnSecondary: {
    flex: 1,
    padding: "0.62rem",
    background: "rgba(255, 255, 255, 0.03)",
    color: "var(--text)",
    border: "1px solid var(--border)",
    borderRadius: 999,
    fontWeight: 600,
    fontSize: "0.86rem",
    cursor: "pointer",
  } as const,
};
