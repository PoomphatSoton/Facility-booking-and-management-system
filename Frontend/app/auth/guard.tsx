import { Navigate } from "react-router";
import { useAuth } from "./auth-middleware";
import type { UserRole } from "~/services/types";

type RoleGuardProps = {
  allow: UserRole[];
  children: React.ReactNode;
};
export function Guard({ allow, children }: RoleGuardProps) {
  const { user, loading } = useAuth();

  if (loading) return <p>Loading...</p>;

  if (!user) return <Navigate to="/" replace />;

  if (!allow.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}