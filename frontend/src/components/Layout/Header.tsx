import { useState, useEffect } from 'react';
import { notificationApi } from '../../services/api';
import { Notification } from '../../types';
import { useWorkspace } from '../../context/WorkspaceContext';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

interface HeaderProps {
  onTeamClick: () => void;
}

export default function Header({ onTeamClick }: HeaderProps) {
  const { currentWorkspace, currentBoard } = useWorkspace();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotif, setShowNotif] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    notificationApi.list().then((res) => setNotifications(res.data)).catch(() => {});
  }, []);

  const handleMarkRead = async () => {
    try {
      await notificationApi.markRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      toast.error('Failed to mark notifications read');
    }
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center px-6 gap-4 flex-shrink-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {currentWorkspace && (
          <>
            <span className="text-slate-500 text-sm font-medium truncate">{currentWorkspace.name}</span>
            {currentBoard && (
              <>
                <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-slate-900 text-sm font-semibold truncate">{currentBoard.name}</span>
              </>
            )}
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Team button */}
        {currentWorkspace && (
          <button
            onClick={onTeamClick}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Team
          </button>
        )}

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotif(!showNotif)}
            className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotif && (
            <div className="absolute right-0 top-11 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <h3 className="font-semibold text-slate-800">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={handleMarkRead} className="text-xs text-indigo-500 hover:text-indigo-600">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-8">No notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`px-4 py-3 border-b border-slate-50 last:border-0 ${!n.read ? 'bg-indigo-50/50' : ''}`}
                    >
                      <p className="text-sm text-slate-700">{n.message}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
