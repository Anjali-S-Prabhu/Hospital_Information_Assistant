/**
 * RagPage Component — Hospital Information Assistant
 *
 * Why it is written:
 * To provide a dual-purpose interface for Semantic Vector Search and
 * Retrieval-Augmented Generation (RAG) Q&A against hospital records
 * stored in Qdrant Cloud.
 *
 * What it does:
 * - Offers two tabs: "Semantic Search" and "Ask AI (RAG)".
 * - Semantic Search: sends a query to POST /api/v1/rag/search and displays
 *   results as cards with similarity scores and payload text.
 * - Ask AI (RAG): sends a question to POST /api/v1/rag/ask and displays
 *   the AI-generated answer along with reference context blocks.
 * - Provides an "Embed Records" button that triggers POST /api/v1/rag/embed
 *   to sync PostgreSQL records into the Qdrant vector store.
 * - Handles loading, empty, and error states.
 *
 * Inputs:
 * - User-typed queries / questions.
 *
 * Outputs:
 * - JSX.Element: The rendered RAG page.
 */

import { useState, type FormEvent } from "react";
import api from "../api/axios";
import {
  Search,
  Brain,
  Database,
  Send,
  FileText,
  Sparkles,
  Loader2,
  ChevronDown,
} from "lucide-react";

/** Shape of a single semantic search result item. */
interface SearchResultItem {
  id: number;
  score: number;
  payload: Record<string, string>;
}

/** Shape of the RAG Ask response. */
interface RagAnswer {
  question: string;
  answer: string;
  references: string[];
}

/** Tab options. */
type Tab = "search" | "ask";

