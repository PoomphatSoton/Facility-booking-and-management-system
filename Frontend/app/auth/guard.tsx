import { Navigate } from "react-router";
import { useAuth } from "./auth-middleware";
import { firebaseAuth } from "~/config/firebase";
import type { UserRole } from "~/services/types";

type RoleGuardProps = {
  allow: UserRole[];
  children: React.ReactNode;
};
export function Guard({ allow, children }: RoleGuardProps) {
  const { user, loading } = useAuth();

  if (loading) return <p>Loading...</p>;

  if (!user) {
    if (firebaseAuth.currentUser) return <p>Loading...</p>;
    return <Navigate to="/auth/login" replace />;
  }

  if (user.role === "admin" && !allow.includes("admin")) {
    return <Navigate to="/admin" replace />;
  }

  if (user.role === "member" && !allow.includes("member")) {
    return <Navigate to="/" replace />;
  }

    if (user.role === "staff" && !allow.includes("staff")) {
    return <Navigate to="/staff/pending" replace />;
  }

  return children;
}