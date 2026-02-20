import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSession, authClient } from "../lib/auth-client";
import { useState } from "react";
import "../styles/auth.css";

function ProfilePage() {
  const navigate = useNavigate();
  const { data: session, isLoading, refetch } = useSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Redirect to login if not authenticated
  if (!isLoading && !session) {
    navigate({ to: "/auth/login" });
    return null;
  }

  async function handleLogout() {
    try {
      setIsLoggingOut(true);
      await authClient.signOut();
      await refetch();
      navigate({ to: "/" });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
    }
  }

  if (isLoading) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          {session.user.image && (
            <img
              src={session.user.image}
              alt={session.user.name}
              className="profile-avatar"
            />
          )}
          <div className="profile-info">
            <h1>{session.user.name || "User"}</h1>
            <p className="role-badge">{session.user.role}</p>
          </div>
        </div>

        <div className="profile-details">
          <div className="detail-item">
            <label>Email</label>
            <p>{session.user.email || "Not set"}</p>
          </div>

          {session.user.id && (
            <div className="detail-item">
              <label>User ID</label>
              <p className="mono">{session.user.id}</p>
            </div>
          )}

          {session.expiresAt && (
            <div className="detail-item">
              <label>Session Expires</label>
              <p>{new Date(session.expiresAt).toLocaleString()}</p>
            </div>
          )}
        </div>

        <div className="profile-actions">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="logout-button"
          >
            {isLoggingOut ? "Logging out..." : "Log Out"}
          </button>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});
