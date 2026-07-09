"use client";
import {
  MessageSquare,
  FileText,
  ChevronRight,
  Cpu,
  LogOut,
} from "lucide-react";
import { useComponentStore } from "../zustand/stores/ComponentStore";
import { useDocumentStore } from "../zustand/stores/DocumentStore";
import { useClerk, useUser } from "@clerk/nextjs";
import { useState } from "react";
import { useRouter } from "next/navigation";

const menuItems: Array<{
  label: string;
  component: "document" | "chats";
  icon: any;
  description: string;
}> = [
  {
    label: "Documents",
    component: "document",
    icon: FileText,
    description: "Manage your knowledge base",
  },
  {
    label: "Chat",
    component: "chats",
    icon: MessageSquare,
    description: "Ask questions with AI",
  },
];

export default function AppSidebar() {
  const { SetComponent, SelectedComponent } = useComponentStore();
  const { clearDocument } = useDocumentStore();
  const { signOut } = useClerk();
  const { user } = useUser();
  const router = useRouter();
  const [hovered, setHovered] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      // Clear all app state before signing out
      clearDocument();
      SetComponent("document");
      await signOut();
      router.push("/");
    } catch {
      setSigningOut(false);
    }
  };

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
            const isActive = SelectedComponent === item.component;
            const isHovered = hovered === item.component;

            return (
              <li key={item.label}>
                <button
                  id={`nav-${item.component}`}
                  onClick={() => {
                    SetComponent(item.component);
                    switch (item.component) {
                      case "document":
                        router.push("/main/documents");
                        break;
                      case "chats":
                        router.push("/main/chat");
                    }
                  }}
                  onMouseEnter={() => setHovered(item.component)}
                  onMouseLeave={() => setHovered(null)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left
                    border-l-[3px] transition-all duration-200 cursor-pointer
                    ${
                      isActive
                        ? "bg-indigo-500/15 border-indigo-500"
                        : isHovered
                          ? "bg-white/[0.07] border-transparent"
                          : "bg-transparent border-transparent"
                    }
                  `}
                >
                  {/* Icon box */}
                  <div
                    className={`
                    w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 border
                    ${
                      isActive
                        ? "bg-indigo-500/25 border-indigo-500/40"
                        : "bg-white/[0.04] border-white/[0.08]"
                    }
                  `}
                  >
                    <Icon
                      size={15}
                      className={
                        isActive ? "text-indigo-400" : "text-slate-500"
                      }
                    />
                  </div>

                  {/* Label */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-semibold truncate ${isActive ? "text-indigo-300" : "text-slate-400"}`}
                    >
                      {item.label}
                    </p>
                    <p className="text-[11px] text-slate-600 truncate mt-0.5">
                      {item.description}
                    </p>
                  </div>

                  {isActive && (
                    <ChevronRight
                      size={13}
                      className="text-indigo-400 shrink-0"
                    />
                  )}
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
            <p className="text-xs font-semibold text-slate-300">
              System Online
            </p>
            <p className="text-[10px] text-slate-600">
              Vector-less RAG · Ready
            </p>
          </div>
        </div>

        {/* User row + Sign Out */}
        <div className="flex flex-col gap-2">
          {/* User info */}
          <div className="flex items-center gap-3 px-2 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            {/* Avatar */}
            {user?.imageUrl ? (
              <img
                src={user.imageUrl}
                alt="avatar"
                className="w-8 h-8 rounded-lg object-cover shrink-0 ring-1 ring-white/10"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-indigo-400">
                  {user?.firstName?.[0] ?? "?"}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-300 truncate leading-none">
                {user?.fullName ?? user?.firstName ?? "User"}
              </p>
              <p className="text-[10px] text-slate-600 truncate mt-0.5">
                {user?.primaryEmailAddress?.emailAddress ?? ""}
              </p>
            </div>
          </div>

          {/* Sign Out button */}
          <button
            id="signout-btn"
            onClick={handleSignOut}
            disabled={signingOut}
            className={`
              w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl
              border text-xs font-semibold transition-all duration-200 cursor-pointer
              ${
                signingOut
                  ? "bg-white/[0.02] border-white/[0.05] text-slate-600 cursor-not-allowed"
                  : "bg-red-500/8 border-red-500/20 text-red-400 hover:bg-red-500/15 hover:border-red-500/35 hover:text-red-300 active:scale-[0.98]"
              }
            `}
          >
            <LogOut size={13} className={signingOut ? "opacity-40" : ""} />
            {signingOut ? "Signing out…" : "Sign Out"}
          </button>
        </div>
      </div>
    </aside>
  );
}
