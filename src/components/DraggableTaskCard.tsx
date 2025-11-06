import { useEffect, useRef, useState } from "react";
import { Task, Label } from "@/types";
import { TaskCard } from "./TaskCard";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { attachClosestEdge, extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { DropIndicator } from "@atlaskit/pragmatic-drag-and-drop-react-drop-indicator/box";

interface DraggableTaskCardProps {
  task: Task;
  labels: Record<string, Label>;
  onClick: () => void;
}

export function DraggableTaskCard({ task, labels, onClick }: DraggableTaskCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [closestEdge, setClosestEdge] = useState<"top" | "bottom" | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    return combine(
      draggable({
        element,
        getInitialData: () => ({ taskId: task.id, columnId: task.columnId }),
        onDragStart: () => setIsDragging(true),
        onDrop: () => setIsDragging(false),
      }),
      dropTargetForElements({
        element,
        getData: ({ input }) => {
          return attachClosestEdge(
            { taskId: task.id, columnId: task.columnId },
            {
              input,
              element,
              allowedEdges: ["top", "bottom"],
            }
          );
        },
        onDragEnter: ({ self }) => {
          const edge = extractClosestEdge(self.data);
          setClosestEdge(edge === "top" || edge === "bottom" ? edge : null);
        },
        onDrag: ({ self }) => {
          const edge = extractClosestEdge(self.data);
          setClosestEdge(edge === "top" || edge === "bottom" ? edge : null);
        },
        onDragLeave: () => {
          setClosestEdge(null);
        },
        onDrop: () => {
          setClosestEdge(null);
        },
      })
    );
  }, [task.id, task.columnId]);

  return (
    <div
      ref={ref}
      className="relative"
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: isDragging ? "grabbing" : "grab",
      }}
    >
      {closestEdge === "top" && <DropIndicator edge="top" gap="8px" />}
      <TaskCard task={task} labels={labels} onClick={onClick} />
      {closestEdge === "bottom" && <DropIndicator edge="bottom" gap="8px" />}
    </div>
  );
}
