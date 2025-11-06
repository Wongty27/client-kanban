import { useState, useEffect } from "react";
import { useKanban } from "@/contexts/KanbanContext";
import { KanbanColumn } from "@/components/KanbanColumn";
import { TaskModal } from "@/components/TaskModal";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Task } from "@/types";
import { Input } from "@/components/ui/input";
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";

interface BoardViewProps {
  onNavigateHome: () => void;
}

export function BoardView({ onNavigateHome }: BoardViewProps) {
  const { state, createColumn, getCurrentBoard, moveTask } = useKanban();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");

  const currentBoard = getCurrentBoard();

  // Monitor drag and drop globally
  useEffect(() => {
    return monitorForElements({
      onDrop({ source, location }) {
        const destination = location.current.dropTargets[0];
        if (!destination) return;

        const taskId = source.data.taskId as string;
        const sourceColumnId = source.data.columnId as string;
        const destinationColumnId = destination.data.columnId as string;

        if (!taskId || !destinationColumnId) return;

        const destinationColumn = state.columns[destinationColumnId];
        if (!destinationColumn) return;

        // Check if dropping on a task or on the column itself
        const targetTaskId = destination.data.taskId as string;
        let newOrder = 0;

        if (targetTaskId) {
          // Dropping on a task - use edge detection
          const closestEdge = extractClosestEdge(destination.data);
          const targetIndex = destinationColumn.taskIds.indexOf(targetTaskId);

          if (closestEdge === "bottom") {
            newOrder = targetIndex + 1;
          } else {
            newOrder = targetIndex;
          }

          // Adjust if moving within same column
          if (sourceColumnId === destinationColumnId) {
            const sourceIndex = destinationColumn.taskIds.indexOf(taskId);
            if (sourceIndex < targetIndex) {
              newOrder = Math.max(0, newOrder - 1);
            }
          }
        } else {
          // Dropping on empty column or at the end
          newOrder = destinationColumn.taskIds.length;
        }

        moveTask(taskId, destinationColumnId, newOrder);
      },
    });
  }, [state.columns, moveTask]);

  if (!currentBoard) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">No board selected</p>
      </div>
    );
  }

  const handleAddColumn = () => {
    if (newColumnName.trim()) {
      createColumn(currentBoard.id, newColumnName.trim());
      setNewColumnName("");
      setIsAddingColumn(false);
    }
  };

  const columns = currentBoard.columnIds.map((id) => state.columns[id]).filter(Boolean);

  return (
    <div className="flex flex-col h-screen bg-kanban-board">
      <Header onNavigateHome={onNavigateHome} />

      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <div className="flex gap-4 h-full">
          {columns.map((column) => {
            const tasks = column.taskIds
              .map((id) => state.tasks[id])
              .filter(Boolean)
              .sort((a, b) => a.order - b.order);

            return (
              <KanbanColumn
                key={column.id}
                column={column}
                tasks={tasks}
                labels={state.labels}
                onTaskClick={setSelectedTask}
                activeFilters={state.settings.activeFilters}
              />
            );
          })}

          {/* Add Column */}
          <div className="min-w-[280px]">
            {isAddingColumn ? (
              <div className="bg-kanban-column rounded-lg p-3 space-y-2">
                <Input
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddColumn();
                    if (e.key === "Escape") {
                      setIsAddingColumn(false);
                      setNewColumnName("");
                    }
                  }}
                  placeholder="Enter column name..."
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button onClick={handleAddColumn} size="sm" className="flex-1">
                    Add
                  </Button>
                  <Button
                    onClick={() => {
                      setIsAddingColumn(false);
                      setNewColumnName("");
                    }}
                    variant="ghost"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => setIsAddingColumn(true)}
                variant="ghost"
                className="w-full justify-start bg-kanban-column/50 hover:bg-kanban-column"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add column
              </Button>
            )}
          </div>
        </div>
      </div>

      <TaskModal
        task={selectedTask}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    </div>
  );
}
