"use client";
import {
  Send,
  Paperclip,
  FileText,
  Sparkles,
  Bot,
  User,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useRef, useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { chat, getAllMessages } from "../api/api";
import { useDocumentStore } from "../zustand/stores/DocumentStore";
import { useComponentStore } from "../zustand/stores/ComponentStore";
import { useRouter } from "next/navigation";

type Message = { id: string; role: "User" | "Assistant"; text: string };

const SUGGESTIONS = [
  "Summarize the key findings",
  "What are the main topics?",
  "Find important insights",
  "List key conclusions",
];

export default function ChatInterface() {
  const { getToken } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const router = useRouter();
  // Separate loading states — history fetch vs AI response
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const { selectedDoc } = useDocumentStore();
  const { SetComponent } = useComponentStore();

  const hasDoc = !!(selectedDoc?.doc_id && selectedDoc?.doc_name);

  // Auto-scroll to bottom on new messages or AI typing
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isSending]);

  // Fetch history whenever the selected document changes
  const fetchMessages = useCallback(async () => {
    if (!selectedDoc?.doc_id) return;
    setIsFetchingHistory(true);
    setHistoryError(null);
    try {
      const token = await getToken();
      if (!token) return;
      const data = await getAllMessages(token, selectedDoc.doc_id);
      setMessages(data.data ?? []);
    } catch {
      setHistoryError("Failed to load conversation history. Tap to retry.");
    } finally {
      setIsFetchingHistory(false);
    }
  }, [getToken, selectedDoc]);
  // async () =>

  useEffect(() => {
    // setMessages([]);
    fetchMessages();
  }, [fetchMessages]);

  const handleSend = async () => {
    if (!query.trim() || !hasDoc || isSending) return;
    const token = await getToken();
    if (!token) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "User",
      text: query,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsSending(true);
    try {
      const data = await chat(token, selectedDoc.doc_id, query);

      setMessages((prev) => [...prev, data.data]);
      setQuery("");
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "Assistant",
          text: "Sorry, something went wrong. Please try again.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#0d0f1a]">
      {/* ── Header ── */}
      <div className="h-16 shrink-0 flex items-center justify-between px-7 border-b border-white/[0.08] bg-[#07080f]/60 backdrop-blur-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl btn-gradient flex items-center justify-center shadow-[0_4px_16px_rgba(99,102,241,0.35)]">
            <Bot size={17} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-100 leading-none">
              AI Assistant
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Ask questions about your documents
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Doc pill */}
          {hasDoc ? (
            <button
              onClick={() => {
                SetComponent("document");
                router.push("/main/documents");
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-indigo-300 bg-indigo-500/12 border border-indigo-500/25 hover:bg-indigo-500/20 transition-colors duration-150 cursor-pointer max-w-[160px]"
            >
              <FileText size={11} />
              <span className="truncate">{selectedDoc.doc_name}</span>
            </button>
          ) : (
            <button
              onClick={() => {
                SetComponent("document");
                router.push("/main/documents");
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/15 transition-colors duration-150 cursor-pointer"
            >
              <AlertCircle size={11} /> No document selected
            </button>
          )}

          {/* New chat */}
          <button
            id="new-chat-btn"
            onClick={() => setMessages([])}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl btn-gradient text-white font-semibold text-xs transition-all duration-200 hover:-translate-y-0.5 cursor-pointer shadow-[0_4px_16px_rgba(99,102,241,0.3)]"
          >
            <Sparkles size={12} /> New Chat
          </button>
        </div>
      </div>

      {/* ── Messages ── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-7 py-7 flex flex-col gap-5"
      >
        {/* History loading skeleton */}
        {isFetchingHistory && (
          <div className="flex flex-col gap-5 animate-fade-in">
            {[1, 0.7, 0.9].map((w, i) => (
              <div
                key={i}
                className={`flex gap-3 items-end ${i % 2 === 0 ? "justify-start" : "justify-end"}`}
              >
                {i % 2 === 0 && (
                  <div className="w-9 h-9 rounded-xl bg-white/[0.06] shrink-0 animate-pulse" />
                )}
                <div
                  className="h-10 rounded-2xl bg-white/[0.05] animate-pulse"
                  style={{ width: `${w * 55}%`, animationDelay: `${i * 0.1}s` }}
                />
                {i % 2 !== 0 && (
                  <div className="w-9 h-9 rounded-xl bg-white/[0.06] shrink-0 animate-pulse" />
                )}
              </div>
            ))}
          </div>
        )}

        {/* History error */}
        {historyError && !isFetchingHistory && (
          <div className="flex flex-col items-center justify-center py-10 gap-3 animate-fade-in">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <AlertCircle size={20} className="text-red-400" />
            </div>
            <p className="text-sm text-slate-500 text-center max-w-xs">
              {historyError}
            </p>
            <button
              onClick={fetchMessages}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.1] text-slate-300 text-xs font-semibold hover:bg-white/[0.09] transition-colors cursor-pointer"
            >
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {!isFetchingHistory &&
          !historyError &&
          messages.length === 0 &&
          !isSending && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-16 animate-fade-in">
              <div className="animate-float w-20 h-20 rounded-3xl btn-gradient flex items-center justify-center mb-6 shadow-[0_8px_40px_rgba(99,102,241,0.4)]">
                <Sparkles size={34} className="text-white" />
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-100 mb-2">
                How can I help you today?
              </h2>
              <p className="text-sm text-slate-500 mb-9 max-w-xs leading-relaxed">
                {hasDoc
                  ? `Chatting with "${selectedDoc.doc_name}"`
                  : "Select a document to start asking questions"}
              </p>

              <div className="grid grid-cols-2 gap-3 w-full max-w-md">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setQuery(s)}
                    className="px-4 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-slate-400 text-sm font-medium text-left hover:bg-white/[0.07] hover:border-indigo-500/40 hover:text-slate-200 transition-all duration-200 cursor-pointer"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

        {/* Message bubbles */}
        {!isFetchingHistory &&
          messages.map((msg, idx) => (
            <div
              key={msg.id}
              className={`flex gap-3 items-end animate-fade-in ${msg.role === "User" ? "justify-end" : "justify-start"}`}
              style={{ animationDelay: `${idx * 0.02}s` }}
            >
              {/* AI avatar */}
              {msg.role === "Assistant" && (
                <div className="w-9 h-9 rounded-xl btn-gradient flex items-center justify-center shrink-0 shadow-[0_4px_16px_rgba(99,102,241,0.3)]">
                  <Bot size={15} className="text-white" />
                </div>
              )}

              <div className="flex flex-col gap-1.5 max-w-[68%]">
                {/* Source chip for AI */}
                {msg.role === "Assistant" && hasDoc && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 self-start">
                    <FileText size={9} /> {selectedDoc.doc_name}
                  </span>
                )}
                <div
                  className={`
                  px-4 py-3.5 text-sm leading-relaxed
                  ${
                    msg.role === "User"
                      ? "rounded-[18px_18px_4px_18px] btn-gradient text-white shadow-[0_4px_20px_rgba(99,102,241,0.3)]"
                      : "rounded-[4px_18px_18px_18px] bg-white/[0.04] border border-white/[0.08] text-slate-300"
                  }
                `}
                >
                  {msg.text}
                </div>
              </div>

              {/* User avatar */}
              {msg.role === "User" && (
                <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center shrink-0">
                  <User size={15} className="text-slate-500" />
                </div>
              )}
            </div>
          ))}

        {/* AI thinking dots */}
        {isSending && (
          <div className="flex gap-3 items-end animate-fade-in">
            <div className="w-9 h-9 rounded-xl btn-gradient flex items-center justify-center shrink-0 shadow-[0_4px_16px_rgba(99,102,241,0.3)]">
              <Bot size={15} className="text-white" />
            </div>
            <div className="px-4 py-4 rounded-[4px_18px_18px_18px] bg-white/[0.04] border border-white/[0.08] flex items-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse-dot"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Input Area ── */}
      <div className="shrink-0 px-7 pb-6 pt-4 border-t border-white/[0.08] bg-[#07080f]/50 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto">
          {/* No-doc warning */}
          {!hasDoc && (
            <button
              onClick={() => {
                SetComponent("document");
                router.push("/main/documents");
              }}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-3 mb-3 rounded-xl bg-red-500/8 border border-red-500/20 text-red-400 text-sm font-semibold hover:bg-red-500/14 transition-colors duration-200 cursor-pointer"
            >
              <AlertCircle size={14} />
              No document selected — click to pick one
            </button>
          )}

          {/* Textarea box */}
          <div
            className={`
            rounded-2xl border overflow-hidden transition-all duration-200
            ${
              hasDoc && !isFetchingHistory
                ? "bg-white/[0.05] border-white/[0.09] focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/10"
                : "bg-white/[0.02] border-white/[0.05] opacity-50 pointer-events-none"
            }
          `}
          >
            <textarea
              id="chat-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!hasDoc || isSending || isFetchingHistory}
              placeholder={
                isFetchingHistory
                  ? "Loading conversation…"
                  : hasDoc
                    ? `Ask about "${selectedDoc?.doc_name}"…`
                    : "Select a document to start chatting…"
              }
              rows={3}
              className="w-full resize-none bg-transparent outline-none px-5 pt-4 pb-3 text-sm text-slate-200 placeholder:text-slate-600 disabled:cursor-not-allowed"
            />

            <div className="flex items-center justify-between px-4 pb-3 pt-1 border-t border-white/[0.07]">
              <div className="flex items-center gap-2">
                <button
                  id="attach-btn"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/[0.09] text-slate-500 hover:bg-white/[0.07] hover:text-slate-300 transition-all duration-150 cursor-pointer"
                >
                  <Paperclip size={14} />
                </button>
                <span className="text-xs text-slate-600">
                  PDF, DOCX, TXT · ⏎ to send
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt"
                  hidden
                />
              </div>

              <button
                id="send-btn"
                onClick={handleSend}
                disabled={
                  !query.trim() || isSending || !hasDoc || isFetchingHistory
                }
                className={`
                  w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200
                  ${
                    query.trim() && !isSending && hasDoc && !isFetchingHistory
                      ? "btn-gradient text-white shadow-[0_4px_16px_rgba(99,102,241,0.35)] hover:-translate-y-0.5 cursor-pointer"
                      : "bg-white/[0.04] border border-white/[0.09] text-slate-600 cursor-not-allowed"
                  }
                `}
              >
                {isSending ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send size={14} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
