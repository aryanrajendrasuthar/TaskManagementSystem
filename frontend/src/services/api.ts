import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

// Workspaces
export const workspaceApi = {
  list: () => api.get('/workspaces'),
  create: (data: { name: string; description?: string }) => api.post('/workspaces', data),
  get: (id: string) => api.get(`/workspaces/${id}`),
  invite: (workspaceId: string, data: { email: string; role?: string }) =>
    api.post(`/workspaces/${workspaceId}/members`, data),
  removeMember: (workspaceId: string, memberId: string) =>
    api.delete(`/workspaces/${workspaceId}/members/${memberId}`),
  updateRole: (workspaceId: string, memberId: string, role: string) =>
    api.patch(`/workspaces/${workspaceId}/members/${memberId}/role`, { role }),
};

// Boards
export const boardApi = {
  list: (workspaceId: string) => api.get(`/workspaces/${workspaceId}/boards`),
  create: (workspaceId: string, data: { name: string; description?: string }) =>
    api.post(`/workspaces/${workspaceId}/boards`, data),
  get: (workspaceId: string, boardId: string) =>
    api.get(`/workspaces/${workspaceId}/boards/${boardId}`),
  update: (workspaceId: string, boardId: string, data: { name?: string; description?: string }) =>
    api.patch(`/workspaces/${workspaceId}/boards/${boardId}`, data),
  delete: (workspaceId: string, boardId: string) =>
    api.delete(`/workspaces/${workspaceId}/boards/${boardId}`),
  createColumn: (workspaceId: string, boardId: string, data: { title: string; color?: string }) =>
    api.post(`/workspaces/${workspaceId}/boards/${boardId}/columns`, data),
  updateColumn: (workspaceId: string, boardId: string, columnId: string, data: { title?: string; color?: string }) =>
    api.patch(`/workspaces/${workspaceId}/boards/${boardId}/columns/${columnId}`, data),
  deleteColumn: (workspaceId: string, boardId: string, columnId: string) =>
    api.delete(`/workspaces/${workspaceId}/boards/${boardId}/columns/${columnId}`),
};

// Tasks
export const taskApi = {
  create: (columnId: string, data: Partial<{
    title: string; description: string; priority: string;
    dueDate: string; assigneeId: string; labels: string[];
  }>) => api.post(`/columns/${columnId}/tasks`, data),
  get: (taskId: string) => api.get(`/tasks/${taskId}`),
  update: (taskId: string, data: object) => api.patch(`/tasks/${taskId}`, data),
  move: (taskId: string, data: { columnId: string; order: number }) =>
    api.patch(`/tasks/${taskId}/move`, data),
  delete: (taskId: string) => api.delete(`/tasks/${taskId}`),
  uploadAttachment: (taskId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/tasks/${taskId}/attachments`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Notifications
export const notificationApi = {
  list: () => api.get('/notifications'),
  markRead: () => api.patch('/notifications/read'),
};

export default api;
