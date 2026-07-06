"use client";
import { MessageSquare, FileText, ChevronRight, Cpu } from "lucide-react";
import { useComponentStore } from "../zustand/stores/ComponentStore";
import { UserButton } from "@clerk/nextjs";
import { useState } from "react";

const menuItems = [
  { label: "Documents", component: "document", icon: FileText,     description: "Manage your knowledge base" },
  { label: "Chat",      component: "chats",    icon: MessageSquare, description: "Ask questions with AI"      },
];

export default function AppSidebar() {
  const { SetComponent, SelectedComponent } = useComponentStore();
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <aside className="w-64 min-w-[256px] h-screen flex flex-col sticky top-0 border-r border-white/[0.08] bg-[#07080f]/80 backdrop-blur-2xl">

      {/* ── Logo ── */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-white/[0.08]">
        <div className="w-10 h-10 rounded-xl btn-gradient flex items-center justify-center shrink-0 shadow-[0_4px_16px_rgba(99,102,241,0.35)]">
          <Cpu size={18} className="text-white" />
        </div>
        <div>
          <p className="text-base font-extrabold tracking-tight text-slate-100 leading-none">
            Multi<span className="gradient-text">RAG</span>
          </p>
          <p className="text-[10px] font-medium text-slate-600 uppercase tracking-widest mt-1">
            AI Document Intelligence
          </p>
        </div>
      </div>

      {/* ── Nav label ── */}
      <p className="px-5 pt-5 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-600">
        Navigation
      </p>

      {/* ── Menu ── */}
      <nav className="flex-1 px-3">
        <ul className="flex flex-col gap-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive  = SelectedComponent === item.component;
            const isHovered = hovered === item.component;

            return (
              <li key={item.label}>
                <button
                  id={`nav-${item.component}`}
                  onClick={() => SetComponent(item.component)}
                  onMouseEnter={() => setHovered(item.component)}
                  onMouseLeave={() => setHovered(null)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left
                    border-l-[3px] transition-all duration-200 cursor-pointer
                    ${isActive
                      ? "bg-indigo-500/15 border-indigo-500"
                      : isHovered
                      ? "bg-white/[0.07] border-transparent"
                      : "bg-transparent border-transparent"
                    }
                  `}
                >
                  {/* Icon box */}
                  <div className={`
                    w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 border
                    ${isActive
                      ? "bg-indigo-500/25 border-indigo-500/40"
                      : "bg-white/[0.04] border-white/[0.08]"
                    }
                  `}>
                    <Icon size={15} className={isActive ? "text-indigo-400" : "text-slate-500"} />
                  </div>

                  {/* Label */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isActive ? "text-indigo-300" : "text-slate-400"}`}>
                      {item.label}
                    </p>
                    <p className="text-[11px] text-slate-600 truncate mt-0.5">
                      {item.description}
                    </p>
                  </div>

                  {isActive && <ChevronRight size={13} className="text-indigo-400 shrink-0" />}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ── Footer ── */}
      <div className="p-4 border-t border-white/[0.08] flex flex-col gap-3">
        {/* Status */}
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.07]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)] animate-pulse-dot shrink-0" />
          <div>
            <p className="text-xs font-semibold text-slate-300">System Online</p>
            <p className="text-[10px] text-slate-600">Vector-less RAG · Ready</p>
          </div>
        </div>

        {/* User */}
        <div className="flex items-center gap-3 px-2 py-1">
          <UserButton appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
          <p className="text-xs font-medium text-slate-500">Account</p>
        </div>
      </div>
    </aside>
  );
}
