import { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  closestCorners,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Task } from '../../types';
import { taskApi } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';
import TaskDetailModal from '../Task/TaskDetailModal';
import toast from 'react-hot-toast';

export default function KanbanBoard() {
  const { currentBoard, currentWorkspace, applyTaskCreated, applyTaskUpdated, applyTaskMoved, applyTaskDeleted, moveTaskOptimistic } = useWorkspace();
  const socket = useSocket();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Socket.io real-time events
  useEffect(() => {
    if (!socket || !currentWorkspace) return;
    socket.emit('workspace:join', currentWorkspace.id);

    socket.on('task:created', ({ task, columnId }: { task: Task; columnId: string }) => {
      applyTaskCreated(task, columnId);
    });

    socket.on('task:updated', ({ task }: { task: Task }) => {
      applyTaskUpdated(task);
      if (selectedTask?.id === task.id) setSelectedTask(task);
    });

    socket.on('task:moved', ({ task, oldColumnId, newColumnId }: { task: Task; oldColumnId: string; newColumnId: string }) => {
      applyTaskMoved(task.id, oldColumnId, newColumnId, task);
    });

    socket.on('task:deleted', ({ taskId, columnId }: { taskId: string; columnId: string }) => {
      applyTaskDeleted(taskId, columnId);
      if (selectedTask?.id === taskId) setSelectedTask(null);
    });

    return () => {
      socket.off('task:created');
      socket.off('task:updated');
      socket.off('task:moved');
      socket.off('task:deleted');
    };
  }, [socket, currentWorkspace, applyTaskCreated, applyTaskUpdated, applyTaskMoved, applyTaskDeleted, selectedTask]);

  const handleTaskCreate = useCallback(async (columnId: string, title: string) => {
    await taskApi.create(columnId, { title });
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === 'task') {
      setActiveTask(event.active.data.current.task as Task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || !currentBoard) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeColumn = currentBoard.columns.find((col) =>
      col.tasks.some((t) => t.id === activeId)
    );
    const overColumn =
      currentBoard.columns.find((col) => col.id === overId) ||
      currentBoard.columns.find((col) => col.tasks.some((t) => t.id === overId));

    if (!activeColumn || !overColumn || activeColumn.id === overColumn.id) return;

    const overTaskIndex = overColumn.tasks.findIndex((t) => t.id === overId);
    const newOrder = overTaskIndex >= 0 ? overTaskIndex : overColumn.tasks.length;

    moveTaskOptimistic(activeId, activeColumn.id, overColumn.id, newOrder);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over || !currentBoard) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeColumn = currentBoard.columns.find((col) =>
      col.tasks.some((t) => t.id === activeId)
    );
    if (!activeColumn) return;

    const targetColumn =
      currentBoard.columns.find((col) => col.id === overId) ||
      currentBoard.columns.find((col) => col.tasks.some((t) => t.id === overId));

    if (!targetColumn) return;

    let newOrder: number;
    if (activeColumn.id === targetColumn.id) {
      const oldIndex = activeColumn.tasks.findIndex((t) => t.id === activeId);
      const newIndex = activeColumn.tasks.findIndex((t) => t.id === overId);
      if (oldIndex === newIndex) return;
      const reordered = arrayMove(activeColumn.tasks, oldIndex, newIndex);
      newOrder = reordered.findIndex((t) => t.id === activeId);
    } else {
      const overIndex = targetColumn.tasks.findIndex((t) => t.id === overId);
      newOrder = overIndex >= 0 ? overIndex : targetColumn.tasks.length;
    }

    try {
      await taskApi.move(activeId, { columnId: targetColumn.id, order: newOrder });
    } catch {
      toast.error('Failed to move task');
    }
  };

  if (!currentBoard) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
          </svg>
          <p className="text-slate-500 font-medium">Select a board to get started</p>
          <p className="text-slate-400 text-sm mt-1">Or create a new board from the sidebar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
      <div className="flex-1 overflow-x-auto p-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-5 h-full items-start">
            {currentBoard.columns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                onTaskClick={setSelectedTask}
                onTaskCreate={handleTaskCreate}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask && <TaskCard task={activeTask} onClick={() => {}} isDragOverlay />}
          </DragOverlay>
        </DndContext>
      </div>

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          workspaceMembers={currentWorkspace?.members || []}
          onClose={() => setSelectedTask(null)}
          onUpdated={(updatedTask) => setSelectedTask(updatedTask)}
        />
      )}
    </div>
  );
}
