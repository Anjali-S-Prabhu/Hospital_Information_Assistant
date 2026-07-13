/**
 * ProtectedRoute Component — Hospital Information Assistant
 *
 * Why it is written:
 * To guard authenticated routes from unauthenticated access. Any route
 * wrapped by this component will redirect users to the login page if
 * they are not authenticated.
 *
 * What it does:
 * - Checks the authentication state from AuthContext.
 * - While loading (initial session rehydration), shows a loading spinner.
 * - If the user is not authenticated, redirects to /login using <Navigate />.
 * - If authenticated, renders the child route via <Outlet />.
 *
 * Inputs:
 * - None (reads auth state from useAuth() hook).
 *
 * Outputs:
 * - JSX.Element: Loading spinner, redirect to /login, or <Outlet /> for the child page.
 */

import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Activity } from "lucide-react";

export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();

  // Show a centered loading spinner while the auth state is being resolved
  // (e.g., during initial token validation on page reload).
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-500 mb-4 animate-pulse">
          <Activity className="w-7 h-7 text-white" />
        </div>
        <p className="text-sm text-slate-500 font-medium">Loading...</p>
      </div>
    );
  }

  // If not authenticated, redirect to the login page.
  // replace={true} prevents the protected URL from being added to browser history.
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Authenticated — render the child route component.
  return <Outlet />;
}
