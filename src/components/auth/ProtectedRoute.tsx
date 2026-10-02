import { ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
  developerOnly?: boolean;
}

export function ProtectedRoute({ children, adminOnly, developerOnly }: ProtectedRouteProps) {
  const { user, loading, isAdmin, isDeveloper } = useAuth();

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" />;
  }

  if (developerOnly && !isDeveloper) {
    return <Navigate to="/" />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
}
