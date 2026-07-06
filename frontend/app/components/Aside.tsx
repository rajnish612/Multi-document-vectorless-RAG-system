"use client";
import { MessageSquare, FileText } from "lucide-react";
import { useComponentStore } from "../zustand/stores/ComponentStore";

const menuItems = [
  {
    label: "Documents",
    component: "document",
    icon: MessageSquare,
    href: "main/chats",
  },
  {
    label: "Chats",
    component: "chats",
    icon: FileText,
    href: "main/documents",
  },
];

export default function AppSidebar() {
  const { SetComponent } = useComponentStore();
  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-slate-800">VectorLess</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <li key={item.label}>
                <a
                  onClick={() => SetComponent(item.component)}
                  className="
                    flex items-center gap-3
                    px-4 py-3
                    rounded-xl
                    text-gray-600
                    hover:bg-blue-50
                    hover:text-blue-600
                    transition-all
                  "
                >
                  <Icon size={18} />
                  <span className="font-medium">{item.label}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="rounded-xl bg-gray-50 p-3">
          <p className="text-xs text-gray-500">Vector-less RAG System</p>
          <p className="text-sm font-semibold text-slate-700">Ready</p>
        </div>
      </div>
    </aside>
  );
}
