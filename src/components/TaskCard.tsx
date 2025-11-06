import { Task, Label } from "@/types";
import { Calendar, MessageSquare, Paperclip } from "lucide-react";
import { Badge } from "./ui/badge";
import { getLabelColorClass } from "@/lib/labelColors";

interface TaskCardProps {
  task: Task;
  labels: Record<string, Label>;
  onClick: () => void;
}

export function TaskCard({ task, labels, onClick }: TaskCardProps) {
  const taskLabels = task.labels
    .map((labelId) => labels[labelId])
    .filter(Boolean);

  const hasMeta = task.dueDate || task.attachments.length > 0 || task.comments.length > 0;

  return (
    <div
      onClick={onClick}
      className="group bg-card rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-border"
    >
      {taskLabels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {taskLabels.map((label) => (
            <Badge
              key={label.id}
              className={`${getLabelColorClass(label.color)} text-white hover:${getLabelColorClass(label.color)} text-xs px-2 py-0`}
            >
              {label.name}
            </Badge>
          ))}
        </div>
      )}
      
      <h3 className="text-sm font-medium text-foreground mb-1 group-hover:text-primary transition-colors">
        {task.title}
      </h3>
      
      {task.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
          {task.description}
        </p>
      )}

      {hasMeta && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {task.dueDate && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{new Date(task.dueDate).toLocaleDateString()}</span>
            </div>
          )}
          {task.attachments.length > 0 && (
            <div className="flex items-center gap-1">
              <Paperclip className="w-3 h-3" />
              <span>{task.attachments.length}</span>
            </div>
          )}
          {task.comments.length > 0 && (
            <div className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              <span>{task.comments.length}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
