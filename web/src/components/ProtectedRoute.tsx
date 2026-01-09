import { Navigate, useLocation } from "react-router-dom";
import { authStore } from "../store/authStore";

type Props = {
  children: React.ReactNode;
  requireRole?: "admin" | "student";
};

export default function ProtectedRoute({ children, requireRole }: Props) {
  const loc = useLocation();
  const auth = authStore.get();

  if (!auth.ok) {
    return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname)}`} replace />;
  }

  if (requireRole && auth.role !== requireRole) {
    return <Navigate to="/courses" replace />;
  }

  return <>{children}</>;
}
