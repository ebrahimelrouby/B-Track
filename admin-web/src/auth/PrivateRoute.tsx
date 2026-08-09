import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "./authStore";

export default function PrivateRoute() {
  const { isAuthenticated, isAdmin } = useAuthStore();
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  if (!isAdmin()) return <Navigate to="/unauthorized" replace />;
  return <Outlet />;
}
