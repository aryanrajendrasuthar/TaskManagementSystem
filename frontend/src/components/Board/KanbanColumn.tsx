import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Column, Task } from '../../types';
import TaskCard from './TaskCard';
import toast from 'react-hot-toast';

interface KanbanColumnProps {
  column: Column;
  onTaskClick: (task: Task) => void;
  onTaskCreate: (columnId: string, title: string) => Promise<void>;
}

export default function KanbanColumn({ column, onTaskClick, onTaskCreate }: KanbanColumnProps) {
  const [showInput, setShowInput] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);

  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: 'column', columnId: column.id },
  });

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      await onTaskCreate(column.id, newTitle.trim());
      setNewTitle('');
      setShowInput(false);
    } catch {
      toast.error('Failed to create task');
    } finally {
      setAdding(false);
    }
  };

  const taskIds = column.tasks.map((t) => t.id);

  return (
    <div className="flex flex-col w-72 flex-shrink-0">
      {/* Column header */}
      <div className="flex items-center gap-2.5 mb-3 px-1">
        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: column.color }} />
        <h3 className="font-semibold text-slate-700 text-sm flex-1">{column.title}</h3>
        <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
          {column.tasks.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 rounded-xl p-2 min-h-[120px] transition-colors ${
          isOver ? 'bg-indigo-50/80 ring-2 ring-indigo-200' : 'bg-slate-50/80'
        }`}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-2.5">
            {column.tasks.map((task) => (
              <TaskCard key={task.id} task={task} onClick={onTaskClick} />
            ))}
          </div>
        </SortableContext>

        {/* Add task input */}
        {showInput ? (
          <div className="mt-2.5 space-y-2">
            <textarea
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAdd();
                }
                if (e.key === 'Escape') {
                  setShowInput(false);
                  setNewTitle('');
                }
              }}
              placeholder="Task title…"
              rows={2}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none shadow-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={adding || !newTitle.trim()}
                className="flex-1 bg-indigo-500 text-white text-sm rounded-lg py-1.5 font-medium hover:bg-indigo-600 disabled:opacity-50 transition"
              >
                {adding ? 'Adding…' : 'Add Task'}
              </button>
              <button
                onClick={() => { setShowInput(false); setNewTitle(''); }}
                className="px-3 text-slate-500 hover:text-slate-700 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowInput(true)}
            className="mt-2.5 w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add task
          </button>
        )}
      </div>
    </div>
  );
}
