"use client";
import React from "react";
import { useComponentStore } from "../zustand/stores/ComponentStore";
import ChatInterface from "./Chats";
import Documents from "./Document";

const Home = () => {
  const { SelectedComponent } = useComponentStore();

  switch (SelectedComponent) {
    case "document":
      return (
        <div className="-h-screen  w-full">
          <Documents />
        </div>
      );

    case "chats":
      return (
        <div className="-h-screen  w-full">
          <ChatInterface />
        </div>
      );
  }
};

export default Home;
