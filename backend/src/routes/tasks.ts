import { Router } from 'express';
import { Server } from 'socket.io';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';
import {
  createTask,
  updateTask,
  moveTask,
  deleteTask,
  getTask,
  uploadAttachment,
  getNotifications,
  markNotificationsRead,
} from '../controllers/taskController';

const createTaskRouter = (io: Server) => {
  const router = Router({ mergeParams: true });

  router.post('/columns/:columnId/tasks', authenticate, createTask(io));
  router.get('/tasks/:taskId', authenticate, getTask);
  router.patch('/tasks/:taskId', authenticate, updateTask(io));
  router.patch('/tasks/:taskId/move', authenticate, moveTask(io));
  router.delete('/tasks/:taskId', authenticate, deleteTask(io));
  router.post('/tasks/:taskId/attachments', authenticate, upload.single('file'), uploadAttachment(io));

  router.get('/notifications', authenticate, getNotifications);
  router.patch('/notifications/read', authenticate, markNotificationsRead);

  return router;
};

export default createTaskRouter;
