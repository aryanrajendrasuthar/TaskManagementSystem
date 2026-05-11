import { useState, useCallback } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import Sidebar from '../components/Layout/Sidebar';
import Header from '../components/Layout/Header';
import KanbanBoard from '../components/Board/KanbanBoard';
import TeamPanel from '../components/Workspace/TeamPanel';

export default function DashboardPage() {
  const { selectBoard } = useWorkspace();
  const [showTeam, setShowTeam] = useState(false);

  const handleBoardSelect = useCallback(
    (workspaceId: string, boardId: string) => {
      selectBoard(workspaceId, boardId);
    },
    [selectBoard]
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar onBoardSelect={handleBoardSelect} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onTeamClick={() => setShowTeam(true)} />
        <KanbanBoard />
      </div>

      {showTeam && <TeamPanel onClose={() => setShowTeam(false)} />}
    </div>
  );
}
