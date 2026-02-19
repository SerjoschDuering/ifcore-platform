import { createFileRoute, redirect } from "@tanstack/react-router";
import { authClient } from "../lib/auth-client";
import { ProfilePage } from "../features/auth/ProfilePage";

export const Route = createFileRoute("/profile")({
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session?.data?.user) throw redirect({ to: "/login" });
  },
  component: ProfilePage,
});
