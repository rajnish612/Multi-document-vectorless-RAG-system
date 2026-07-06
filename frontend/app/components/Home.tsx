"use client";
import React from "react";
import { useComponentStore } from "../zustand/stores/ComponentStore";
import ChatInterface from "./Chats";
import Documents from "./Document";
import { FileText, MessageSquare, Sparkles } from "lucide-react";

function WelcomeScreen() {
  const { SetComponent } = useComponentStore();
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#0d0f1a] px-6 py-16 animate-fade-in">
      <div className="animate-float w-20 h-20 rounded-3xl btn-gradient flex items-center justify-center mb-7 shadow-[0_8px_40px_rgba(99,102,241,0.4)]">
        <Sparkles size={36} className="text-white" />
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 mb-3 text-center">
        Welcome to <span className="gradient-text">MultiRAG</span>
      </h1>
      <p className="text-sm text-slate-500 mb-10 text-center max-w-sm leading-relaxed">
        Upload documents and query them with AI — no vector databases required.
      </p>
      <div className="flex gap-3 flex-wrap justify-center">
        <button
          id="go-to-documents"
          onClick={() => SetComponent("document")}
          className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl btn-gradient text-white font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5 shadow-[0_4px_20px_rgba(99,102,241,0.4)] cursor-pointer"
        >
          <FileText size={15} /> Upload Documents
        </button>
        <button
          id="go-to-chat"
          onClick={() => SetComponent("chats")}
          className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-white/[0.05] border border-white/[0.1] text-slate-300 font-semibold text-sm hover:bg-white/[0.09] hover:text-slate-100 transition-all duration-200 cursor-pointer"
        >
          <MessageSquare size={15} /> Open Chat
        </button>
      </div>
    </div>
  );
}

const Home = () => {
  const { SelectedComponent } = useComponentStore();

  switch (SelectedComponent) {
    case "document":
      return <div className="flex-1 flex min-w-0"><Documents /></div>;
    case "chats":
      return <div className="flex-1 flex min-w-0"><ChatInterface /></div>;
    default:
      return <div className="flex-1 flex min-w-0"><WelcomeScreen /></div>;
  }
};

export default Home;
