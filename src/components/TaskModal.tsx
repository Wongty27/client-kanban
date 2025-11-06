import { useState, useEffect } from "react";
import { Task, Label, Comment, Attachment } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Label as UILabel } from "./ui/label";
import { useKanban } from "@/contexts/KanbanContext";
import {
  Calendar as CalendarIcon,
  Tag,
  Paperclip,
  MessageSquare,
  X,
  Plus,
  Trash2,
  User,
} from "lucide-react";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { format } from "date-fns";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";
import { getLabelColorClass } from "@/lib/labelColors";

interface TaskModalProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
}

export function TaskModal({ task, open, onClose }: TaskModalProps) {
  const { state, updateTask, deleteTask } = useKanban();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [newComment, setNewComment] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setDueDate(task.dueDate ? new Date(task.dueDate) : undefined);
      setSelectedLabels(task.labels);
      setAssignedTo(task.assignedTo || "");
    }
  }, [task]);

  if (!task) return null;

  const handleSave = () => {
    updateTask(task.id, {
      title,
      description,
      dueDate: dueDate?.toISOString(),
      labels: selectedLabels,
      assignedTo: assignedTo || undefined,
    });
  };

  const handleDelete = () => {
    if (confirm("Delete this task?")) {
      deleteTask(task.id);
      onClose();
    }
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      const comment: Comment = {
        id: "comment-" + Date.now(),
        text: newComment.trim(),
        createdAt: new Date().toISOString(),
      };
      updateTask(task.id, {
        comments: [...task.comments, comment],
      });
      setNewComment("");
    }
  };

  const handleDeleteComment = (commentId: string) => {
    updateTask(task.id, {
      comments: task.comments.filter((c) => c.id !== commentId),
    });
  };

  const handleAddAttachment = () => {
    if (attachmentName.trim()) {
      const attachment: Attachment = {
        id: "attach-" + Date.now(),
        name: attachmentName.trim(),
        data: "",
        type: "link",
      };
      updateTask(task.id, {
        attachments: [...task.attachments, attachment],
      });
      setAttachmentName("");
    }
  };

  const handleDeleteAttachment = (attachmentId: string) => {
    updateTask(task.id, {
      attachments: task.attachments.filter((a) => a.id !== attachmentId),
    });
  };

  const toggleLabel = (labelId: string) => {
    const newLabels = selectedLabels.includes(labelId)
      ? selectedLabels.filter((id) => id !== labelId)
      : [...selectedLabels, labelId];
    setSelectedLabels(newLabels);
    updateTask(task.id, { labels: newLabels });
  };

  const labels = Object.values(state.labels);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <UILabel htmlFor="title">Title</UILabel>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSave}
              className="mt-1"
            />
          </div>

          {/* Description */}
          <div>
            <UILabel htmlFor="description">Description</UILabel>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleSave}
              placeholder="Add a description..."
              className="mt-1 min-h-[100px]"
            />
          </div>

          {/* Labels */}
          <div>
            <UILabel className="flex items-center gap-2 mb-2">
              <Tag className="w-4 h-4" />
              Labels
            </UILabel>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="mr-2 h-4 w-4" />
                  {selectedLabels.length > 0
                    ? `${selectedLabels.length} label(s) selected`
                    : "Add labels"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search labels..." />
                  <CommandList>
                    <CommandEmpty>No labels found.</CommandEmpty>
                    <CommandGroup>
                      {labels.map((label) => (
                        <CommandItem
                          key={label.id}
                          onSelect={() => toggleLabel(label.id)}
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <div
                              className={`w-4 h-4 rounded ${getLabelColorClass(label.color)}`}
                            />
                            <span>{label.name}</span>
                          </div>
                          {selectedLabels.includes(label.id) && (
                            <span className="ml-auto">✓</span>
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {selectedLabels.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedLabels.map((labelId) => {
                  const label = state.labels[labelId];
                  if (!label) return null;
                  return (
                    <Badge
                      key={label.id}
                      className={`${getLabelColorClass(label.color)} text-white hover:${getLabelColorClass(label.color)}`}
                    >
                      {label.name}
                      <button
                        onClick={() => toggleLabel(label.id)}
                        className="ml-1 hover:text-gray-200"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          {/* Assigned To */}
          <div>
            <UILabel htmlFor="assignedTo" className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4" />
              Assigned To
            </UILabel>
            <Input
              id="assignedTo"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              onBlur={handleSave}
              placeholder="Enter name..."
              className="mt-1"
            />
            {task.createdBy && (
              <p className="text-xs text-muted-foreground mt-1">
                Created by {task.createdBy}
              </p>
            )}
          </div>

          {/* Due Date */}
          <div>
            <UILabel className="flex items-center gap-2 mb-2">
              <CalendarIcon className="w-4 h-4" />
              Due Date
            </UILabel>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  {dueDate ? format(dueDate, "PPP") : "Set due date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={(date) => {
                    setDueDate(date);
                    updateTask(task.id, { dueDate: date?.toISOString() });
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Attachments */}
          <div>
            <UILabel className="flex items-center gap-2 mb-2">
              <Paperclip className="w-4 h-4" />
              Attachments
            </UILabel>
            <div className="space-y-2">
              {task.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between p-2 bg-muted rounded"
                >
                  <span className="text-sm">{attachment.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteAttachment(attachment.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  placeholder="Attachment name or URL..."
                  value={attachmentName}
                  onChange={(e) => setAttachmentName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddAttachment()}
                />
                <Button onClick={handleAddAttachment}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Comments */}
          <div>
            <UILabel className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4" />
              Comments
            </UILabel>
            <div className="space-y-2">
              {task.comments.map((comment) => (
                <div key={comment.id} className="p-3 bg-muted rounded space-y-1">
                  <div className="flex items-start justify-between">
                    <p className="text-sm flex-1">{comment.text}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteComment(comment.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(comment.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
              <div className="flex gap-2">
                <Textarea
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleAddComment();
                    }
                  }}
                  className="min-h-[60px]"
                />
                <Button onClick={handleAddComment}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="destructive" onClick={handleDelete}>
              Delete Task
            </Button>
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
