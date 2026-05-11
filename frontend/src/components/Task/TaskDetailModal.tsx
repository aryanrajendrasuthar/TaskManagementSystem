import { useState, useEffect, useRef } from 'react';
import { Task, Priority, WorkspaceMember } from '../../types';
import { taskApi } from '../../services/api';
import { formatDistanceToNow, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const PRIORITY_OPTIONS: { value: Priority; label: string; color: string }[] = [
  { value: 'LOW', label: 'Low', color: 'text-slate-600' },
  { value: 'MEDIUM', label: 'Medium', color: 'text-amber-600' },
  { value: 'HIGH', label: 'High', color: 'text-orange-600' },
  { value: 'URGENT', label: 'Urgent', color: 'text-red-600' },
];

interface TaskDetailModalProps {
  task: Task;
  workspaceMembers: WorkspaceMember[];
  onClose: () => void;
  onUpdated: (task: Task) => void;
}

export default function TaskDetailModal({ task, workspaceMembers, onClose, onUpdated }: TaskDetailModalProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [assigneeId, setAssigneeId] = useState<string>(task.assigneeId || '');
  const [dueDate, setDueDate] = useState(task.dueDate ? task.dueDate.slice(0, 10) : '');
  const [labelInput, setLabelInput] = useState('');
  const [labels, setLabels] = useState<string[]>(task.labels);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description || '');
    setPriority(task.priority);
    setAssigneeId(task.assigneeId || '');
    setDueDate(task.dueDate ? task.dueDate.slice(0, 10) : '');
    setLabels(task.labels);
  }, [task]);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const res = await taskApi.update(task.id, {
        title: title.trim(),
        description: description || null,
        priority,
        assigneeId: assigneeId || null,
        dueDate: dueDate || null,
        labels,
      });
      onUpdated(res.data);
      toast.success('Task updated');
    } catch {
      toast.error('Failed to update task');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this task? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await taskApi.delete(task.id);
      onClose();
      toast.success('Task deleted');
    } catch {
      toast.error('Failed to delete task');
    } finally {
      setDeleting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await taskApi.uploadAttachment(task.id, file);
      onUpdated(res.data);
      toast.success('File attached');
    } catch {
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const addLabel = () => {
    const trimmed = labelInput.trim();
    if (trimmed && !labels.includes(trimmed)) {
      setLabels([...labels, trimmed]);
    }
    setLabelInput('');
  };

  const removeLabel = (label: string) => {
    setLabels(labels.filter((l) => l !== label));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 px-4 pb-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start gap-3 px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex-1 min-w-0">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-lg font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 rounded-lg px-2 py-1 -mx-2 -my-1"
              placeholder="Task title"
            />
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex gap-0">
            {/* Main content */}
            <div className="flex-1 px-6 py-4 space-y-5 min-w-0">
              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Description</label>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <ReactQuill
                    value={description}
                    onChange={setDescription}
                    placeholder="Add a description..."
                    modules={{
                      toolbar: [
                        ['bold', 'italic', 'underline'],
                        [{ list: 'ordered' }, { list: 'bullet' }],
                        ['link'],
                        ['clean'],
                      ],
                    }}
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Labels */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Labels</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {labels.map((label) => (
                    <span
                      key={label}
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full font-medium"
                    >
                      {label}
                      <button onClick={() => removeLabel(label)} className="hover:text-indigo-900 leading-none">×</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={labelInput}
                    onChange={(e) => setLabelInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLabel(); } }}
                    placeholder="Add label..."
                    className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <button
                    onClick={addLabel}
                    className="px-3 py-1.5 bg-slate-100 text-slate-600 text-sm rounded-lg hover:bg-slate-200 transition"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Attachments */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Attachments ({task.attachments.length})
                </label>
                <div className="space-y-2">
                  {task.attachments.map((att) => (
                    <div key={att.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-slate-700 hover:text-indigo-600 truncate block"
                        >
                          {att.filename}
                        </a>
                        <p className="text-xs text-slate-400">{formatFileSize(att.size)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="mt-2 flex items-center gap-2 text-sm text-indigo-500 hover:text-indigo-600 disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {uploading ? 'Uploading...' : 'Attach file'}
                </button>
              </div>

              {/* Activity Log */}
              {task.activityLogs && task.activityLogs.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Activity</label>
                  <div className="space-y-3">
                    {task.activityLogs.map((log) => (
                      <div key={log.id} className="flex gap-3">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 text-xs font-semibold text-indigo-700">
                          {log.user.name[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-700">
                            <span className="font-medium">{log.user.name}</span>{' '}
                            <span className="text-slate-500">{log.action}</span>
                          </p>
                          {log.oldValue && log.newValue && (
                            <p className="text-xs text-slate-400 mt-0.5">
                              <span className="line-through">{log.oldValue}</span> → {log.newValue}
                            </p>
                          )}
                          <p className="text-xs text-slate-400 mt-0.5">
                            {formatDistanceToNow(parseISO(log.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar metadata */}
            <div className="w-56 flex-shrink-0 border-l border-slate-100 px-4 py-4 space-y-5">
              {/* Priority */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                >
                  {PRIORITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Assignee */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Assignee</label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                >
                  <option value="">Unassigned</option>
                  {workspaceMembers.map((m) => (
                    <option key={m.userId} value={m.userId}>{m.user.name}</option>
                  ))}
                </select>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              {/* Creator */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Created by</label>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-400 flex items-center justify-center text-white text-xs font-semibold">
                    {task.creator.name[0].toUpperCase()}
                  </div>
                  <span className="text-sm text-slate-600 truncate">{task.creator.name}</span>
                </div>
              </div>

              {/* Created at */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Created</label>
                <p className="text-sm text-slate-500">
                  {formatDistanceToNow(parseISO(task.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 disabled:opacity-50 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {deleting ? 'Deleting...' : 'Delete task'}
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !title.trim()}
              className="px-5 py-2 bg-indigo-500 text-white text-sm font-medium rounded-xl hover:bg-indigo-600 disabled:opacity-50 transition"
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
