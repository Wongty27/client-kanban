import { useState, useRef, useEffect } from "react";
import { Column, Task, Label } from "@/types";
import { DraggableTaskCard } from "./DraggableTaskCard";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Plus, MoreVertical, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useKanban } from "@/contexts/KanbanContext";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
  labels: Record<string, Label>;
  onTaskClick: (task: Task) => void;
  activeFilters: string[];
}

export function KanbanColumn({
  column,
  tasks,
  labels,
  onTaskClick,
  activeFilters,
}: KanbanColumnProps) {
  const { createTask, updateColumn, deleteColumn } = useKanban();
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(column.name);
  const [isDraggedOver, setIsDraggedOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const columnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAddingTask && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAddingTask]);

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  // Set up column as drop target
  useEffect(() => {
    const element = columnRef.current;
    if (!element) return;

    return dropTargetForElements({
      element,
      getData: () => ({ columnId: column.id }),
      onDragEnter: () => setIsDraggedOver(true),
      onDragLeave: () => setIsDraggedOver(false),
      onDrop: () => setIsDraggedOver(false),
    });
  }, [column.id]);

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      createTask(column.id, newTaskTitle.trim());
      setNewTaskTitle("");
      setIsAddingTask(false);
    }
  };

  const handleUpdateName = () => {
    if (editedName.trim() && editedName !== column.name) {
      updateColumn(column.id, { name: editedName.trim() });
    }
    setIsEditingName(false);
  };

  const handleDeleteColumn = () => {
    if (confirm(`Delete column "${column.name}" and all its tasks?`)) {
      deleteColumn(column.id);
    }
  };

  // Filter tasks based on active filters
  const filteredTasks = tasks.filter((task) => {
    if (activeFilters.length === 0) return true;
    return task.labels.some((labelId) => activeFilters.includes(labelId));
  });

  return (
    <div
      ref={columnRef}
      className={`flex flex-col bg-kanban-column rounded-lg p-3 min-w-[280px] max-w-[280px] h-fit max-h-[calc(100vh-12rem)] transition-all ${
        isDraggedOver ? "ring-2 ring-primary ring-opacity-50 bg-primary-light" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        {isEditingName ? (
          <Input
            ref={nameInputRef}
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onBlur={handleUpdateName}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleUpdateName();
              if (e.key === "Escape") {
                setEditedName(column.name);
                setIsEditingName(false);
              }
            }}
            className="h-7 text-sm font-semibold"
          />
        ) : (
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            {column.name}
            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {filteredTasks.length}
            </span>
          </h2>
        )}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsEditingName(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDeleteColumn} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 mb-2 pr-1">
        {filteredTasks.map((task) => (
          <DraggableTaskCard
            key={task.id}
            task={task}
            labels={labels}
            onClick={() => onTaskClick(task)}
          />
        ))}
        {filteredTasks.length === 0 && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            {activeFilters.length > 0 ? "No matching tasks" : "Drop tasks here"}
          </div>
        )}
      </div>

      {isAddingTask ? (
        <div className="space-y-2">
          <Input
            ref={inputRef}
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddTask();
              if (e.key === "Escape") {
                setIsAddingTask(false);
                setNewTaskTitle("");
              }
            }}
            placeholder="Enter task title..."
            className="h-9 text-sm"
          />
          <div className="flex gap-2">
            <Button onClick={handleAddTask} size="sm" className="flex-1">
              Add
            </Button>
            <Button
              onClick={() => {
                setIsAddingTask(false);
                setNewTaskTitle("");
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
          onClick={() => setIsAddingTask(true)}
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add task
        </Button>
      )}
    </div>
  );
}
