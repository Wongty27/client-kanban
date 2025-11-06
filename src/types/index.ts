export type LabelColor = 
  | "red" 
  | "orange" 
  | "yellow" 
  | "green" 
  | "teal" 
  | "blue" 
  | "purple" 
  | "pink" 
  | "gray";

export interface Label {
  id: string;
  name: string;
  color: LabelColor;
}

export interface Comment {
  id: string;
  text: string;
  createdAt: string;
}

export interface Attachment {
  id: string;
  name: string;
  data: string; // base64 or URL
  type: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  labels: string[]; // label IDs
  attachments: Attachment[];
  comments: Comment[];
  columnId: string;
  order: number;
}

export interface Column {
  id: string;
  name: string;
  taskIds: string[];
  order: number;
}

export interface Board {
  id: string;
  name: string;
  columnIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AppState {
  boards: Record<string, Board>;
  columns: Record<string, Column>;
  tasks: Record<string, Task>;
  labels: Record<string, Label>;
  settings: {
    theme: "light" | "dark";
    activeFilters: string[]; // label IDs
  };
  currentBoardId: string | null;
}
