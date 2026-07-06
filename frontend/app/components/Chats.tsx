"use client";
import { Send, Paperclip, FileText, Sparkles } from "lucide-react";
import { useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { chat, uploadDoc } from "../api/api";
import { useDocumentStore } from "../zustand/stores/DocumentStore";
export default function ChatInterface() {
  const { getToken } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState<string>("");
  const { selectedDoc } = useDocumentStore();
  const handleSend = async () => {
    const token = await getToken();

    try {
      const data = await chat(token, "pi-cmpxt6mh203aw01qub020kffu", query);
      console.log("data", data);
    } catch (err) {}
  };
  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <div className="h-16 bg-white border-b p-5 border-slate-200 flex items-center justify-between px-6">
        <div>
          <h1 className="font-semibold text-slate-800">AI Assistant</h1>
          <p className="text-xs text-slate-500">
            Ask questions about your documents
          </p>
        </div>

        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
          <Sparkles size={16} />
          New Chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1  px-6 py-8">
        <div className="flex gap-2 mb-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-2 rounded-lg text-sm">
            <FileText size={14} />
            {!selectedDoc || !selectedDoc.doc_id || !selectedDoc.doc_name
              ? "NOT SELECTED"
              : selectedDoc.doc_name}
          </div>
        </div>
        <div className="overflow-y-scroll  max-h-100 mx-auto">
          <div className="flex justify-end mb-6">
            <div className="max-w-xl rounded-2xl bg-blue-600 text-white px-5 py-3">
              What are the key findings?
            </div>
          </div>
          {/* AI Response */}
          {Array.from({ length: 10 }).map((i, idx) => {
            return (
              <div key={idx} className="flex gap-4 mb-6">
                <div className="h-10 w-10 rounded-full bg-blue-600" />

                <div className="flex-1">
                  {/* Sources */}

                  <div className="bg-white border border-slate-200 rounded-2xl p-5">
                    Based on the uploaded documents, the primary findings
                    indicate significant improvements in operational
                    efficiency...
                  </div>
                </div>
              </div>
            );
          })}{" "}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-200 bg-white p-4">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl border border-slate-300 bg-white shadow-sm">
            <textarea
              onChange={(e) => {
                setQuery(e.target.value);
              }}
              placeholder="Ask a question..."
              className="w-full resize-none border-none outline-none p-4 rounded-t-2xl"
              rows={3}
            />

            <div className="flex items-center justify-between p-3 border-t border-slate-200">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-lg hover:bg-slate-100"
                >
                  <Paperclip size={18} />
                </button>

                <span className="text-sm text-slate-500">
                  Upload PDF, DOCX, TXT
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
                onClick={handleSend}
                className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
