import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";

function ProtectedRoute({ children }: { children: ReactNode }) {
  const loggedIn = localStorage.getItem("loggedIn");

  if (!loggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;