/**
 * Layout Component — Hospital Information Assistant
 */

import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { Menu } from "lucide-react";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">

      {/* Sidebar */}
      {sidebarOpen && (
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      )}

      {/* Right Side */}
      <div
        className={`flex flex-col flex-1 transition-all duration-300 overflow-hidden ${
          sidebarOpen ? "lg:ml-64" : "ml-0"
        }`}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 px-6 py-4">
          <div className="flex items-center gap-3">
            {/* Menu Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-slate-800 tracking-tight">
              Hospital Information Assistant
            </h2>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-6 lg:p-8 w-full min-w-0 relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}