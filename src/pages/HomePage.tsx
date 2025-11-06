import { useState } from "react";
import { useKanban } from "@/contexts/KanbanContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Trash2, Moon, Sun, Download, Upload } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { exportData, downloadJSON, importData } from "@/lib/storage";

interface HomePageProps {
  onSelectBoard: (boardId: string) => void;
}

export function HomePage({ onSelectBoard }: HomePageProps) {
  const { state, createBoard, deleteBoard, setCurrentBoard, toggleTheme } = useKanban();
  const [isCreating, setIsCreating] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");

  const boards = Object.values(state.boards);

  const handleCreateBoard = () => {
    if (newBoardName.trim()) {
      createBoard(newBoardName.trim());
      setNewBoardName("");
      setIsCreating(false);
      toast({
        title: "Board created",
        description: `Board "${newBoardName}" has been created.`,
      });
    }
  };

  const handleDeleteBoard = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Delete board "${name}" and all its contents?`)) {
      deleteBoard(id);
      toast({
        title: "Board deleted",
        description: `Board "${name}" has been deleted.`,
      });
    }
  };

  const handleSelectBoard = (boardId: string) => {
    setCurrentBoard(boardId);
    onSelectBoard(boardId);
  };

  const handleExport = () => {
    const data = exportData(state);
    const filename = `kanban-backup-${new Date().toISOString().split("T")[0]}.json`;
    downloadJSON(data, filename);
    toast({
      title: "Export successful",
      description: "Your boards have been exported.",
    });
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = importData(e.target?.result as string);
            if (data) {
              window.location.reload();
            } else {
              toast({
                title: "Import failed",
                description: "Invalid file format.",
                variant: "destructive",
              });
            }
          } catch (error) {
            toast({
              title: "Import failed",
              description: "Could not read file.",
              variant: "destructive",
            });
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Team-Ready Kanban</h1>
            <p className="text-sm text-muted-foreground">
              Privacy-first, client-side project management
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={handleImport}>
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button variant="outline" size="sm" onClick={toggleTheme}>
              {state.settings.theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Your Boards</h2>
          {!isCreating && (
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Board
            </Button>
          )}
        </div>

        {isCreating && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create New Board</CardTitle>
              <div className="flex gap-2 mt-4">
                <Input
                  placeholder="Board name..."
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateBoard();
                    if (e.key === "Escape") {
                      setIsCreating(false);
                      setNewBoardName("");
                    }
                  }}
                  autoFocus
                />
                <Button onClick={handleCreateBoard}>Create</Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false);
                    setNewBoardName("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardHeader>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map((board) => {
            const columnCount = board.columnIds.length;
            const taskCount = board.columnIds.reduce((count, colId) => {
              const column = state.columns[colId];
              return count + (column?.taskIds.length || 0);
            }, 0);

            return (
              <Card
                key={board.id}
                className="cursor-pointer hover:shadow-lg transition-shadow group"
                onClick={() => handleSelectBoard(board.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle>{board.name}</CardTitle>
                      <CardDescription className="mt-2">
                        {columnCount} column{columnCount !== 1 && "s"} •{" "}
                        {taskCount} task{taskCount !== 1 && "s"}
                      </CardDescription>
                      <p className="text-xs text-muted-foreground mt-2">
                        Updated {new Date(board.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDeleteBoard(board.id, board.name, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {boards.length === 0 && !isCreating && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              No boards yet. Create your first board to get started!
            </p>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Board
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
