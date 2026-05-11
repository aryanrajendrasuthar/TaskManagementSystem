import { useState } from 'react';
import { WorkspaceMember, WorkspaceRole } from '../../types';
import { workspaceApi } from '../../services/api';
import { useWorkspace } from '../../context/WorkspaceContext';
import toast from 'react-hot-toast';

const ROLE_BADGE: Record<WorkspaceRole, string> = {
  OWNER: 'bg-indigo-100 text-indigo-700',
  ADMIN: 'bg-violet-100 text-violet-700',
  MEMBER: 'bg-slate-100 text-slate-600',
};

interface TeamPanelProps {
  onClose: () => void;
}

export default function TeamPanel({ onClose }: TeamPanelProps) {
  const { currentWorkspace } = useWorkspace();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<WorkspaceRole>('MEMBER');
  const [inviting, setInviting] = useState(false);

  if (!currentWorkspace) return null;

  const members: WorkspaceMember[] = currentWorkspace.members || [];

  const handleInvite = async () => {
    if (!email.trim()) return;
    setInviting(true);
    try {
      await workspaceApi.invite(currentWorkspace.id, { email: email.trim(), role });
      setEmail('');
      toast.success('Invitation sent');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg || 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/30 backdrop-blur-sm">
      <div className="h-full w-full max-w-sm bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h2 className="font-semibold text-slate-800 text-base">Team</h2>
            <p className="text-xs text-slate-400 mt-0.5">{currentWorkspace.name}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Members list */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Members ({members.length})
          </p>
          <div className="space-y-3">
            {members.map((member) => {
              const initials = member.user.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);
              const avatarColors = ['bg-indigo-400', 'bg-violet-400', 'bg-pink-400', 'bg-amber-400', 'bg-emerald-400'];
              const color = avatarColors[member.user.name.charCodeAt(0) % avatarColors.length];

              return (
                <div key={member.id} className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center text-white text-sm font-semibold flex-shrink-0`}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{member.user.name}</p>
                    <p className="text-xs text-slate-400 truncate">{member.user.email}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${ROLE_BADGE[member.role]}`}>
                    {member.role.charAt(0) + member.role.slice(1).toLowerCase()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Invite section */}
        <div className="px-6 py-5 border-t border-slate-100 bg-slate-50/50">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Invite Member</p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
            placeholder="Email address"
            className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white mb-2"
          />
          <div className="flex gap-2">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as WorkspaceRole)}
              className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
            >
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </select>
            <button
              onClick={handleInvite}
              disabled={inviting || !email.trim()}
              className="px-4 py-2.5 bg-indigo-500 text-white text-sm font-medium rounded-xl hover:bg-indigo-600 disabled:opacity-50 transition"
            >
              {inviting ? '...' : 'Invite'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