export default function RagPage() {
  const [activeTab, setActiveTab] = useState<Tab>("search");

  // ── Semantic Search State ──
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLimit, setSearchLimit] = useState(5);
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchDone, setSearchDone] = useState(false);

  // ── RAG Ask State ──
  const [askQuestion, setAskQuestion] = useState("");
  const [askLimit, setAskLimit] = useState(4);
  const [ragAnswer, setRagAnswer] = useState<RagAnswer | null>(null);
  const [askLoading, setAskLoading] = useState(false);
  const [askDone, setAskDone] = useState(false);

  // ── Embed State ──
  const [embedLoading, setEmbedLoading] = useState(false);
  const [embedMessage, setEmbedMessage] = useState("");

  const [error, setError] = useState("");

  /**
   * handleSearch — Performs semantic vector search.
   */
  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setError("");
    setSearchLoading(true);
    setSearchDone(false);

    try {
      const res = await api.post("/rag/search", {
        query: searchQuery.trim(),
        limit: searchLimit,
      });
      setSearchResults(res.data.results);
      setSearchDone(true);
    } catch {
      setError("Semantic search failed. Ensure records have been embedded.");
    } finally {
      setSearchLoading(false);
    }
  };

  /**
   * handleAsk — Performs RAG Q&A.
   */
  const handleAsk = async (e: FormEvent) => {
    e.preventDefault();
    if (!askQuestion.trim()) return;
    setError("");
    setAskLoading(true);
    setAskDone(false);

    try {
      const res = await api.post("/rag/ask", {
        question: askQuestion.trim(),
        limit: askLimit,
      });
      setRagAnswer(res.data);
      setAskDone(true);
    } catch {
      setError("RAG query failed. Ensure records have been embedded.");
    } finally {
      setAskLoading(false);
    }
  };

  /**
   * handleEmbed — Syncs PostgreSQL records to Qdrant.
   */
  const handleEmbed = async () => {
    setEmbedLoading(true);
    setEmbedMessage("");
    setError("");

    try {
      const res = await api.post("/rag/embed");
      const d = res.data;
      setEmbedMessage(
        `✅ Embedded ${d.patients_embedded} patients & ${d.appointments_embedded} appointments (${d.total_points} total points).`
      );
    } catch {
      setError("Embedding failed. Check your Qdrant configuration.");
    } finally {
      setEmbedLoading(false);
    }
  };

  /**
   * Renders a score badge with color based on similarity value.
   */
  const scoreBadge = (score: number) => {
    const pct = Math.round(score * 100);
    let color = "bg-danger-50 text-danger-700";
    if (pct >= 75) color = "bg-success-50 text-success-700";
    else if (pct >= 50) color = "bg-warning-50 text-warning-700";
    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${color}`}
      >
        {pct}% match
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-warning-500 to-warning-600 shadow-sm">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              RAG Search Engine
            </h1>
            <p className="text-sm text-slate-500">
              Semantic search &amp; AI-powered Q&amp;A over hospital records
            </p>
          </div>
        </div>

        {/* Embed Button */}
        <button
          onClick={handleEmbed}
          disabled={embedLoading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
        >
          {embedLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Database className="w-4 h-4" />
          )}
          Embed Records
        </button>
      </div>

      {/* Embed success message */}
      {embedMessage && (
        <div className="px-4 py-3 rounded-xl bg-success-50 border border-success-200 text-success-700 text-sm font-medium">
          {embedMessage}
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="px-4 py-3 rounded-xl bg-danger-500/10 border border-danger-500/20 text-danger-600 text-sm font-medium">
          {error}
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 max-w-sm">
        <button
          onClick={() => setActiveTab("search")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "search"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Search className="w-4 h-4" />
          Semantic Search
        </button>
        <button
          onClick={() => setActiveTab("ask")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "ask"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Ask AI (RAG)
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════
          Tab: Semantic Search
         ══════════════════════════════════════════════════════════ */}
      {activeTab === "search" && (
        <div className="space-y-5">
          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Search Query
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  required
                  placeholder="e.g., patients with diabetes..."
                  className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-warning-500 focus:border-transparent transition-all shadow-sm"
                />
              </div>
            </div>
            <div className="w-24">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Limit
              </label>
              <div className="relative">
                <select
                  value={searchLimit}
                  onChange={(e) => setSearchLimit(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-warning-500 focus:border-transparent transition-all appearance-none cursor-pointer"
                >
                  {[3, 5, 10, 15, 20].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <button
              type="submit"
              disabled={searchLoading}
              className="flex items-center justify-center w-11 h-11 rounded-xl bg-warning-500 hover:bg-warning-600 text-white shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {searchLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>

          {/* Search Results */}
          {searchDone && searchResults.length === 0 && (
            <p className="text-center text-slate-400 py-8">
              No matching records found.
            </p>
          )}

          {searchResults.length > 0 && (
            <div className="space-y-4">
              <p className="text-sm text-slate-500 font-medium pb-2 border-b border-slate-100">
                {searchResults.length} result
                {searchResults.length !== 1 ? "s" : ""} found
              </p>
              {searchResults.map((item, idx) => (
                <div
                  key={item.id}
                  className="group bg-white rounded-2xl border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] p-6 hover:shadow-lg hover:border-warning-200 transition-all relative overflow-hidden"
                >
                  {/* Decorative background gradient */}
                  <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-gradient-to-br from-warning-100/50 to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold text-xs">
                        #{idx + 1}
                      </span>
                      <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md">
                        ID: {item.id}
                      </span>
                      {item.payload.record_type && (
                        <span className="text-xs font-bold uppercase tracking-wider text-warning-700 bg-warning-50 px-2.5 py-1 rounded-md">
                          {item.payload.record_type}
                        </span>
                      )}
                    </div>
                    {scoreBadge(item.score)}
                  </div>
                  
                  <div className="space-y-2 relative z-10 pl-11">
                    {Object.entries(item.payload).map(([key, value]) => {
                      if (key === 'record_type') return null; // Already shown in header
                      if (key === 'text') {
                        return (
                          <div key={key} className="mt-4 pt-4 border-t border-slate-50">
                            <p className="text-slate-800 text-sm leading-relaxed">
                              {value as React.ReactNode}
                            </p>
                          </div>
                        );
                      }
                      return (
                        <div key={key} className="flex gap-2 text-sm">
                          <span className="font-semibold text-slate-400 capitalize w-24 shrink-0">
                            {key.replace(/_/g, " ")}:
                          </span>
                          <span className="text-slate-700 font-medium">
                            {value as React.ReactNode}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          Tab: Ask AI (RAG)
         ══════════════════════════════════════════════════════════ */}
      {activeTab === "ask" && (
        <div className="space-y-5">
          {/* Ask Form */}
          <form onSubmit={handleAsk} className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Your Question
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Sparkles className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={askQuestion}
                  onChange={(e) => setAskQuestion(e.target.value)}
                  required
                  placeholder="e.g., Which patients have upcoming appointments?"
                  className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent transition-all shadow-sm"
                />
              </div>
            </div>
            <div className="w-24">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Context
              </label>
              <div className="relative">
                <select
                  value={askLimit}
                  onChange={(e) => setAskLimit(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent transition-all appearance-none cursor-pointer"
                >
                  {[2, 3, 4, 5, 8, 10].map((n) => (
                    <option key={n} value={n}>
                      {n} docs
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <button
              type="submit"
              disabled={askLoading}
              className="flex items-center justify-center w-11 h-11 rounded-xl bg-accent-600 hover:bg-accent-700 text-white shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {askLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>

          {/* RAG Answer */}
          {askDone && !ragAnswer && (
            <p className="text-center text-slate-400 py-8">
              No answer could be generated.
            </p>
          )}

          {ragAnswer && (
            <div className="space-y-4">
              {/* AI Answer Card */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-accent-500" />
                  <h3 className="text-sm font-semibold text-slate-900">
                    AI Answer
                  </h3>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {ragAnswer.answer}
                </p>
              </div>

              {/* References */}
              {ragAnswer.references.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Retrieved References ({ragAnswer.references.length})
                  </h3>
                  <div className="space-y-2">
                    {ragAnswer.references.map((ref, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-50 rounded-xl border border-slate-100 p-4"
                      >
                        <p className="text-xs font-semibold text-slate-400 mb-1">
                          Reference #{idx + 1}
                        </p>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">
                          {ref}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
