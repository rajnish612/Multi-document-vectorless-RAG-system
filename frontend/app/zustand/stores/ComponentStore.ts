import { create } from "zustand";

type ComponentType = "document" | "chats";

interface ComponentStore {
  SelectedComponent: ComponentType;
  SetComponent: (comp: ComponentType) => void;
}

export const useComponentStore = create<ComponentStore>((set) => ({
  SelectedComponent: "document",
  SetComponent: (comp) => set({ SelectedComponent: comp }),
}));
