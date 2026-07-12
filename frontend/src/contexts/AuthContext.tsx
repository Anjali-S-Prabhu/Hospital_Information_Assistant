/**
 * Authentication Context — Hospital Information Assistant
 *
 * Why it is written:
 * To provide a centralized authentication state management layer that all
 * components can consume via React Context. This eliminates prop-drilling
 * of user data and token across the component tree.
 *
 * What it does:
 * - Stores the JWT token and user profile object in React state.
 * - Persists both values to localStorage for session persistence across page reloads.
 * - Exposes login(), logout(), and register() functions to child components.
 * - On mount, checks localStorage for an existing token and fetches the user profile
 *   from GET /auth/me to rehydrate the session.
 *
 * Inputs:
 * - Children components wrapped by <AuthProvider>.
 *
 * Outputs:
 * - AuthContext values: user, token, isAuthenticated, loading, login, logout, register.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import api from "../api/axios";

// ──────────────────────────────────────────────
// Type Definitions
// ──────────────────────────────────────────────

/** Represents the authenticated user profile returned by GET /auth/me. */
interface User {
  id: number;
  email: string;
  full_name: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Shape of the AuthContext value consumed by useAuth(). */
interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    full_name: string,
    role: string
  ) => Promise<void>;
  logout: () => void;
}

// ──────────────────────────────────────────────
// Context Creation
// ──────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ──────────────────────────────────────────────
// Provider Component
// ──────────────────────────────────────────────

/**
 * AuthProvider
 *
 * Why it is written:
 * To wrap the application root and provide authentication state to all descendants.
 *
 * What it does:
 * - Initializes token from localStorage.
 * - On mount, validates stored token by calling GET /auth/me.
 * - Provides login, register, and logout functions.
 *
 * Inputs:
 * - children (ReactNode): The component tree to wrap.
 *
 * Outputs:
 * - Renders AuthContext.Provider with auth state and actions.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );
  const [loading, setLoading] = useState<boolean>(true);

  /**
   * On mount or when token changes, attempt to fetch the current user profile
   * from the backend. If the token is invalid or expired, clear the session.
   */
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get("/auth/me");
        setUser(response.data);
      } catch {
        // Token is invalid or expired — clear session
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token]);

  /**
   * login
   *
   * Why it is written:
   * To authenticate a user by sending credentials to POST /auth/login
   * and storing the returned JWT token.
   *
   * What it does:
   * Sends email (as username) and password as x-www-form-urlencoded data
   * to match the OAuth2PasswordRequestForm expected by the FastAPI backend.
   * On success, stores the token and fetches the user profile.
   *
   * Inputs:
   * - email (string): The user's email address.
   * - password (string): The user's password.
   *
   * Outputs:
   * - Promise<void>: Resolves on success, rejects with error on failure.
   */
  const login = async (email: string, password: string): Promise<void> => {
    // FastAPI's OAuth2PasswordRequestForm expects form-encoded data
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    const response = await api.post("/auth/login", formData, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    const accessToken: string = response.data.access_token;

    // Persist token to localStorage and state
    localStorage.setItem("token", accessToken);
    setToken(accessToken);

    // Fetch user profile immediately after login
    const userResponse = await api.get("/auth/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const userData: User = userResponse.data;

    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  /**
   * register
   *
   * Why it is written:
   * To create a new staff account via POST /auth/register and then
   * automatically log in the new user.
   *
   * What it does:
   * Sends registration payload as JSON. On success, calls login()
   * to authenticate the newly created account.
   *
   * Inputs:
   * - email (string): Registration email.
   * - password (string): Registration password.
   * - full_name (string): Full name of the staff member.
   * - role (string): Role (admin, doctor, nurse, staff).
   *
   * Outputs:
   * - Promise<void>: Resolves on success, rejects with error on failure.
   */
  const register = async (
    email: string,
    password: string,
    full_name: string,
    role: string
  ): Promise<void> => {
    await api.post("/auth/register", {
      email,
      password,
      full_name,
      role,
    });

    // Auto-login after successful registration
    await login(email, password);
  };

  /**
   * logout
   *
   * Why it is written:
   * To clear all authentication state and redirect to the login page.
   *
   * What it does:
   * Removes token and user from localStorage, resets state, and navigates to /login.
   *
   * Inputs:
   * - None.
   *
   * Outputs:
   * - void.
   */
  const logout = (): void => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    window.location.href = "/login";
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ──────────────────────────────────────────────
// Custom Hook
// ──────────────────────────────────────────────

/**
 * useAuth
 *
 * Why it is written:
 * To provide a convenient, type-safe hook for consuming the AuthContext.
 *
 * What it does:
 * Returns the AuthContext value. Throws an error if used outside of AuthProvider.
 *
 * Inputs:
 * - None.
 *
 * Outputs:
 * - AuthContextType: The full authentication state and action functions.
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
