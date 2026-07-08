import { create } from "zustand";

type Doc = {
  doc_id: string;
  doc_name: string;
};

interface DocumentStore {
  selectedDoc: Doc | null;
  setDocument: (doc: Doc) => void;
  clearDocument: () => void;
}

export const useDocumentStore = create<DocumentStore>((set) => ({
  selectedDoc: null,

  setDocument: (doc) =>
    set({
      selectedDoc: {
        doc_id: doc.doc_id,
        doc_name: doc.doc_name,
      },
    }),

  clearDocument: () => set({ selectedDoc: null }),
}));
