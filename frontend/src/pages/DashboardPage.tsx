/**
 * DashboardPage Component — Hospital Information Assistant
 *
 * Why it is written:
 * To provide a central landing page after login that displays summary statistics
 * about patients, appointments, and system activity, along with quick action links.
 *
 * What it does:
 * - Fetches patient count and appointment count from the backend API on mount.
 * - Displays four StatsCards: Total Patients, Total Appointments,
 *   Scheduled (active) Appointments, and the logged-in user's role.
 * - Renders a "Quick Actions" grid with navigation cards to key features.
 * - Shows a welcome banner with the current user's name.
 * - Handles loading and error states gracefully.
 *
 * Inputs:
 * - None (fetches data from API and reads user from AuthContext).
 *
 * Outputs:
 * - JSX.Element: The rendered dashboard page.
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../api/axios";
import StatsCard from "../components/StatsCard";
import {
  Users,
  CalendarDays,
  CalendarCheck,
  ShieldCheck,
  UserPlus,
  CalendarPlus,
  Bot,
  Search,
  Upload,
  ArrowRight,
} from "lucide-react";

/** Represents the quick action cards displayed on the dashboard. */
interface QuickAction {
  to: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  iconColor: string;
}

const quickActions: QuickAction[] = [
  {
    to: "/patients/new",
    label: "Add Patient",
    description: "Register a new patient record",
    icon: UserPlus,
    color: "bg-primary-50",
    iconColor: "text-primary-600",
  },
  {
    to: "/appointments/new",
    label: "Schedule Appointment",
    description: "Book a new consultation",
    icon: CalendarPlus,
    color: "bg-accent-50",
    iconColor: "text-accent-600",
  },
  {
    to: "/chatbot",
    label: "AI Chatbot",
    description: "Ask the hospital AI assistant",
    icon: Bot,
    color: "bg-success-50",
    iconColor: "text-success-600",
  },
  {
    to: "/rag",
    label: "RAG Search",
    description: "Semantic search medical records",
    icon: Search,
    color: "bg-warning-50",
    iconColor: "text-warning-600",
  },
  {
    to: "/upload",
    label: "Upload Files",
    description: "Upload clinical documents to S3",
    icon: Upload,
    color: "bg-danger-50",
    iconColor: "text-danger-600",
  },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [totalPatients, setTotalPatients] = useState<number>(0);
  const [totalAppointments, setTotalAppointments] = useState<number>(0);
  const [scheduledCount, setScheduledCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  /**
   * Fetch summary data from the backend on mount.
   * We use the list endpoints with limit=1000 to get counts.
   */
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [patientsRes, appointmentsRes] = await Promise.all([
          api.get("/patients/", { params: { limit: 1000 } }),
          api.get("/appointments/", { params: { limit: 1000 } }),
        ]);

        const patients = patientsRes.data;
        const appointments = appointmentsRes.data;

        setTotalPatients(patients.length);
        setTotalAppointments(appointments.length);

        // Count appointments with status "scheduled"
        const scheduled = appointments.filter(
          (a: { status: string }) => a.status === "scheduled"
        ).length;
        setScheduledCount(scheduled);
      } catch {
        // Silently handle — stats will show 0
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="w-full max-w-full space-y-8 animate-fade-in">
      {/* ── Welcome Banner ── */}
      <div className="relative w-full max-w-full overflow-hidden rounded-2xl p-6 sm:p-10 text-white min-h-[200px] flex flex-col justify-center">
        {/* Background Image */}
        <img 
          src="/dashboard-banner.png" 
          alt="Dashboard Banner" 
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-transparent" />
        
        <div className="relative z-10 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-md mb-4">
            <span className="w-2 h-2 rounded-full bg-success-500 animate-pulse-dot" />
            <span className="text-xs font-semibold text-white tracking-wider">
              System Online
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            Welcome back, {user?.full_name || "User"} 👋
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-lg">
            Here is an overview of the hospital system. Use the quick
            actions below to manage patients, appointments, and utilize AI insights.
          </p>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={<Users className="w-6 h-6" />}
          value={loading ? "..." : totalPatients}
          label="Total Patients"
          color="bg-primary-100"
          iconColor="text-primary-600"
        />
        <StatsCard
          icon={<CalendarDays className="w-6 h-6" />}
          value={loading ? "..." : totalAppointments}
          label="Total Appointments"
          color="bg-accent-100"
          iconColor="text-accent-600"
        />
        <StatsCard
          icon={<CalendarCheck className="w-6 h-6" />}
          value={loading ? "..." : scheduledCount}
          label="Scheduled"
          color="bg-success-50"
          iconColor="text-success-600"
        />
        <StatsCard
          icon={<ShieldCheck className="w-6 h-6" />}
          value={user?.role?.toUpperCase() || "STAFF"}
          label="Your Role"
          color="bg-warning-50"
          iconColor="text-warning-600"
        />
      </div>

      {/* ── Quick Actions ── */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.to}
                to={action.to}
                className="group flex items-center gap-4 p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
              >
                <div
                  className={`flex items-center justify-center w-11 h-11 rounded-xl ${action.color} flex-shrink-0`}
                >
                  <Icon className={`w-5 h-5 ${action.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">
                    {action.label}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {action.description}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
