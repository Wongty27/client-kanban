import { useState, useRef, useEffect } from "react";
import { Column, Task, Label } from "@/types";
import { TaskCard } from "./TaskCard";
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
import { cn } from "@/lib/utils";

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
  const inputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

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
    <div className="flex flex-col bg-kanban-column rounded-lg p-3 min-w-[280px] max-w-[280px] h-fit max-h-[calc(100vh-12rem)]">
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

      <div className="flex-1 overflow-y-auto space-y-2 mb-2 pr-1" data-column-id={column.id}>
        {filteredTasks.map((task) => (
          <div key={task.id} data-task-id={task.id}>
            <TaskCard task={task} labels={labels} onClick={() => onTaskClick(task)} />
          </div>
        ))}
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
