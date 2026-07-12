import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Bot,
  Search,
  Upload,
  LogOut,
  X,
  Activity,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/patients", label: "Patients", icon: Users },
  { to: "/appointments", label: "Appointments", icon: CalendarDays },
  { to: "/chatbot", label: "AI Chatbot", icon: Bot },
  { to: "/rag", label: "RAG Search", icon: Search },
  { to: "/upload", label: "File Uploads", icon: Upload },
];

export default function Sidebar({
  isOpen,
  onClose,
}: SidebarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed
          top-0
          left-0
          h-screen
          w-64
          bg-slate-900
          text-white
          flex
          flex-col
          z-50
          transition-transform
          duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
              <Activity className="w-5 h-5 text-white" />
            </div>

            <div>
              <h1 className="font-bold text-lg tracking-tight text-white">
                Hospital AI
              </h1>

              <p className="text-[10px] uppercase tracking-widest text-primary-300 font-semibold">
                Staff Portal
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;

            const active =
              item.to === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.to);

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => {
                  if (window.innerWidth < 1024) {
                    onClose();
                  }
                }}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 ${
                  active
                    ? "bg-primary-500/10 text-primary-400 font-semibold"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200 font-medium"
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? "text-primary-400" : "text-slate-500"}`} />

                <span className="flex-1">
                  {item.label}
                </span>

                {active && (
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User */}
        <div className="border-t border-white/5 p-5 bg-slate-900/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 shadow-inner">
              {(user?.full_name?.charAt(0) ||
                user?.email?.charAt(0) ||
                "U").toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm truncate text-white">
                {user?.full_name || "User"}
              </p>

              <p className="text-xs text-slate-400 capitalize truncate">
                {user?.role || "Staff"}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center gap-2 rounded-xl px-4 py-3 hover:bg-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}