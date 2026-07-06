import React from "react";
import AppSidebar from "../components/Aside";

const layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex h-screen overflow-hidden bg-[#07080f]">
      <AppSidebar />
      <main className="flex flex-1 overflow-hidden min-w-0">
        {children}
      </main>
    </div>
  );
};

export default layout;
