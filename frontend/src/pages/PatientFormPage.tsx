/**
 * PatientFormPage Component — Hospital Information Assistant
 *
 * Why it is written:
 * To provide a single form that handles both creating a new patient record
 * and editing an existing one, reducing code duplication.
 *
 * What it does:
 * - Detects edit mode by checking for a :id route parameter.
 * - In edit mode, fetches the existing patient from GET /api/v1/patients/:id
 *   and pre-fills the form fields.
 * - In create mode, renders an empty form.
 * - Validates required fields (first name, last name, date of birth) client-side.
 * - Submits via POST (create) or PUT (update) to the patients API.
 * - Navigates back to the patients list on success.
 *
 * Inputs:
 * - Route param :id (optional) — if present, the form is in edit mode.
 *
 * Outputs:
 * - JSX.Element: The rendered patient form page.
 */

import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";
import {
  User,
  ArrowLeft,
  Save,
  Calendar,
  Phone,
  Mail,
  MapPin,
  FileText,
} from "lucide-react";

/** Gender options for the dropdown. */
const GENDERS = ["Male", "Female", "Other"];

export default function PatientFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  // Form fields matching the PatientCreate / PatientUpdate schemas
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [medicalHistory, setMedicalHistory] = useState("");

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [error, setError] = useState("");

  /**
   * In edit mode, fetch the existing patient record and populate the form.
   */
  useEffect(() => {
    if (!isEdit) return;

    const fetchPatient = async () => {
      try {
        const res = await api.get(`/patients/${id}`);
        const p = res.data;
        setFirstName(p.first_name);
        setLastName(p.last_name);
        setDateOfBirth(p.date_of_birth);
        setGender(p.gender || "");
        setContactNumber(p.contact_number || "");
        setEmail(p.email || "");
        setAddress(p.address || "");
        setMedicalHistory(p.medical_history || "");
      } catch {
        setError("Failed to load patient data.");
      } finally {
        setFetching(false);
      }
    };

    fetchPatient();
  }, [id, isEdit]);

  /**
   * handleSubmit
   *
   * Creates or updates the patient record depending on mode.
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const payload = {
      first_name: firstName,
      last_name: lastName,
      date_of_birth: dateOfBirth,
      gender: gender || null,
      contact_number: contactNumber || null,
      email: email || null,
      address: address || null,
      medical_history: medicalHistory || null,
    };

    try {
      if (isEdit) {
        await api.put(`/patients/${id}`, payload);
      } else {
        await api.post("/patients/", payload);
      }
      navigate("/patients");
    } catch (err: unknown) {
      if (
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as Record<string, unknown>).response === "object"
      ) {
        const response = (err as { response: { data?: { detail?: string } } })
          .response;
        setError(response.data?.detail || "Operation failed. Please try again.");
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Show a loading spinner while fetching in edit mode
  if (fetching) {
    return (
      <div className="flex items-center justify-center py-32 animate-fade-in">
        <span className="inline-block w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/patients")}
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-100">
            <User className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {isEdit ? "Edit Patient" : "New Patient"}
            </h1>
            <p className="text-sm text-slate-500">
              {isEdit
                ? "Update the patient's information below."
                : "Fill in the details to register a new patient."}
            </p>
          </div>
        </div>
      </div>

      {/* ── Form Card ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
        {/* Error banner */}
        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-danger-500/10 border border-danger-500/20 text-danger-600 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Row: First Name + Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="pf-first-name"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                First Name <span className="text-danger-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="pf-first-name"
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="pf-last-name"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Last Name <span className="text-danger-500">*</span>
              </label>
              <input
                id="pf-last-name"
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Row: DOB + Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="pf-dob"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Date of Birth <span className="text-danger-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="pf-dob"
                  type="date"
                  required
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="pf-gender"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Gender
              </label>
              <select
                id="pf-gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all appearance-none cursor-pointer"
              >
                <option value="">Select gender</option>
                {GENDERS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row: Contact + Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="pf-contact"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Contact Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="pf-contact"
                  type="tel"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="+1 555-0123"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="pf-email"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="pf-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="patient@email.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <label
              htmlFor="pf-address"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Address
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <textarea
                id="pf-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                placeholder="123 Main St, City, State"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
              />
            </div>
          </div>

          {/* Medical History */}
          <div>
            <label
              htmlFor="pf-history"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Medical History
            </label>
            <div className="relative">
              <FileText className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <textarea
                id="pf-history"
                value={medicalHistory}
                onChange={(e) => setMedicalHistory(e.target.value)}
                rows={3}
                placeholder="Chronic conditions, allergies, previous surgeries..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate("/patients")}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isEdit ? "Update Patient" : "Create Patient"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
