import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { AppState, Board, Column, Task, Label, LabelColor } from "@/types";
import { getInitialState, saveState } from "@/lib/storage";

interface KanbanContextType {
  state: AppState;
  
  // Board actions
  createBoard: (name: string) => void;
  updateBoard: (id: string, updates: Partial<Board>) => void;
  deleteBoard: (id: string) => void;
  setCurrentBoard: (id: string) => void;
  
  // Column actions
  createColumn: (boardId: string, name: string) => void;
  updateColumn: (id: string, updates: Partial<Column>) => void;
  deleteColumn: (id: string) => void;
  reorderColumns: (boardId: string, columnIds: string[]) => void;
  
  // Task actions
  createTask: (columnId: string, title: string) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  moveTask: (taskId: string, toColumnId: string, newOrder: number) => void;
  
  // Label actions
  createLabel: (name: string, color: LabelColor) => void;
  updateLabel: (id: string, updates: Partial<Label>) => void;
  deleteLabel: (id: string) => void;
  
  // Settings
  toggleTheme: () => void;
  setActiveFilters: (filters: string[]) => void;
  setCurrentUser: (userName: string | undefined) => void;
  
  // Utility
  getCurrentBoard: () => Board | null;
}

const KanbanContext = createContext<KanbanContextType | undefined>(undefined);

