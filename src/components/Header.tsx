import { useState } from "react";
import { useKanban } from "@/contexts/KanbanContext";
import { Button } from "./ui/button";
import {
  Moon,
  Sun,
  Download,
  Upload,
  Settings,
  Filter,
  Tag,
  Plus,
  Home,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "./ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label as UILabel } from "./ui/label";
import { exportData, downloadJSON, importData } from "@/lib/storage";
import { toast } from "@/hooks/use-toast";
import { Badge } from "./ui/badge";
import { LabelColor } from "@/types";
import { getLabelColorClass } from "@/lib/labelColors";

interface HeaderProps {
  onNavigateHome?: () => void;
}

export function Header({ onNavigateHome }: HeaderProps) {
  const {
    state,
    toggleTheme,
    setActiveFilters,
    createLabel,
    deleteLabel,
    getCurrentBoard,
  } = useKanban();
  const [showLabelDialog, setShowLabelDialog] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState<LabelColor>("blue");
  const [showFilterDialog, setShowFilterDialog] = useState(false);

  const currentBoard = getCurrentBoard();
  const labels = Object.values(state.labels);
  const activeFilters = state.settings.activeFilters;

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
              window.location.reload(); // Reload to apply imported data
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

  const handleCreateLabel = () => {
    if (newLabelName.trim()) {
      createLabel(newLabelName.trim(), newLabelColor);
      setNewLabelName("");
      setNewLabelColor("blue");
      toast({
        title: "Label created",
        description: `Label "${newLabelName}" has been created.`,
      });
    }
  };

  const handleDeleteLabel = (labelId: string, labelName: string) => {
    if (confirm(`Delete label "${labelName}"?`)) {
      deleteLabel(labelId);
      toast({
        title: "Label deleted",
        description: `Label "${labelName}" has been deleted.`,
      });
    }
  };

  const toggleFilter = (labelId: string) => {
    const newFilters = activeFilters.includes(labelId)
      ? activeFilters.filter((id) => id !== labelId)
      : [...activeFilters, labelId];
    setActiveFilters(newFilters);
  };

  const labelColors: LabelColor[] = [
    "red",
    "orange",
    "yellow",
    "green",
    "teal",
    "blue",
    "purple",
    "pink",
    "gray",
  ];

  return (
    <>
      <header className="bg-card border-b border-border px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onNavigateHome && (
              <Button variant="ghost" size="sm" onClick={onNavigateHome}>
                <Home className="w-5 h-5" />
              </Button>
            )}
            <h1 className="text-xl font-bold text-foreground">
              {currentBoard ? currentBoard.name : "Team-Ready Kanban"}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter */}
            <Button
              variant={activeFilters.length > 0 ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFilterDialog(true)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filter
              {activeFilters.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFilters.length}
                </Badge>
              )}
            </Button>

            {/* Settings dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowLabelDialog(true)}>
                  <Tag className="mr-2 h-4 w-4" />
                  Manage Labels
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExport}>
                  <Download className="mr-2 h-4 w-4" />
                  Export Data
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleImport}>
                  <Upload className="mr-2 h-4 w-4" />
                  Import Data
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme toggle */}
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

      {/* Label Management Dialog */}
      <Dialog open={showLabelDialog} onOpenChange={setShowLabelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Labels</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <UILabel>Create New Label</UILabel>
              <div className="flex gap-2">
                <Input
                  placeholder="Label name"
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateLabel()}
                />
                <select
                  value={newLabelColor}
                  onChange={(e) => setNewLabelColor(e.target.value as LabelColor)}
                  className="px-3 py-2 border border-input rounded-md bg-background"
                >
                  {labelColors.map((color) => (
                    <option key={color} value={color}>
                      {color}
                    </option>
                  ))}
                </select>
                <Button onClick={handleCreateLabel}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <UILabel>Existing Labels</UILabel>
              <div className="space-y-1">
                {labels.map((label) => (
                  <div
                    key={label.id}
                    className="flex items-center justify-between p-2 rounded hover:bg-muted"
                  >
                    <Badge className={`${getLabelColorClass(label.color)} text-white`}>
                      {label.name}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteLabel(label.id, label.name)}
                    >
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Filter Dialog */}
      <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filter by Labels</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {labels.map((label) => (
              <div
                key={label.id}
                className="flex items-center justify-between p-2 rounded hover:bg-muted cursor-pointer"
                onClick={() => toggleFilter(label.id)}
              >
                <Badge className={`${getLabelColorClass(label.color)} text-white`}>
                  {label.name}
                </Badge>
                {activeFilters.includes(label.id) && (
                  <span className="text-primary">✓</span>
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveFilters([])}>
              Clear All
            </Button>
            <Button onClick={() => setShowFilterDialog(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
