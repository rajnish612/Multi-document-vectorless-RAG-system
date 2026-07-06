"use client";
import { Send, Paperclip, FileText, Sparkles } from "lucide-react";
import { useRef } from "react";

export default function DocumentsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
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
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Empty State */}
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-16 w-16 rounded-2xl bg-blue-100 flex items-center justify-center">
              <Sparkles className="text-blue-600" />
            </div>

            <h2 className="mt-6 text-2xl font-bold text-slate-800">
              How can I help you today?
            </h2>

            <p className="text-slate-500 mt-2">
              Upload documents and ask questions.
            </p>

            <div className="grid grid-cols-2 gap-4 mt-8 w-full max-w-2xl">
              <button className="bg-white border border-slate-200 rounded-xl p-4 text-left hover:border-blue-400">
                Summarize uploaded documents
              </button>

              <button className="bg-white border border-slate-200 rounded-xl p-4 text-left hover:border-blue-400">
                Find important insights
              </button>

              <button className="bg-white border border-slate-200 rounded-xl p-4 text-left hover:border-blue-400">
                Compare documents
              </button>

              <button className="bg-white border border-slate-200 rounded-xl p-4 text-left hover:border-blue-400">
                Generate report
              </button>
            </div>
          </div>

          {/* User Message */}
          <div className="flex justify-end mb-6">
            <div className="max-w-xl rounded-2xl bg-blue-600 text-white px-5 py-3">
              What are the key findings?
            </div>
          </div>

          {/* AI Response */}
          <div className="flex gap-4 mb-6">
            <div className="h-10 w-10 rounded-full bg-blue-600" />

            <div className="flex-1">
              {/* Sources */}
              <div className="flex gap-2 mb-3">
                <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-2 rounded-lg text-sm">
                  <FileText size={14} />
                  report.pdf
                </div>

                <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-2 rounded-lg text-sm">
                  <FileText size={14} />
                  research.docx
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5">
                Based on the uploaded documents, the primary findings indicate
                significant improvements in operational efficiency...
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-200 bg-white p-4">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl border border-slate-300 bg-white shadow-sm">
            <textarea
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

              <button className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700">
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
