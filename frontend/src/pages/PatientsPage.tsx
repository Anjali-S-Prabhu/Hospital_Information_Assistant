/**
 * PatientsPage Component — Hospital Information Assistant
 *
 * Why it is written:
 * To display a searchable, paginated table of all patient records with
 * the ability to navigate to create, edit, and delete patients.
 *
 * What it does:
 * - Fetches the patient list from GET /api/v1/patients/ on mount and on search.
 * - Renders a responsive table with columns: Name, DOB, Gender, Contact,
 *   Email, and Actions (Edit / Delete).
 * - Provides a search input that filters by name/email/contact server-side.
 * - Shows a confirmation modal before deleting a patient via the Modal component.
 * - Navigates to /patients/new for creating and /patients/:id/edit for editing.
 *
 * Inputs:
 * - None (fetches data from the API).
 *
 * Outputs:
 * - JSX.Element: The rendered patients listing page.
 */

import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import Modal from "../components/Modal";
import {
  Users,
  Plus,
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

/** Shape of a patient record returned by the API. */
interface Patient {
  id: number;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string | null;
  contact_number: string | null;
  email: string | null;
  address: string | null;
  medical_history: string | null;
  created_at: string;
  updated_at: string;
}

/** Number of records per page for client-side pagination. */
const PAGE_SIZE = 10;

export default function PatientsPage() {
  const navigate = useNavigate();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  // Delete confirmation modal state
  const [deleteTarget, setDeleteTarget] = useState<Patient | null>(null);
  const [deleting, setDeleting] = useState(false);

  /**
   * fetchPatients
   *
   * Fetches the patient list from the backend, optionally filtered by search.
   */
  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { limit: 1000 };
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      const res = await api.get("/patients/", { params });
      setPatients(res.data);
    } catch {
      // Errors handled by Axios interceptor (401 redirect)
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  /**
   * handleDelete
   *
   * Deletes the currently targeted patient and refreshes the list.
   */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/patients/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchPatients();
    } catch {
      // Error handled silently; modal stays open
    } finally {
      setDeleting(false);
    }
  };

  // ── Pagination calculations ──
  const totalPages = Math.max(1, Math.ceil(patients.length / PAGE_SIZE));
  const paginated = patients.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* ── Header Card ── */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20 shrink-0">
            <Users className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Patients</h1>
            <p className="text-slate-500 mt-1">
              {patients.length} record{patients.length !== 1 ? "s" : ""} found
            </p>
          </div>
        </div>

        <Link
          to="/patients/new"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold shadow-md shadow-primary-500/20 transition-all w-full sm:w-auto shrink-0 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Add Patient
        </Link>
      </div>

      {/* ── Search Bar ── */}
      <div className="relative max-w-md mx-auto sm:mx-0">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, email, or contact..."
          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-slate-100 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all shadow-sm shadow-slate-100/50"
        />
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-50/80 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-widest">Patient</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-widest">DOB</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-widest">Gender</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-widest">Contact</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-widest">Email</th>
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
                    <Users className="w-10 h-10 opacity-20" />
                    <span className="text-sm font-medium">No patients found.</span>
                  </td>
                </tr>
              ) : (
                paginated.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50/60 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 text-primary-700 flex items-center justify-center font-bold text-sm shadow-inner">
                          {p.first_name[0]}{p.last_name[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{p.first_name} {p.last_name}</p>
                          <p className="text-xs text-slate-500">ID: #{p.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {new Date(p.date_of_birth).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        p.gender?.toLowerCase() === 'male' ? 'bg-blue-50 text-blue-600' :
                        p.gender?.toLowerCase() === 'female' ? 'bg-pink-50 text-pink-600' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {p.gender || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {p.contact_number || "—"}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {p.email || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => navigate(`/patients/${p.id}/edit`)}
                          className="p-2 rounded-xl text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer shadow-sm border border-transparent hover:border-primary-100"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(p)}
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
        title="Delete Patient"
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        confirmLabel={deleting ? "Deleting..." : "Delete"}
        danger
      >
        <p className="text-sm text-slate-600">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-slate-900">
            {deleteTarget?.first_name} {deleteTarget?.last_name}
          </span>
          ? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
