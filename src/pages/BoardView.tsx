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
import { attachClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";

interface BoardViewProps {
  onNavigateHome: () => void;
}

export function BoardView({ onNavigateHome }: BoardViewProps) {
  const { state, createColumn, getCurrentBoard, moveTask } = useKanban();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");

  const currentBoard = getCurrentBoard();

  useEffect(() => {
    if (!currentBoard) return;

    // Set up drag and drop for tasks
    const cleanup = monitorForElements({
      onDrop({ source, location }) {
        const destination = location.current.dropTargets[0];
        if (!destination) return;

        const taskId = source.data.taskId as string;
        const destinationColumnId = destination.data.columnId as string;
        
        // Get the column's tasks to determine the drop position
        const column = state.columns[destinationColumnId];
        if (!column) return;

        const sourceIndex = column.taskIds.indexOf(taskId);
        const closestEdge = extractClosestEdge(destination.data);
        
        let newOrder = column.taskIds.length;
        
        // Calculate new order based on closest edge
        if (closestEdge) {
          const targetTaskId = destination.data.taskId as string;
          const targetIndex = column.taskIds.indexOf(targetTaskId);
          
          if (closestEdge === "top") {
            newOrder = targetIndex;
          } else {
            newOrder = targetIndex + 1;
          }
        }

        // Adjust for same column reordering
        if (sourceIndex !== -1 && sourceIndex < newOrder) {
          newOrder = Math.max(0, newOrder - 1);
        }

        moveTask(taskId, destinationColumnId, newOrder);
      },
    });

    // Set up draggable tasks
    const taskElements = document.querySelectorAll("[data-task-id]");
    const taskCleanups: (() => void)[] = [];

    taskElements.forEach((element) => {
      const taskId = element.getAttribute("data-task-id");
      if (!taskId) return;

      const dragCleanup = draggable({
        element: element as HTMLElement,
        getInitialData: () => ({ taskId }),
      });

      const dropCleanup = dropTargetForElements({
        element: element as HTMLElement,
        getData: ({ input, element }) => {
          const taskId = element.getAttribute("data-task-id");
          return attachClosestEdge(
            {
              taskId,
              columnId: state.tasks[taskId!]?.columnId,
            },
            {
              input,
              element,
              allowedEdges: ["top", "bottom"],
            }
          );
        },
      });

      taskCleanups.push(dragCleanup, dropCleanup);
    });

    // Set up drop targets for columns
    const columnElements = document.querySelectorAll("[data-column-id]");
    const columnCleanups: (() => void)[] = [];

    columnElements.forEach((element) => {
      const columnId = element.getAttribute("data-column-id");
      if (!columnId) return;

      const cleanup = dropTargetForElements({
        element: element as HTMLElement,
        getData: () => ({ columnId }),
      });

      columnCleanups.push(cleanup);
    });

    return () => {
      cleanup();
      taskCleanups.forEach((fn) => fn());
      columnCleanups.forEach((fn) => fn());
    };
  }, [currentBoard, state.columns, state.tasks, moveTask]);

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