export function KanbanProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(getInitialState);

  // Save to localStorage whenever state changes
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Apply theme
  useEffect(() => {
    if (state.settings.theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [state.settings.theme]);

  // Board actions
  const createBoard = useCallback((name: string) => {
    const id = "board-" + Date.now();
    const newBoard: Board = {
      id,
      name,
      columnIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    setState((prev) => ({
      ...prev,
      boards: { ...prev.boards, [id]: newBoard },
      currentBoardId: id,
    }));
  }, []);

  const updateBoard = useCallback((id: string, updates: Partial<Board>) => {
    setState((prev) => ({
      ...prev,
      boards: {
        ...prev.boards,
        [id]: { ...prev.boards[id], ...updates, updatedAt: new Date().toISOString() },
      },
    }));
  }, []);

  const deleteBoard = useCallback((id: string) => {
    setState((prev) => {
      const newBoards = { ...prev.boards };
      const board = newBoards[id];
      delete newBoards[id];

      // Delete associated columns and tasks
      const newColumns = { ...prev.columns };
      const newTasks = { ...prev.tasks };
      
      board.columnIds.forEach((colId) => {
        const column = newColumns[colId];
        column.taskIds.forEach((taskId) => {
          delete newTasks[taskId];
        });
        delete newColumns[colId];
      });

      // Set new current board
      const remainingBoardIds = Object.keys(newBoards);
      const newCurrentBoardId = remainingBoardIds.length > 0 ? remainingBoardIds[0] : null;

      return {
        ...prev,
        boards: newBoards,
        columns: newColumns,
        tasks: newTasks,
        currentBoardId: newCurrentBoardId,
      };
    });
  }, []);

  const setCurrentBoard = useCallback((id: string) => {
    setState((prev) => ({ ...prev, currentBoardId: id }));
  }, []);

  // Column actions
  const createColumn = useCallback((boardId: string, name: string) => {
    const id = "col-" + Date.now();
    const board = state.boards[boardId];
    const order = board.columnIds.length;
    
    const newColumn: Column = {
      id,
      name,
      taskIds: [],
      order,
    };

    setState((prev) => ({
      ...prev,
      columns: { ...prev.columns, [id]: newColumn },
      boards: {
        ...prev.boards,
        [boardId]: {
          ...prev.boards[boardId],
          columnIds: [...prev.boards[boardId].columnIds, id],
          updatedAt: new Date().toISOString(),
        },
      },
    }));
  }, [state.boards]);

  const updateColumn = useCallback((id: string, updates: Partial<Column>) => {
    setState((prev) => ({
      ...prev,
      columns: {
        ...prev.columns,
        [id]: { ...prev.columns[id], ...updates },
      },
    }));
  }, []);

  const deleteColumn = useCallback((id: string) => {
    setState((prev) => {
      const column = prev.columns[id];
      const newColumns = { ...prev.columns };
      delete newColumns[id];

      // Delete tasks in this column
      const newTasks = { ...prev.tasks };
      column.taskIds.forEach((taskId) => {
        delete newTasks[taskId];
      });

      // Remove from board
      const newBoards = { ...prev.boards };
      Object.keys(newBoards).forEach((boardId) => {
        const board = newBoards[boardId];
        if (board.columnIds.includes(id)) {
          newBoards[boardId] = {
            ...board,
            columnIds: board.columnIds.filter((colId) => colId !== id),
            updatedAt: new Date().toISOString(),
          };
        }
      });

      return {
        ...prev,
        boards: newBoards,
        columns: newColumns,
        tasks: newTasks,
      };
    });
  }, []);

  const reorderColumns = useCallback((boardId: string, columnIds: string[]) => {
    setState((prev) => ({
      ...prev,
      boards: {
        ...prev.boards,
        [boardId]: {
          ...prev.boards[boardId],
          columnIds,
          updatedAt: new Date().toISOString(),
        },
      },
    }));
  }, []);

  // Task actions
  const createTask = useCallback((columnId: string, title: string) => {
    const id = "task-" + Date.now();
    const column = state.columns[columnId];
    const order = column.taskIds.length;
    
    const newTask: Task = {
      id,
      title,
      labels: [],
      attachments: [],
      comments: [],
      columnId,
      order,
      createdAt: new Date().toISOString(),
      createdBy: state.settings.currentUser,
      assignedTo: state.settings.currentUser,
    };

    setState((prev) => ({
      ...prev,
      tasks: { ...prev.tasks, [id]: newTask },
      columns: {
        ...prev.columns,
        [columnId]: {
          ...prev.columns[columnId],
          taskIds: [...prev.columns[columnId].taskIds, id],
        },
      },
    }));
  }, [state.columns, state.settings.currentUser]);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setState((prev) => ({
      ...prev,
      tasks: {
        ...prev.tasks,
        [id]: { ...prev.tasks[id], ...updates },
      },
    }));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setState((prev) => {
      const task = prev.tasks[id];
      const newTasks = { ...prev.tasks };
      delete newTasks[id];

      // Remove from column
      const newColumns = { ...prev.columns };
      const column = newColumns[task.columnId];
      newColumns[task.columnId] = {
        ...column,
        taskIds: column.taskIds.filter((taskId) => taskId !== id),
      };

      return {
        ...prev,
        tasks: newTasks,
        columns: newColumns,
      };
    });
  }, []);

  const moveTask = useCallback((taskId: string, toColumnId: string, newOrder: number) => {
    setState((prev) => {
      const task = prev.tasks[taskId];
      const fromColumnId = task.columnId;
      
      const newColumns = { ...prev.columns };
      const fromColumn = newColumns[fromColumnId];
      const toColumn = newColumns[toColumnId];

      // Remove from old column
      const newFromTaskIds = fromColumn.taskIds.filter((id) => id !== taskId);
      
      // Add to new column at specified position
      const newToTaskIds = [...toColumn.taskIds];
      if (fromColumnId === toColumnId) {
        // Reordering within same column
        const oldIndex = toColumn.taskIds.indexOf(taskId);
        newToTaskIds.splice(oldIndex, 1);
      }
      newToTaskIds.splice(newOrder, 0, taskId);

      newColumns[fromColumnId] = { ...fromColumn, taskIds: newFromTaskIds };
      newColumns[toColumnId] = { ...toColumn, taskIds: newToTaskIds };

      return {
        ...prev,
        tasks: {
          ...prev.tasks,
          [taskId]: { ...task, columnId: toColumnId, order: newOrder },
        },
        columns: newColumns,
      };
    });
  }, []);

  // Label actions
  const createLabel = useCallback((name: string, color: LabelColor) => {
    const id = "label-" + Date.now();
    const newLabel: Label = { id, name, color };
    
    setState((prev) => ({
      ...prev,
      labels: { ...prev.labels, [id]: newLabel },
    }));
  }, []);

  const updateLabel = useCallback((id: string, updates: Partial<Label>) => {
    setState((prev) => ({
      ...prev,
      labels: {
        ...prev.labels,
        [id]: { ...prev.labels[id], ...updates },
      },
    }));
  }, []);

  const deleteLabel = useCallback((id: string) => {
    setState((prev) => {
      const newLabels = { ...prev.labels };
      delete newLabels[id];

      // Remove label from all tasks
      const newTasks = { ...prev.tasks };
      Object.keys(newTasks).forEach((taskId) => {
        const task = newTasks[taskId];
        newTasks[taskId] = {
          ...task,
          labels: task.labels.filter((labelId) => labelId !== id),
        };
      });

      // Remove from active filters
      const newActiveFilters = prev.settings.activeFilters.filter(
        (filterId) => filterId !== id
      );

      return {
        ...prev,
        labels: newLabels,
        tasks: newTasks,
        settings: { ...prev.settings, activeFilters: newActiveFilters },
      };
    });
  }, []);

  // Settings
  const toggleTheme = useCallback(() => {
    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        theme: prev.settings.theme === "light" ? "dark" : "light",
      },
    }));
  }, []);

  const setActiveFilters = useCallback((filters: string[]) => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, activeFilters: filters },
    }));
  }, []);

  const setCurrentUser = useCallback((userName: string | undefined) => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, currentUser: userName },
    }));
  }, []);

  // Utility
  const getCurrentBoard = useCallback(() => {
    if (!state.currentBoardId) return null;
    return state.boards[state.currentBoardId] || null;
  }, [state.currentBoardId, state.boards]);

  const value: KanbanContextType = {
    state,
    createBoard,
    updateBoard,
    deleteBoard,
    setCurrentBoard,
    createColumn,
    updateColumn,
    deleteColumn,
    reorderColumns,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    createLabel,
    updateLabel,
    deleteLabel,
    toggleTheme,
    setActiveFilters,
    setCurrentUser,
    getCurrentBoard,
  };

  return (
    <KanbanContext.Provider value={value}>{children}</KanbanContext.Provider>
  );
}

export function useKanban() {
  const context = useContext(KanbanContext);
  if (!context) {
    throw new Error("useKanban must be used within KanbanProvider");
  }
  return context;
}
