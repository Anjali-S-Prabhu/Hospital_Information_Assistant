/**
 * AppointmentFormPage Component — Hospital Information Assistant
 *
 * Why it is written:
 * To provide a single form that handles both scheduling a new appointment
 * and editing an existing one, reducing code duplication.
 *
 * What it does:
 * - Detects edit mode by checking for a :id route parameter.
 * - In edit mode, fetches the existing appointment from GET /api/v1/appointments/:id
 *   and pre-fills all form fields.
 * - In create mode, renders an empty form.
 * - Fetches the patients list and users list so the user can select
 *   a patient and a doctor from dropdowns.
 * - Submits via POST (create) or PUT (update) to the appointments API.
 * - Navigates back to the appointments list on success.
 *
 * Inputs:
 * - Route param :id (optional) — if present, the form is in edit mode.
 *
 * Outputs:
 * - JSX.Element: The rendered appointment form page.
 */

import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";
import {
  CalendarDays,
  Save,
  User,
  Users,
  Clock,
  FileText,
  MessageSquare,
} from "lucide-react";

/** Minimal patient for the dropdown. */
interface PatientOption {
  id: number;
  first_name: string;
  last_name: string;
}

/** Minimal user (doctor) for the dropdown. */
interface DoctorOption {
  id: number;
  full_name: string | null;
  email: string;
  role: string;
}

/** Appointment status options. */
const STATUSES = [
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function AppointmentFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  // Dropdown data
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);

  // Form fields matching AppointmentCreate / AppointmentUpdate schemas
  const [patientId, setPatientId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState("scheduled");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  /**
   * On mount, fetch the patients and users lists for the dropdowns.
   * In edit mode, also fetch the existing appointment to pre-fill fields.
   */
  useEffect(() => {
    const init = async () => {
      try {
        // Fetch patients and users in parallel
        const [patientsRes, usersRes] = await Promise.all([
          api.get("/patients/", { params: { limit: 1000 } }),
          api.get("/users/", { params: { limit: 1000 } }),
        ]);

        setPatients(patientsRes.data);
        setDoctors(usersRes.data);

        // If editing, fetch the appointment data
        if (isEdit && id) {
          const apptRes = await api.get(`/appointments/${id}`);
          const a = apptRes.data;
          setPatientId(String(a.patient_id));
          setDoctorId(String(a.doctor_id));
          // Convert ISO datetime to datetime-local input format (YYYY-MM-DDTHH:MM)
          setAppointmentDate(a.appointment_date.slice(0, 16));
          setReason(a.reason);
          setStatus(a.status);
          setNotes(a.notes || "");
        }
      } catch {
        setError("Failed to load form data.");
      } finally {
        setFetching(false);
      }
    };

    init();
  }, [id, isEdit]);

  /**
   * handleSubmit
   *
   * Creates or updates the appointment depending on mode.
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const payload = {
      patient_id: Number(patientId),
      doctor_id: Number(doctorId),
      appointment_date: new Date(appointmentDate).toISOString(),
      reason,
      status,
      notes: notes || null,
    };

    try {
      if (isEdit) {
        await api.put(`/appointments/${id}`, payload);
      } else {
        await api.post("/appointments/", payload);
      }
      navigate("/appointments");
    } catch (err: unknown) {
      if (
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as Record<string, unknown>).response === "object"
      ) {
        const response = (err as { response: { data?: { detail?: string } } })
          .response;
        setError(
          response.data?.detail || "Operation failed. Please try again."
        );
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Show a loading spinner while fetching dropdown data
  if (fetching) {
    return (
      <div className="flex items-center justify-center py-32 animate-fade-in">
        <span className="inline-block w-8 h-8 border-3 border-accent-200 border-t-accent-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in space-y-6">
      {/* ── Header Card ── */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100 flex items-center gap-5">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20 shrink-0">
          <CalendarDays className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {isEdit ? "Edit Appointment" : "Schedule Appointment"}
          </h1>
          <p className="text-slate-500 mt-1">
            {isEdit
              ? "Modify the details of this scheduled appointment."
              : "Fill in the details to book a new consultation or checkup."}
          </p>
        </div>
      </div>

      {/* ── Form Card ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {error && (
          <div className="bg-danger-50 text-danger-600 px-6 py-4 border-b border-danger-100 font-medium text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-danger-500 animate-pulse" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
          {/* Main Details Section */}
          <div>
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-5 flex items-center gap-2">
              <User className="w-4 h-4" /> Participants
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Patient *</label>
                <div className="relative">
                  <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    required
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none text-slate-700"
                  >
                    <option value="" disabled>Select a patient...</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.first_name} {p.last_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Staff / Doctor *</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    value={doctorId}
                    onChange={(e) => setDoctorId(e.target.value)}
                    required
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none text-slate-700"
                  >
                    <option value="" disabled>Assign to...</option>
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.full_name || d.email} ({d.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Logistics Section */}
          <div>
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-5 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Scheduling Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Date & Time *</label>
                <input
                  type="datetime-local"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none text-slate-700"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none text-slate-700 font-medium"
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Notes Section */}
          <div>
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-5 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Clinical Information
            </h2>
            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Reason for Visit *</label>
                <div className="relative">
                  <MessageSquare className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                    placeholder="E.g., Routine checkup, fever, etc."
                    rows={2}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none text-slate-700 resize-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 flex justify-between">
                  Clinical Notes <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional context or observations..."
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none text-slate-700 resize-none"
                />
              </div>
            </div>
          </div>

          {/* ── Actions ── */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate("/appointments")}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold shadow-md shadow-primary-500/20 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? "Saving..." : isEdit ? "Save Changes" : "Schedule Appointment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
