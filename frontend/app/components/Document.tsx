"use client";
import React from "react";
import { useAuth } from "@clerk/nextjs";
import { Upload, FileText, Search, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { getAllDocs, uploadDoc } from "../api/api";
import { useDocumentStore } from "../zustand/stores/DocumentStore";
import { useComponentStore } from "../zustand/stores/ComponentStore";

type Document = {
  doc_id: string;
  doc_name: string;
  user_id: string;
};

export default function Documents() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<null | File>(null);
  const [documents, setDocuments] = React.useState<Document[]>([]);
  const { setDocument } = useDocumentStore();
  const { getToken } = useAuth();
  const { SetComponent } = useComponentStore();
  const handleFileChange = (e) => {
    const files = e.target.files;

    if (!files || files.length === 0) return;
    setFile(files[0]);
  };
  const handleUploadDoc = async () => {
    if (!file) return;
    const token = await getToken();
    try {
      const data = await uploadDoc(file, token);
      console.log("data", data);

      if (data.doc) {
        setDocuments((prev) => [...prev, data.doc]);
      }
    } catch (err) {
      console.log("err", err);
    }
  };
  React.useEffect(() => {
    const getDocuments = async () => {
      const token = await getToken();
      try {
        const data = await getAllDocs(token);
        if (data.docs) {
          setDocuments(data.docs);
        }
      } catch (err) {
        console.log("err", err);
      }
    };
    getDocuments();
  }, [getToken]);
  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Documents</h1>
          <p className="text-slate-500 mt-1">
            Upload and manage your knowledge base
          </p>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl hover:bg-blue-700"
        >
          <Upload size={18} />
          Upload Documents
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

      {/* Upload Zone */}
      <div className="mb-8 border-2 border-dashed border-blue-300 bg-blue-50 rounded-3xl p-10 text-center">
        <Upload className="mx-auto text-blue-600 mb-4" size={40} />

        {file ? (
          <>
            <h2 className="text-lg font-semibold text-slate-800">
              {file.name}
            </h2>{" "}
            <button
              onClick={handleUploadDoc}
              className="mt-5 bg-red-400 border text-black px-5 py-2 rounded-xl"
            >
              Upload
            </button>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-slate-800">
              Drag & Drop Documents
            </h2>

            <p className="text-slate-500 mt-2">
              Upload PDF, DOCX, TXT files for retrieval
            </p>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-5 bg-white border border-slate-200 px-5 py-2 rounded-xl"
            >
              Browse Files
            </button>
          </>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />

        <input
          placeholder="Search documents..."
          className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-4 outline-none"
        />
      </div>

      {/* Documents List */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-4 gap-4 px-6 py-4 border-b bg-slate-50 text-sm font-semibold text-slate-600">
          <div>Document</div>
          <div>Size</div>
        </div>

        {documents.map((doc) => (
          <div
            key={doc.doc_id}
            className="grid grid-cols-4 gap-4 px-6 py-5 border-b hover:bg-slate-50"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <FileText size={18} className="text-blue-600" />
              </div>

              <span className="font-medium text-slate-700">{doc.doc_name}</span>
            </div>

            <div className="flex items-center text-slate-500">200mb</div>
            <div
              onClick={() => {
                setDocument({ doc_id: doc.doc_id, doc_name: doc.doc_name });
                SetComponent("chats");
              }}
              className="flex items-center text-slate-500"
            >
              chat
            </div>
            {/* 
            <div className="flex items-center text-slate-500">
              {doc.uploadedAt}
            </div> */}

            {/* <div className="flex items-center">
              {doc.status === "indexed" ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 size={16} />
                  Indexed
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-600">
                  <Clock3 size={16} />
                  Processing
                </div>
              )}
            </div> */}

            <div className="flex justify-end">
              <button className="p-2 rounded-lg hover:bg-red-50 text-red-500">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
