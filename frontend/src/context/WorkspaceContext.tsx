import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Workspace, Board, Column, Task } from '../types';
import { workspaceApi, boardApi, taskApi } from '../services/api';
import toast from 'react-hot-toast';

interface WorkspaceContextType {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  currentBoard: Board & { columns: Column[] } | null;
  isLoadingWorkspaces: boolean;
  isLoadingBoard: boolean;
  fetchWorkspaces: () => Promise<void>;
  selectWorkspace: (id: string) => Promise<void>;
  selectBoard: (workspaceId: string, boardId: string) => Promise<void>;
  createWorkspace: (data: { name: string; description?: string }) => Promise<void>;
  createBoard: (workspaceId: string, data: { name: string; description?: string }) => Promise<void>;
  applyTaskCreated: (task: Task, columnId: string) => void;
  applyTaskUpdated: (task: Task) => void;
  applyTaskMoved: (taskId: string, oldColumnId: string, newColumnId: string, updatedTask: Task) => void;
  applyTaskDeleted: (taskId: string, columnId: string) => void;
  moveTaskOptimistic: (taskId: string, fromColumnId: string, toColumnId: string, newOrder: number) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

export const WorkspaceProvider = ({ children }: { children: ReactNode }) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [currentBoard, setCurrentBoard] = useState<(Board & { columns: Column[] }) | null>(null);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(false);
  const [isLoadingBoard, setIsLoadingBoard] = useState(false);

  const fetchWorkspaces = useCallback(async () => {
    setIsLoadingWorkspaces(true);
    try {
      const res = await workspaceApi.list();
      setWorkspaces(res.data);
    } catch {
      toast.error('Failed to load workspaces');
    } finally {
      setIsLoadingWorkspaces(false);
    }
  }, []);

  const selectWorkspace = useCallback(async (id: string) => {
    try {
      const res = await workspaceApi.get(id);
      setCurrentWorkspace(res.data);
    } catch {
      toast.error('Failed to load workspace');
    }
  }, []);

  const selectBoard = useCallback(async (workspaceId: string, boardId: string) => {
    setIsLoadingBoard(true);
    try {
      const res = await boardApi.get(workspaceId, boardId);
      setCurrentBoard(res.data);
    } catch {
      toast.error('Failed to load board');
    } finally {
      setIsLoadingBoard(false);
    }
  }, []);

  const createWorkspace = useCallback(async (data: { name: string; description?: string }) => {
    const res = await workspaceApi.create(data);
    setWorkspaces((prev) => [...prev, res.data]);
    setCurrentWorkspace(res.data);
    toast.success('Workspace created');
  }, []);

  const createBoard = useCallback(async (workspaceId: string, data: { name: string; description?: string }) => {
    const res = await boardApi.create(workspaceId, data);
    setCurrentWorkspace((ws) =>
      ws ? { ...ws, boards: [...(ws.boards || []), res.data] } : ws
    );
    setCurrentBoard(res.data);
    toast.success('Board created');
  }, []);

  const applyTaskCreated = useCallback((task: Task, columnId: string) => {
    setCurrentBoard((board) => {
      if (!board) return board;
      return {
        ...board,
        columns: board.columns.map((col) =>
          col.id === columnId
            ? { ...col, tasks: [...col.tasks, task] }
            : col
        ),
      };
    });
  }, []);

  const applyTaskUpdated = useCallback((task: Task) => {
    setCurrentBoard((board) => {
      if (!board) return board;
      return {
        ...board,
        columns: board.columns.map((col) =>
          col.id === task.columnId
            ? { ...col, tasks: col.tasks.map((t) => (t.id === task.id ? task : t)) }
            : col
        ),
      };
    });
  }, []);

  const applyTaskMoved = useCallback(
    (taskId: string, oldColumnId: string, newColumnId: string, updatedTask: Task) => {
      setCurrentBoard((board) => {
        if (!board) return board;
        return {
          ...board,
          columns: board.columns.map((col) => {
            if (col.id === oldColumnId) {
              return { ...col, tasks: col.tasks.filter((t) => t.id !== taskId) };
            }
            if (col.id === newColumnId) {
              const exists = col.tasks.some((t) => t.id === taskId);
              return {
                ...col,
                tasks: exists
                  ? col.tasks.map((t) => (t.id === taskId ? updatedTask : t))
                  : [...col.tasks, updatedTask].sort((a, b) => a.order - b.order),
              };
            }
            return col;
          }),
        };
      });
    },
    []
  );

  const applyTaskDeleted = useCallback((taskId: string, columnId: string) => {
    setCurrentBoard((board) => {
      if (!board) return board;
      return {
        ...board,
        columns: board.columns.map((col) =>
          col.id === columnId
            ? { ...col, tasks: col.tasks.filter((t) => t.id !== taskId) }
            : col
        ),
      };
    });
  }, []);

  const moveTaskOptimistic = useCallback(
    (taskId: string, fromColumnId: string, toColumnId: string, newOrder: number) => {
      setCurrentBoard((board) => {
        if (!board) return board;
        let movedTask: Task | undefined;
        const updatedCols = board.columns.map((col) => {
          if (col.id === fromColumnId) {
            movedTask = col.tasks.find((t) => t.id === taskId);
            return { ...col, tasks: col.tasks.filter((t) => t.id !== taskId) };
          }
          return col;
        });
        if (!movedTask) return board;
        const finalTask = { ...movedTask, columnId: toColumnId, order: newOrder };
        return {
          ...board,
          columns: updatedCols.map((col) => {
            if (col.id === toColumnId) {
              const tasks = [...col.tasks, finalTask].sort((a, b) => a.order - b.order);
              return { ...col, tasks };
            }
            return col;
          }),
        };
      });
    },
    []
  );

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        currentWorkspace,
        currentBoard,
        isLoadingWorkspaces,
        isLoadingBoard,
        fetchWorkspaces,
        selectWorkspace,
        selectBoard,
        createWorkspace,
        createBoard,
        applyTaskCreated,
        applyTaskUpdated,
        applyTaskMoved,
        applyTaskDeleted,
        moveTaskOptimistic,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return ctx;
};
