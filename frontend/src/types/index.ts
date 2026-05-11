export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  createdAt: string;
}

export interface WorkspaceMember {
  id: string;
  role: WorkspaceRole;
  joinedAt: string;
  userId: string;
  workspaceId: string;
  user: Pick<User, 'id' | 'name' | 'email' | 'avatar'>;
}

export interface Workspace {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  members: WorkspaceMember[];
  boards: Board[];
}

export interface Board {
  id: string;
  name: string;
  description: string | null;
  workspaceId: string;
  createdAt: string;
  columns?: Column[];
}

export interface Column {
  id: string;
  title: string;
  order: number;
  color: string;
  boardId: string;
  tasks: Task[];
}

export interface Attachment {
  id: string;
  filename: string;
  url: string;
  mimetype: string;
  size: number;
  createdAt: string;
  taskId: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
  taskId: string;
  userId: string;
  user: Pick<User, 'id' | 'name' | 'avatar'>;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: Priority;
  dueDate: string | null;
  labels: string[];
  order: number;
  columnId: string;
  assigneeId: string | null;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
  assignee: Pick<User, 'id' | 'name' | 'email' | 'avatar'> | null;
  creator: Pick<User, 'id' | 'name' | 'email' | 'avatar'>;
  attachments: Attachment[];
  activityLogs?: ActivityLog[];
}

export interface Notification {
  id: string;
  message: string;
  read: boolean;
  createdAt: string;
  userId: string;
  taskId: string | null;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}
