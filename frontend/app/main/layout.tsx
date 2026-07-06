import React from "react";
import AppSidebar from "../components/Aside";

const layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex">
      <AppSidebar />
      {children}
    </div>
  );
};

export default layout;
