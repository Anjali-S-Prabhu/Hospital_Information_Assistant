/**
 * LoginPage Component — Hospital Information Assistant
 *
 * Why it is written:
 * To provide the login interface where hospital staff members can authenticate
 * using their email and password to access the application.
 *
 * What it does:
 * - Renders a centered login card with email and password input fields.
 * - Submits credentials to the backend via AuthContext's login() function.
 * - Displays error messages from failed authentication attempts.
 * - Redirects authenticated users to the dashboard automatically.
 * - Includes a link to the registration page for new users.
 * - Features a premium glassmorphism design with gradient background.
 *
 * Inputs:
 * - User-entered email and password from the form fields.
 *
 * Outputs:
 * - JSX.Element: The rendered login page.
 */

import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Activity, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // If already authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  /**
   * handleSubmit
   *
   * Why it is written:
   * To process the login form submission.
   *
   * What it does:
   * Prevents default form behavior, calls login() from AuthContext,
   * and handles success/error states.
   *
   * Inputs:
   * - e (FormEvent): The form submission event.
   *
   * Outputs:
   * - void (side effects: login or error display).
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: unknown) {
      if (
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as any).response === "object"
      ) {
        const responseData = (err as any).response?.data;
        if (responseData && Array.isArray(responseData.detail)) {
          setError(responseData.detail[0]?.msg || "Validation error.");
        } else {
          setError(responseData?.detail || "Invalid email or password.");
        }
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left: Image Side (Hidden on mobile) */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-slate-900">
        <img
          src="/auth-hero.png"
          alt="Hospital Facility"
          className="absolute inset-0 w-full h-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent" />
        <div className="absolute bottom-0 left-0 p-12 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/20 border border-primary-500/30 backdrop-blur-md mb-6">
            <Activity className="w-4 h-4 text-primary-400" />
            <span className="text-xs font-semibold text-primary-100 uppercase tracking-wider">
              Staff Portal
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Advancing Healthcare Through Innovation.
          </h1>
          <p className="text-lg text-slate-300">
            Securely access patient records, manage appointments, and utilize AI-driven insights to deliver exceptional care.
          </p>
        </div>
      </div>

      {/* Right: Form Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md animate-fade-in">
          {/* Logo */}
          <div className="mb-10 text-center lg:text-left">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-500 shadow-md shadow-primary-500/20 mb-4">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900">Welcome Back</h2>
            <p className="text-slate-500 mt-2">
              Sign in to Hospital Information Assistant
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-danger-50 border border-danger-100 text-danger-600 text-sm font-medium flex items-start gap-2">
              <div className="w-5 h-5 shrink-0 mt-0.5 rounded-full bg-danger-100 text-danger-600 flex items-center justify-center font-bold">!</div>
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label
                htmlFor="login-email"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="doctor@hospital.com"
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-shadow shadow-sm"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="login-password"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-shadow shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold shadow-md shadow-slate-900/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign In"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
            
            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <h3 className="text-sm font-bold text-slate-900 mb-2">New to the Staff Portal?</h3>
              <p className="text-sm text-slate-500 mb-4">Create an account to access patient records and manage appointments.</p>
              <Link 
                to="/register"
                className="inline-flex items-center justify-center w-full py-3 rounded-xl bg-primary-50 text-primary-700 hover:bg-primary-100 text-sm font-semibold transition-colors border border-primary-200"
              >
                Create Account
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
