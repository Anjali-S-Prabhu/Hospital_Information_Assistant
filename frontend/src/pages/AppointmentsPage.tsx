/**
 * AppointmentsPage Component — Hospital Information Assistant
 *
 * Why it is written:
 * To display a filterable, paginated table of all appointments with nested
 * patient and doctor details, and support create, edit, and delete operations.
 *
 * What it does:
 * - Fetches the appointments list from GET /api/v1/appointments/ on mount.
 *   The response includes nested patient and doctor objects (AppointmentDetailOut).
 * - Renders a responsive table with columns: Patient, Doctor, Date/Time,
 *   Reason, Status (color-coded badge), and Actions (Edit / Delete).
 * - Provides a status filter dropdown to filter by scheduled/completed/cancelled.
 * - Shows a confirmation modal before deleting an appointment.
 * - Navigates to /appointments/new for creating and /appointments/:id/edit for editing.
 *
 * Inputs:
 * - None (fetches data from the API).
 *
 * Outputs:
 * - JSX.Element: The rendered appointments listing page.
 */

import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import Modal from "../components/Modal";
import {
  CalendarDays,
  Plus,
  Filter,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

/** Shape of the nested patient inside an appointment. */
interface PatientMin {
  id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  contact_number: string | null;
}

/** Shape of the nested doctor (user) inside an appointment. */
interface UserMin {
  id: number;
  full_name: string | null;
  email: string;
  role: string;
}

/** Shape of an appointment record with nested details. */
interface Appointment {
  id: number;
  patient_id: number;
  doctor_id: number;
  appointment_date: string;
  reason: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  patient: PatientMin;
  doctor: UserMin;
}

/** Number of records per page for client-side pagination. */
const PAGE_SIZE = 10;

/** Status options for the filter dropdown. */
const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

/**
 * Returns a Tailwind class string for the appointment status badge.
 */
function statusBadge(status: string): string {
  switch (status) {
    case "scheduled":
      return "bg-accent-50 text-accent-700 ring-accent-200";
    case "completed":
      return "bg-success-50 text-success-700 ring-success-200";
    case "cancelled":
      return "bg-danger-50 text-danger-700 ring-danger-200";
    default:
      return "bg-slate-100 text-slate-600 ring-slate-200";
  }
}

export default function AppointmentsPage() {
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Appointment | null>(null);
  const [deleting, setDeleting] = useState(false);

  /**
   * fetchAppointments
   *
   * Fetches all appointments from the backend.
   */
  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/appointments/", {
        params: { limit: 1000 },
      });
      setAppointments(res.data);
    } catch {
      // Errors handled by Axios interceptor
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  /**
   * handleDelete
   *
   * Deletes the targeted appointment and refreshes the list.
   */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/appointments/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchAppointments();
    } catch {
      // Stays open on error
    } finally {
      setDeleting(false);
    }
  };

  // ── Filtered + Paginated data ──
  const filtered = statusFilter
    ? appointments.filter((a) => a.status === statusFilter)
    : appointments;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* ── Header Card ── */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20 shrink-0">
            <CalendarDays className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Appointments</h1>
            <p className="text-slate-500 mt-1">
              {filtered.length} record{filtered.length !== 1 ? "s" : ""} found
            </p>
          </div>
        </div>

        <Link
          to="/appointments/new"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold shadow-md shadow-primary-500/20 transition-all w-full sm:w-auto shrink-0 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Schedule Appointment
        </Link>
      </div>

      {/* ── Status Filter ── */}
      <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm max-w-fit shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] mx-auto sm:mx-0">
        <div className="pl-3 py-1 border-r border-slate-100 text-slate-400">
          <Filter className="w-4 h-4" />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-transparent text-sm text-slate-900 focus:outline-none appearance-none cursor-pointer pr-8 font-medium border-0 focus:ring-0"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-50/80 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-widest">Patient</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-widest">Doctor</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-widest">Date &amp; Time</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-widest">Reason</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <span className="inline-block w-8 h-8 border-3 border-primary-100 border-t-primary-600 rounded-full animate-spin" />
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-3"
                  >
                    <CalendarDays className="w-10 h-10 opacity-20" />
                    <span className="text-sm font-medium">No appointments found.</span>
                  </td>
                </tr>
              ) : (
                paginated.map((a) => (
                  <tr
                    key={a.id}
                    className="hover:bg-slate-50/60 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 text-primary-700 flex items-center justify-center font-bold text-sm shadow-inner">
                          {a.patient.first_name[0]}{a.patient.last_name[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{a.patient.first_name} {a.patient.last_name}</p>
                          <p className="text-xs text-slate-500">ID: #{a.patient.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">
                      Dr. {a.doctor.full_name || a.doctor.email}
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {new Date(a.appointment_date).toLocaleString(undefined, {
                        month: 'short', day: 'numeric', year: 'numeric',
                        hour: 'numeric', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 text-slate-500 max-w-[200px] truncate">
                      {a.reason}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ring-1 ring-inset capitalize shadow-sm ${statusBadge(a.status)}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                          a.status === 'scheduled' ? 'bg-accent-500' :
                          a.status === 'completed' ? 'bg-success-500' :
                          'bg-danger-500'
                        }`} />
                        {a.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => navigate(`/appointments/${a.id}/edit`)}
                          className="p-2 rounded-xl text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer shadow-sm border border-transparent hover:border-primary-100"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(a)}
                          className="p-2 rounded-xl text-slate-400 hover:text-danger-600 hover:bg-danger-50 transition-colors cursor-pointer shadow-sm border border-transparent hover:border-danger-100"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Delete Confirmation Modal ── */}
      <Modal
        isOpen={!!deleteTarget}
        title="Delete Appointment"
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        confirmLabel={deleting ? "Deleting..." : "Delete"}
        danger
      >
        <p className="text-sm text-slate-600">
          Are you sure you want to delete the appointment for{" "}
          <span className="font-semibold text-slate-900">
            {deleteTarget?.patient.first_name}{" "}
            {deleteTarget?.patient.last_name}
          </span>{" "}
          on{" "}
          <span className="font-semibold text-slate-900">
            {deleteTarget &&
              new Date(deleteTarget.appointment_date).toLocaleString()}
          </span>
          ? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
