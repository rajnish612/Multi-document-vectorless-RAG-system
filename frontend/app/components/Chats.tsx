"use client";
import {
  Send,
  Paperclip,
  FileText,
  Sparkles,
  Bot,
  User,
  AlertCircle,
} from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { chat, getAllMessages } from "../api/api";
import { useDocumentStore } from "../zustand/stores/DocumentStore";
import { useComponentStore } from "../zustand/stores/ComponentStore";

type Message = { id: string; role: "User" | "Assistant"; text: string };

const SUGGESTIONS = [
  "Summarize the key findings",
  "What are the main topics?",
  "Find important insights",
  "Compare documents",
];

export default function ChatInterface() {
  const { getToken } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { selectedDoc } = useDocumentStore();
  const { SetComponent } = useComponentStore();

  const hasDoc = !!(selectedDoc?.doc_id && selectedDoc?.doc_name);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!query.trim() || !hasDoc) return;
    const token = await getToken();
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "User",
      text: query,
    };
    setMessages((prev) => [...prev, userMsg]);
    setQuery("");
    setIsLoading(true);
    try {
      const data = await chat(token, selectedDoc.doc_id, query);
      console.log("data", data.data);
      setMessages((prev) => [...prev, data.data]);
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
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedDoc?.doc_id) return;
      const token = await getToken();
      setIsLoading(true);
      try {
        const data = await getAllMessages(token, selectedDoc?.doc_id);
        setMessages(data.data);
      } catch (err) {
      } finally {
        setIsLoading(false);
      }
    };
    fetchMessages();
  }, [selectedDoc, getToken]);
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
              onClick={() => SetComponent("document")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-indigo-300 bg-indigo-500/12 border border-indigo-500/25 hover:bg-indigo-500/20 transition-colors duration-150 cursor-pointer max-w-[160px]"
            >
              <FileText size={11} />
              <span className="truncate">{selectedDoc.doc_name}</span>
            </button>
          ) : (
            <button
              onClick={() => SetComponent("document")}
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
        {/* Empty state */}
        {messages.length === 0 && !isLoading && (
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
        {messages.map((msg, idx) => (
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

        {/* Loading dots */}
        {isLoading && (
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
              onClick={() => SetComponent("document")}
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
              hasDoc
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
              disabled={!hasDoc}
              placeholder={
                hasDoc
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
                disabled={!query.trim() || isLoading || !hasDoc}
                className={`
                  w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200
                  ${
                    query.trim() && !isLoading && hasDoc
                      ? "btn-gradient text-white shadow-[0_4px_16px_rgba(99,102,241,0.35)] hover:-translate-y-0.5 cursor-pointer"
                      : "bg-white/[0.04] border border-white/[0.09] text-slate-600 cursor-not-allowed"
                  }
                `}
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
