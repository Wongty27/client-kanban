import { useState } from "react";
import { KanbanProvider } from "@/contexts/KanbanContext";
import { HomePage } from "./HomePage";
import { BoardView } from "./BoardView";

const Index = () => {
  const [view, setView] = useState<"home" | "board">("home");

  return (
    <KanbanProvider>
      {view === "home" ? (
        <HomePage onSelectBoard={() => setView("board")} />
      ) : (
        <BoardView onNavigateHome={() => setView("home")} />
      )}
    </KanbanProvider>
  );
};

export default Index;
