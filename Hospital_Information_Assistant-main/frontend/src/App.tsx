/**
 * App Component — Hospital Information Assistant
 *
 * Why it is written:
 * To define all client-side routes using React Router DOM and wire together
 * the authentication context, layout shell, and page components.
 *
 * What it does:
 * - Wraps the entire app in AuthProvider for global auth state.
 * - Defines public routes: /login and /register.
 * - Defines protected routes (wrapped in ProtectedRoute + Layout):
 *     /           → DashboardPage
 *     /patients   → PatientsPage
 *     /patients/new           → PatientFormPage (create)
 *     /patients/:id/edit      → PatientFormPage (edit)
 *     /appointments           → AppointmentsPage
 *     /appointments/new       → AppointmentFormPage (create)
 *     /appointments/:id/edit  → AppointmentFormPage (edit)
 *     /chatbot    → ChatbotPage
 *     /rag        → RagPage
 *     /upload     → UploadPage
 * - Catch-all route redirects to /.
 *
 * Inputs:
 * - None.
 *
 * Outputs:
 * - JSX.Element: The rendered application with routing.
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

// Public pages
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

// Protected pages
import DashboardPage from "./pages/DashboardPage";
import PatientsPage from "./pages/PatientsPage";
import PatientFormPage from "./pages/PatientFormPage";
import AppointmentsPage from "./pages/AppointmentsPage";
import AppointmentFormPage from "./pages/AppointmentFormPage";
import ChatbotPage from "./pages/ChatbotPage";
import RagPage from "./pages/RagPage";
import UploadPage from "./pages/UploadPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ── Public Routes ── */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* ── Protected Routes (require authentication) ── */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
            {/* Dashboard */}
            <Route path="/" element={<DashboardPage />} />

            {/* Patients */}
            <Route path="/patients" element={<PatientsPage />} />
            <Route path="/patients/new" element={<PatientFormPage />} />
            <Route path="/patients/:id/edit" element={<PatientFormPage />} />

            {/* Appointments */}
            <Route path="/appointments" element={<AppointmentsPage />} />
            <Route path="/appointments/new" element={<AppointmentFormPage />} />
            <Route path="/appointments/:id/edit" element={<AppointmentFormPage />} />

            {/* AI Features */}
            <Route path="/chatbot" element={<ChatbotPage />} />
            <Route path="/rag" element={<RagPage />} />

            {/* File Upload */}
            <Route path="/upload" element={<UploadPage />} />
          </Route>
        </Route>

          {/* ── Catch-all redirect ── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
