import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Workspace, Board } from '../../types';
import toast from 'react-hot-toast';

interface SidebarProps {
  onBoardSelect: (workspaceId: string, boardId: string) => void;
}

const Avatar = ({ name, size = 8 }: { name: string; size?: number }) => {
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  const colors = ['bg-indigo-500', 'bg-violet-500', 'bg-pink-500', 'bg-amber-500', 'bg-emerald-500'];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={`w-${size} h-${size} rounded-full ${color} flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`}>
      {initials}
    </div>
  );
};

export default function Sidebar({ onBoardSelect }: SidebarProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { workspaces, currentWorkspace, currentBoard, createWorkspace, createBoard, selectWorkspace } = useWorkspace();
  const [showNewWorkspace, setShowNewWorkspace] = useState(false);
  const [showNewBoard, setShowNewBoard] = useState(false);
  const [wsName, setWsName] = useState('');
  const [boardName, setBoardName] = useState('');

  const handleCreateWorkspace = async () => {
    if (!wsName.trim()) return;
    try {
      await createWorkspace({ name: wsName.trim() });
      setWsName('');
      setShowNewWorkspace(false);
    } catch {
      toast.error('Failed to create workspace');
    }
  };

  const handleCreateBoard = async () => {
    if (!boardName.trim() || !currentWorkspace) return;
    try {
      await createBoard(currentWorkspace.id, { name: boardName.trim() });
      setBoardName('');
      setShowNewBoard(false);
    } catch {
      toast.error('Failed to create board');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-[#1E2025] flex flex-col h-full border-r border-slate-700/50">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <span className="text-white font-bold text-lg">TaskFlow</span>
        </div>
      </div>

      {/* Workspace Switcher */}
      <div className="px-3 pt-4 pb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2">Workspaces</span>
          <button
            onClick={() => setShowNewWorkspace(!showNewWorkspace)}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-700 text-slate-400 hover:text-white transition"
            title="New Workspace"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {showNewWorkspace && (
          <div className="mb-2 flex gap-1">
            <input
              autoFocus
              value={wsName}
              onChange={(e) => setWsName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateWorkspace()}
              placeholder="Workspace name"
              className="flex-1 bg-slate-700 text-white text-sm rounded-lg px-3 py-1.5 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button onClick={handleCreateWorkspace} className="px-2 py-1.5 bg-indigo-500 text-white rounded-lg text-sm hover:bg-indigo-600 transition">
              Add
            </button>
          </div>
        )}

        <div className="space-y-0.5">
          {workspaces.map((ws: Workspace) => (
            <button
              key={ws.id}
              onClick={() => selectWorkspace(ws.id)}
              className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition ${
                currentWorkspace?.id === ws.id
                  ? 'bg-indigo-500/20 text-indigo-300'
                  : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
              }`}
            >
              <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                currentWorkspace?.id === ws.id ? 'bg-indigo-500 text-white' : 'bg-slate-600 text-slate-300'
              }`}>
                {ws.name[0].toUpperCase()}
              </div>
              <span className="truncate">{ws.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Boards */}
      {currentWorkspace && (
        <div className="px-3 pt-3 pb-2 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2">Boards</span>
            <button
              onClick={() => setShowNewBoard(!showNewBoard)}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-700 text-slate-400 hover:text-white transition"
              title="New Board"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {showNewBoard && (
            <div className="mb-2 flex gap-1">
              <input
                autoFocus
                value={boardName}
                onChange={(e) => setBoardName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateBoard()}
                placeholder="Board name"
                className="flex-1 bg-slate-700 text-white text-sm rounded-lg px-3 py-1.5 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button onClick={handleCreateBoard} className="px-2 py-1.5 bg-indigo-500 text-white rounded-lg text-sm hover:bg-indigo-600 transition">
                Add
              </button>
            </div>
          )}

          <div className="space-y-0.5">
            {currentWorkspace.boards?.map((board: Board) => (
              <button
                key={board.id}
                onClick={() => onBoardSelect(currentWorkspace.id, board.id)}
                className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition ${
                  currentBoard?.id === board.id
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                }`}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
                <span className="truncate">{board.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* User section */}
      <div className="mt-auto px-3 py-3 border-t border-slate-700/50">
        <div className="flex items-center gap-3 px-2 py-2">
          {user && <Avatar name={user.name} size={8} />}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-700 text-slate-400 hover:text-white transition"
            title="Sign out"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
