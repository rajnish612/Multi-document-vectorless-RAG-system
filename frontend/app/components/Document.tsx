"use client";
import React from "react";
import { useAuth } from "@clerk/nextjs";
import {
  Upload,
  FileText,
  Search,
  Trash2,
  MessageSquare,
  AlertCircle,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { deleteDoc, getAllDocs, uploadDoc } from "../api/api";
import { useDocumentStore } from "../zustand/stores/DocumentStore";
import { useComponentStore } from "../zustand/stores/ComponentStore";

type Document = {
  doc_id: string;
  doc_name: string;
  user_id: string;
};

const EXT_COLORS: Record<string, string> = {
  PDF: "text-red-400 bg-red-400/10 border-red-400/20",
  DOCX: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  DOC: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  TXT: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
};
const EXT_ICON_COLORS: Record<string, string> = {
  PDF: "text-red-400",
  DOCX: "text-blue-400",
  DOC: "text-blue-400",
  TXT: "text-emerald-400",
};

export default function Documents() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<null | File>(null);
  const [documents, setDocuments] = React.useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { setDocument, selectedDoc, clearDocument } = useDocumentStore();
  const { getToken } = useAuth();
  const { SetComponent } = useComponentStore();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setFile(files[0]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };
  const handleDeleteDoc = async (doc_id: string) => {
    const token = await getToken();
    setDeletingId(doc_id);
    try {
      const data = await deleteDoc(token, doc_id);
      if (data.success) {
        setDocuments((prev) => prev.filter((d) => d.doc_id !== doc_id));
        // If the deleted doc was selected in chat, clear it
        if (selectedDoc?.doc_id === doc_id) {
          clearDocument();
        }
      }
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeletingId(null);
    }
  };
  const handleUploadDoc = async () => {
    if (!file) return;
    setIsUploading(true);
    const token = await getToken();
    try {
      const data = await uploadDoc(file, token);
      console.log("data", data);
      if (data.doc) {
        setDocuments((prev) => [...prev, data.doc]);
        setFile(null);
      }
    } catch (err) {
      console.log("err", err);
    } finally {
      setIsUploading(false);
    }
  };

  React.useEffect(() => {
    const getDocuments = async () => {
      setIsFetching(true);
      const token = await getToken();
      try {
        const data = await getAllDocs(token);
        if (data.docs) setDocuments(data.docs);
      } catch (err) {
        console.log("err", err);
      } finally {
        setIsFetching(false);
      }
    };
    getDocuments();
  }, [getToken]);

  const filtered = documents.filter((d) =>
    d.doc_name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getExt = (name: string) =>
    name.split(".").pop()?.toUpperCase() ?? "DOC";

  return (
    <div className="flex-1 min-h-screen overflow-y-auto bg-[#0d0f1a] px-10 py-9">
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-9 gap-4 flex-wrap">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 mb-3">
            <FileText size={10} />
            Knowledge Base
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">
            Documents
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">
            {documents.length} document{documents.length !== 1 ? "s" : ""} in
            your knowledge base
          </p>
        </div>

        <button
          id="upload-doc-btn"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-5 py-3 rounded-xl btn-gradient text-white font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5 shadow-[0_4px_20px_rgba(99,102,241,0.35)] cursor-pointer"
        >
          <Upload size={15} />
          Upload Document
        </button>

        <input
          hidden
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          multiple
          accept=".pdf,.doc,.docx,.txt"
        />
      </div>

      {/* ── Drop Zone ── */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !file && fileInputRef.current?.click()}
        className={`
          mb-7 rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-200 cursor-pointer
          ${
            isDragging
              ? "border-indigo-500 bg-indigo-500/10"
              : file
                ? "border-indigo-500/50 bg-indigo-500/5"
                : "border-white/[0.1] bg-white/[0.03] hover:border-white/20"
          }
        `}
      >
        {file ? (
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 flex items-center justify-center mb-4">
              <FileText size={24} className="text-indigo-400" />
            </div>
            <h2 className="text-base font-semibold text-slate-200 mb-1">
              {file.name}
            </h2>
            <p className="text-sm text-slate-500 mb-5">
              {(file.size / 1024).toFixed(1)} KB · Ready to upload
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleUploadDoc();
                }}
                disabled={isUploading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl btn-gradient text-white font-semibold text-sm disabled:opacity-70 cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
              >
                {isUploading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin-slow" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <Upload size={13} /> Upload Now
                  </>
                )}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-transparent border border-white/[0.1] text-slate-400 hover:bg-white/[0.07] hover:text-slate-200 text-sm font-medium transition-all duration-200 cursor-pointer"
              >
                <X size={13} /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 border transition-all duration-200
              ${isDragging ? "bg-indigo-500/25 border-indigo-500/40" : "bg-white/[0.04] border-white/[0.08]"}`}
            >
              <Upload
                size={22}
                className={isDragging ? "text-indigo-400" : "text-slate-500"}
              />
            </div>
            <h2 className="text-base font-semibold text-slate-400 mb-1">
              {isDragging ? "Drop to upload" : "Drag & drop your documents"}
            </h2>
            <p className="text-sm text-slate-600">
              or <span className="text-indigo-400 underline">browse files</span>{" "}
              · PDF, DOCX, TXT
            </p>
          </div>
        )}
      </div>

      {/* ── Search ── */}
      <div className="relative mb-6">
        <Search
          size={15}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
        />
        <input
          id="doc-search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search documents…"
          className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl py-3 pl-11 pr-4 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 transition-all duration-200"
        />
      </div>

      {/* ── Table ── */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-[1fr_100px_80px_60px] gap-4 px-5 py-3.5 border-b border-white/[0.08] bg-white/[0.02]">
          {["Document", "Size", "Chat", "Delete"].map((h) => (
            <div
              key={h}
              className="text-[11px] font-bold uppercase tracking-widest text-slate-600"
            >
              {h}
            </div>
          ))}
        </div>

        {/* ── Loading skeleton ── */}
        {isFetching && (
          <div className="flex flex-col">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_100px_80px_60px] gap-4 px-5 py-4 border-b border-white/[0.06] last:border-0 items-center"
              >
                {/* Name skeleton */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.06] animate-pulse shrink-0" />
                  <div className="flex flex-col gap-2 flex-1">
                    <div
                      className="h-3 rounded-full bg-white/[0.06] animate-pulse w-3/5"
                      style={{ animationDelay: `${i * 0.07}s` }}
                    />
                    <div
                      className="h-2.5 rounded-full bg-white/[0.04] animate-pulse w-1/4"
                      style={{ animationDelay: `${i * 0.07 + 0.1}s` }}
                    />
                  </div>
                </div>
                {/* Size skeleton */}
                <div
                  className="h-3 rounded-full bg-white/[0.06] animate-pulse w-12"
                  style={{ animationDelay: `${i * 0.07}s` }}
                />
                {/* Chat skeleton */}
                <div
                  className="h-7 rounded-lg bg-white/[0.06] animate-pulse w-16"
                  style={{ animationDelay: `${i * 0.07}s` }}
                />
                {/* Delete skeleton */}
                <div
                  className="h-8 w-8 rounded-lg bg-white/[0.06] animate-pulse"
                  style={{ animationDelay: `${i * 0.07}s` }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isFetching && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-600">
            <AlertCircle size={32} className="mb-3 opacity-40" />
            <p className="text-sm">
              {searchQuery
                ? "No documents match your search"
                : "No documents uploaded yet"}
            </p>
          </div>
        )}

        {/* Rows */}
        {!isFetching &&
          filtered.map((doc, idx) => {
            const ext = getExt(doc.doc_name);
            const extColor =
              EXT_COLORS[ext] ??
              "text-indigo-400 bg-indigo-400/10 border-indigo-400/20";
            const iconColor = EXT_ICON_COLORS[ext] ?? "text-indigo-400";

            return (
              <div
                key={doc.doc_id}
                className="grid grid-cols-[1fr_100px_80px_60px] gap-4 px-5 py-4 border-b border-white/[0.06] last:border-0 items-center hover:bg-white/[0.03] transition-colors duration-150 animate-fade-in"
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                {/* Name */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${extColor}`}
                  >
                    <FileText size={16} className={iconColor} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-200 truncate">
                      {doc.doc_name}
                    </p>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${extColor}`}
                    >
                      {ext}
                    </span>
                  </div>
                </div>

                {/* Size */}
                <div className="text-sm text-slate-500">200 KB</div>

                {/* Chat */}
                <button
                  id={`chat-doc-${doc.doc_id}`}
                  onClick={() => {
                    setDocument({ doc_id: doc.doc_id, doc_name: doc.doc_name });
                    SetComponent("chats");
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-500/12 border border-indigo-500/20 text-indigo-300 text-xs font-semibold hover:bg-indigo-500/25 transition-colors duration-150 cursor-pointer"
                >
                  <MessageSquare size={11} /> Chat
                </button>

                {/* Delete */}
                <button
                  id={`delete-doc-${doc.doc_id}`}
                  onClick={() => handleDeleteDoc(doc.doc_id)}
                  disabled={deletingId === doc.doc_id}
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-transparent border border-white/[0.08] text-slate-600 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all duration-150 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deletingId === doc.doc_id ? (
                    <span className="w-3.5 h-3.5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                </button>
              </div>
            );
          })}
      </div>
    </div>
  );
}
