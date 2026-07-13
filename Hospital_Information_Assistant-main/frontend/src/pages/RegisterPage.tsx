/**
 * RegisterPage Component — Hospital Information Assistant
 *
 * Why it is written:
 * To provide a registration interface where new hospital staff members can
 * create an account with their name, email, role, and password.
 *
 * What it does:
 * - Renders a centered registration card matching the login page's design language.
 * - Collects full name, email, role (dropdown), and password with confirmation.
 * - Validates that password and confirm password match before submission.
 * - Submits the registration payload via AuthContext's register() function,
 *   which auto-logs in the user upon success.
 * - Displays error messages from the backend (e.g., duplicate email).
 * - Redirects authenticated users to the dashboard automatically.
 *
 * Inputs:
 * - User-entered full name, email, role, password, and confirm password.
 *
 * Outputs:
 * - JSX.Element: The rendered registration page.
 */

import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Activity,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Shield,
  ArrowRight,
} from "lucide-react";



export default function RegisterPage() {
  const { register, isAuthenticated } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("staff");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
   * To process the registration form submission.
   *
   * What it does:
   * Validates password match, calls register() from AuthContext,
   * and handles success/error states.
   *
   * Inputs:
   * - e (FormEvent): The form submission event.
   *
   * Outputs:
   * - void (side effects: register + auto-login or error display).
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    // Client-side validation: passwords must match
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await register(email, password, fullName, role);
    } catch (err: unknown) {
      if (
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as Record<string, unknown>).response === "object"
      ) {
        const response = (err as { response: { data?: { detail?: string } } })
          .response;
        setError(response.data?.detail || "Registration failed. Please try again.");
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
            Join the Future of Healthcare.
          </h1>
          <p className="text-lg text-slate-300">
            Create an account to securely access patient records, manage appointments, and utilize AI-driven insights to deliver exceptional care.
          </p>
        </div>
      </div>

      {/* Right: Form Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-md animate-fade-in my-auto py-8">
          {/* Logo */}
          <div className="mb-10 text-center lg:text-left">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-500 shadow-md shadow-primary-500/20 mb-4">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900">Create Account</h2>
            <p className="text-slate-500 mt-2">
              Join the Hospital Information Assistant
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-danger-50 border border-danger-100 text-danger-600 text-sm font-medium flex items-start gap-2">
              <div className="w-5 h-5 shrink-0 mt-0.5 rounded-full bg-danger-100 text-danger-600 flex items-center justify-center font-bold">!</div>
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label
                htmlFor="reg-name"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="reg-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="Dr. Sarah Johnson"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-shadow shadow-sm"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="reg-email"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="doctor@hospital.com"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-shadow shadow-sm"
                />
              </div>
            </div>

            {/* Role */}
            <div>
              <label
                htmlFor="reg-role"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Role
              </label>
              <div className="relative">
                <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <select
                  id="reg-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-shadow shadow-sm appearance-none"
                >
                  <option value="doctor">Doctor</option>
                  <option value="nurse">Nurse</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="reg-password"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-shadow shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2 ml-1">
                Must be at least 6 characters long
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="reg-confirm"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="reg-confirm"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-shadow shadow-sm"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 mt-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
            >
              {loading ? (
                <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-8">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">OR</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Login link */}
          <p className="text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-primary-600 hover:text-primary-700 font-semibold transition-colors"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
