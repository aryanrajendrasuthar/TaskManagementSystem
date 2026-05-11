import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, Priority } from '../../types';
import { formatDistanceToNow, isPast, parseISO } from 'date-fns';

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; dot: string }> = {
  LOW: { label: 'Low', color: 'text-slate-500 bg-slate-100', dot: 'bg-slate-400' },
  MEDIUM: { label: 'Medium', color: 'text-amber-600 bg-amber-50', dot: 'bg-amber-400' },
  HIGH: { label: 'High', color: 'text-orange-600 bg-orange-50', dot: 'bg-orange-500' },
  URGENT: { label: 'Urgent', color: 'text-red-600 bg-red-50', dot: 'bg-red-500' },
};

const LABEL_COLORS = [
  'bg-indigo-100 text-indigo-700',
  'bg-violet-100 text-violet-700',
  'bg-pink-100 text-pink-700',
  'bg-emerald-100 text-emerald-700',
  'bg-cyan-100 text-cyan-700',
  'bg-amber-100 text-amber-700',
];

interface TaskCardProps {
  task: Task;
  onClick: (task: Task) => void;
  isDragOverlay?: boolean;
}

const Avatar = ({ name }: { name: string }) => {
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  const colors = ['bg-indigo-400', 'bg-violet-400', 'bg-pink-400', 'bg-amber-400', 'bg-emerald-400'];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={`w-6 h-6 rounded-full ${color} flex items-center justify-center text-white text-xs font-semibold`}>
      {initials}
    </div>
  );
};

export default function TaskCard({ task, onClick, isDragOverlay = false }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priority = PRIORITY_CONFIG[task.priority];
  const isOverdue = task.dueDate && isPast(parseISO(task.dueDate));

  if (isDragging && !isDragOverlay) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="h-24 bg-indigo-50 border-2 border-indigo-200 border-dashed rounded-xl"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(task)}
      className={`bg-white border border-slate-200 rounded-xl p-3.5 cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all select-none group ${
        isDragOverlay ? 'shadow-lg rotate-2 border-indigo-300' : ''
      }`}
    >
      {/* Labels */}
      {task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.labels.slice(0, 3).map((label, i) => (
            <span
              key={label}
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${LABEL_COLORS[i % LABEL_COLORS.length]}`}
            >
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Title */}
      <p className="text-sm font-medium text-slate-800 leading-snug mb-2">{task.title}</p>

      {/* Priority */}
      <div className="flex items-center gap-1.5 mb-2">
        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${priority.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
          {priority.label}
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          {/* Attachments count */}
          {task.attachments.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              {task.attachments.length}
            </span>
          )}

          {/* Due date */}
          {task.dueDate && (
            <span className={`text-xs flex items-center gap-1 ${isOverdue ? 'text-red-500' : 'text-slate-400'}`}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatDistanceToNow(parseISO(task.dueDate), { addSuffix: true })}
            </span>
          )}
        </div>

        {/* Assignee */}
        {task.assignee && <Avatar name={task.assignee.name} />}
      </div>
    </div>
  );
}
