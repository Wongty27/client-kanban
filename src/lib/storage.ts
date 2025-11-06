import { AppState, Board, Column, Task, Label, LabelColor } from "@/types";

const STORAGE_KEY = "team-ready-kanban";

const DEFAULT_LABELS: Label[] = [
  { id: "label-1", name: "High Priority", color: "red" },
  { id: "label-2", name: "In Progress", color: "blue" },
  { id: "label-3", name: "Review", color: "yellow" },
  { id: "label-4", name: "Completed", color: "green" },
  { id: "label-5", name: "Bug", color: "orange" },
];

export function getInitialState(): AppState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Ensure settings exist
      if (!parsed.settings) {
        parsed.settings = {
          theme: "light",
          activeFilters: [],
          currentUser: undefined,
        };
      }
      // Ensure currentUser exists in settings
      if (parsed.settings && !parsed.settings.hasOwnProperty('currentUser')) {
        parsed.settings.currentUser = undefined;
      }
      return parsed;
    }
  } catch (error) {
    console.error("Failed to load state from localStorage:", error);
  }

  // Return default state with a sample board
  const sampleBoardId = "board-" + Date.now();
  const todoColId = "col-" + Date.now() + "-1";
  const inProgressColId = "col-" + Date.now() + "-2";
  const doneColId = "col-" + Date.now() + "-3";
  
  const sampleTaskId = "task-" + Date.now();

  const defaultState: AppState = {
    boards: {
      [sampleBoardId]: {
        id: sampleBoardId,
        name: "My First Board",
        columnIds: [todoColId, inProgressColId, doneColId],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    },
    columns: {
      [todoColId]: {
        id: todoColId,
        name: "To Do",
        taskIds: [sampleTaskId],
        order: 0,
      },
      [inProgressColId]: {
        id: inProgressColId,
        name: "In Progress",
        taskIds: [],
        order: 1,
      },
      [doneColId]: {
        id: doneColId,
        name: "Done",
        taskIds: [],
        order: 2,
      },
    },
    tasks: {
      [sampleTaskId]: {
        id: sampleTaskId,
        title: "Welcome to Team-Ready Kanban! 👋",
        description: "This is your first task. Click to edit, drag to move between columns, or create new tasks with the + button.",
        labels: ["label-1"],
        attachments: [],
        comments: [],
        columnId: todoColId,
        order: 0,
        createdAt: new Date().toISOString(),
      },
    },
    labels: DEFAULT_LABELS.reduce((acc, label) => {
      acc[label.id] = label;
      return acc;
    }, {} as Record<string, Label>),
    settings: {
      theme: "light",
      activeFilters: [],
      currentUser: undefined,
    },
    currentBoardId: sampleBoardId,
  };

  saveState(defaultState);
  return defaultState;
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Failed to save state to localStorage:", error);
  }
}

export function exportData(state: AppState): string {
  return JSON.stringify(state, null, 2);
}

export function importData(jsonString: string): AppState | null {
  try {
    const parsed = JSON.parse(jsonString);
    // Basic validation
    if (
      parsed.boards &&
      parsed.columns &&
      parsed.tasks &&
      parsed.labels &&
      parsed.settings
    ) {
      return parsed as AppState;
    }
  } catch (error) {
    console.error("Failed to import data:", error);
  }
  return null;
}

export function downloadJSON(data: string, filename: string): void {
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
