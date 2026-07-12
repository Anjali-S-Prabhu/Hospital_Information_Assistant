/**
 * ChatbotPage Component — Hospital Information Assistant
 *
 * Why it is written:
 * To provide a real-time chat interface where authenticated hospital staff
 * can interact with the Groq-powered AI assistant via LangChain.
 *
 * What it does:
 * - Maintains a local message history (user + assistant messages) in state.
 * - Generates a unique session_id on mount (UUID v4 pattern) so the backend
 *   can track conversation history for multi-turn context.
 * - Sends user messages via POST /api/v1/chat with { session_id, message }.
 * - Displays the AI reply in a chat bubble layout with auto-scroll.
 * - Shows a typing indicator while waiting for the AI response.
 * - Allows starting a new session (clears chat + generates a new session_id).
 *
 * Inputs:
 * - User-typed messages.
 *
 * Outputs:
 * - JSX.Element: The rendered chatbot page.
 */

import { useState, useRef, useEffect, type FormEvent } from "react";
import { useAuth } from "../contexts/AuthContext";
import api from "../api/axios";
import {
  Bot,
  Send,
  User,
  RotateCcw,
  Sparkles,
} from "lucide-react";

/** Represents a single message in the chat. */
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

/**
 * Generates a pseudo-UUID v4 string for session identification.
 */
function generateSessionId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function ChatbotPage() {
  const { user } = useAuth();
  const [sessionId, setSessionId] = useState(generateSessionId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /** Auto-scroll to the latest message. */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  /**
   * handleSend
   *
   * Sends the user message to the chatbot API and appends both
   * the user message and the AI reply to the messages list.
   */
  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    // Append user message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await api.post("/chat", {
        session_id: sessionId,
        message: text,
      });

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: res.data.reply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const errMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  /**
   * handleNewSession
   *
   * Clears the chat and generates a fresh session_id.
   */
  const handleNewSession = () => {
    setMessages([]);
    setSessionId(generateSessionId());
    setInput("");
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] animate-fade-in">
      {/* ── Header ── */}
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-success-500 to-success-600 shadow-sm">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">AI Chatbot</h1>
            <p className="text-xs text-slate-500">
              Powered by Groq &amp; LangChain
            </p>
          </div>
        </div>
        <button
          onClick={handleNewSession}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Start new session"
        >
          <RotateCcw className="w-4 h-4" />
          New Chat
        </button>
      </div>

      {/* ── Messages Area ── */}
      <div className="flex-1 overflow-y-auto rounded-2xl bg-slate-50 border border-slate-100 p-4 space-y-4">
        {/* Welcome message when empty */}
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-12">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-success-500 to-accent-500 shadow-lg">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Hospital AI Assistant
              </h2>
              <p className="text-sm text-slate-500 mt-1 max-w-sm">
                Ask me anything about hospital operations, medical information,
                patient care guidelines, or administrative queries.
              </p>
            </div>
          </div>
        )}

        {/* Chat Bubbles */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.role === "user" ? "flex-row-reverse" : ""
            }`}
          >
            {/* Avatar */}
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                msg.role === "user"
                  ? "bg-primary-100 text-primary-600"
                  : "bg-success-100 text-success-600"
              }`}
            >
              {msg.role === "user" ? (
                <User className="w-4 h-4" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
            </div>

            {/* Bubble */}
            <div
              className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary-600 text-white rounded-tr-md"
                  : "bg-white border border-slate-200 text-slate-800 rounded-tl-md shadow-sm"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              <p
                className={`text-[10px] mt-1.5 ${
                  msg.role === "user"
                    ? "text-primary-200"
                    : "text-slate-400"
                }`}
              >
                {msg.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {loading && (
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-success-100 text-success-600">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input Bar ── */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-3 pt-4"
      >
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask a question, ${user?.full_name?.split(" ")[0] || "Doctor"}...`}
            disabled={loading}
            className="w-full px-5 py-3.5 rounded-2xl bg-white border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-sm disabled:opacity-50"
          />
        </div>
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
