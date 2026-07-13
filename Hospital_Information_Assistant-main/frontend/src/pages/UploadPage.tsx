/**
 * UploadPage Component — Hospital Information Assistant
 *
 * Why it is written:
 * To provide a drag-and-drop file upload interface that sends clinical
 * documents to AWS S3 via the backend, with optional patient association.
 *
 * What it does:
 * - Renders a drag-and-drop zone (also clickable) for selecting files.
 * - Provides an optional patient dropdown to associate the upload with a patient.
 * - Uploads the file as multipart/form-data to POST /api/v1/upload.
 * - Displays the upload result (file name, S3 URL) in a success card.
 * - Shows a list of recently uploaded files in the current session.
 * - Handles loading, error, and drag-over visual states.
 *
 * Inputs:
 * - User-selected file + optional patient ID.
 *
 * Outputs:
 * - JSX.Element: The rendered upload page.
 */

import { useState, useRef, useEffect, type ChangeEvent } from "react";
import api from "../api/axios";
import {
  Upload,
  CloudUpload,
  Loader2,
  CheckCircle,
  ExternalLink,
  User,
  X,
} from "lucide-react";

/** Minimal patient for the dropdown. */
interface PatientOption {
  id: number;
  first_name: string;
  last_name: string;
}

/** Represents an upload result shown in the recent uploads list. */
interface UploadResult {
  id: number;
  file_name: string;
  file_url: string;
  patient_id: number | null;
  upload_date: string;
}

export default function UploadPage() {
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploads, setUploads] = useState<UploadResult[]>([]);
  const [error, setError] = useState("");


  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Fetch patients list for the optional association dropdown.
   */
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await api.get("/patients/", { params: { limit: 1000 } });
        setPatients(res.data);
      } catch {
        // Non-critical — dropdown will be empty
      }
    };
    fetchPatients();
  }, []);

  /**
   * handleFileSelect — Sets the file from the native input.
   */
  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setError("");
    }
  };



  /**
   * handleUpload — Sends the file to the backend as multipart/form-data.
   */
  const handleUpload = async () => {
    if (!selectedFile) return;
    setError("");
    setUploading(true);

    const formData = new FormData();
    formData.append("file", selectedFile);
    if (selectedPatientId) {
      formData.append("patient_id", selectedPatientId);
    }

    try {
      const res = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploads((prev) => [res.data, ...prev]);
      setSelectedFile(null);
      setSelectedPatientId("");
      // Reset the native input
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: unknown) {
      if (
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as Record<string, unknown>).response === "object"
      ) {
        const response = (err as { response: { data?: { detail?: string } } })
          .response;
        setError(response.data?.detail || "Upload failed. Please try again.");
      } else {
        setError("An unexpected error occurred during upload.");
      }
    } finally {
      setUploading(false);
    }
  };

  /**
   * formatFileSize — Converts bytes to a human-readable string.
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-danger-500 to-danger-600 shadow-sm">
          <Upload className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Upload Files</h1>
          <p className="text-sm text-slate-500">
            Upload clinical documents to AWS S3 storage
          </p>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="px-4 py-3 rounded-xl bg-danger-500/10 border border-danger-500/20 text-danger-600 text-sm font-medium">
          {error}
        </div>
      )}

      {/* ── Upload Card ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6">
        
        {/* File Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Select Document
          </label>
          <div className="flex items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.png,.jpg,.jpeg"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors cursor-pointer"
            >
              <CloudUpload className="w-5 h-5 text-slate-500" />
              Choose File
            </button>
            <div className="text-sm">
              {selectedFile ? (
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-900">{selectedFile.name}</span>
                  <span className="text-xs text-slate-500">{formatFileSize(selectedFile.size)}</span>
                </div>
              ) : (
                <span className="text-slate-400">No file selected</span>
              )}
            </div>
            {selectedFile && (
              <button
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="p-2 ml-auto text-slate-400 hover:text-danger-500 hover:bg-danger-50 rounded-lg transition-colors cursor-pointer"
                title="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Optional Patient Association */}
        <div>
          <label
            htmlFor="upload-patient"
            className="block text-sm font-medium text-slate-700 mb-2"
          >
            Associate with Patient{" "}
            <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <User className="w-5 h-5 text-slate-400" />
            </div>
            <select
              id="upload-patient"
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all appearance-none cursor-pointer"
            >
              <option value="">No patient association</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.first_name} {p.last_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {uploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          {uploading ? "Uploading..." : "Upload to S3"}
        </button>
      </div>

      {/* ── Recent Uploads (session-only) ── */}
      {uploads.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">
            Recent Uploads
          </h2>
          <div className="space-y-3">
            {uploads.map((u) => (
              <div
                key={u.id}
                className="flex items-center gap-4 bg-white rounded-2xl border border-slate-100 shadow-sm p-4"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-success-50 flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-success-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {u.file_name}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Uploaded {new Date(u.upload_date).toLocaleString()}
                    {u.patient_id && ` · Patient #${u.patient_id}`}
                  </p>
                </div>
                <a
                  href={u.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors flex-shrink-0"
                  title="Open in S3"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
