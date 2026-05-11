import { Response } from 'express';
import { Server } from 'socket.io';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { sendTaskAssignmentEmail } from '../services/emailService';

const taskInclude = {
  assignee: { select: { id: true, name: true, email: true, avatar: true } },
  creator: { select: { id: true, name: true, email: true, avatar: true } },
  attachments: true,
  activityLogs: {
    include: { user: { select: { id: true, name: true, avatar: true } } },
    orderBy: { createdAt: 'desc' as const },
    take: 20,
  },
};

const logActivity = async (
  taskId: string,
  userId: string,
  action: string,
  oldValue?: string,
  newValue?: string
) => {
  await prisma.activityLog.create({
    data: { taskId, userId, action, oldValue, newValue },
  });
};

export const createTask = (io: Server) => async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { columnId } = req.params;
    const { title, description, priority, dueDate, assigneeId, labels } = req.body;
    const userId = req.user!.id;

    const lastTask = await prisma.task.findFirst({
      where: { columnId },
      orderBy: { order: 'desc' },
    });

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : undefined,
        assigneeId: assigneeId || undefined,
        labels: labels || [],
        columnId,
        creatorId: userId,
        order: (lastTask?.order ?? -1) + 1,
      },
      include: taskInclude,
    });

    await logActivity(task.id, userId, 'created task');

    const column = await prisma.column.findUnique({
      where: { id: columnId },
      include: { board: { include: { workspace: true } } },
    });

    if (column) {
      io.to(`workspace:${column.board.workspaceId}`).emit('task:created', {
        task,
        columnId,
        boardId: column.boardId,
      });
    }

    if (assigneeId && assigneeId !== userId) {
      const assignee = await prisma.user.findUnique({ where: { id: assigneeId } });
      if (assignee) {
        await prisma.notification.create({
          data: {
            userId: assigneeId,
            taskId: task.id,
            message: `You were assigned to "${task.title}"`,
          },
        });
        io.to(`user:${assigneeId}`).emit('notification:new', {
          message: `You were assigned to "${task.title}"`,
          taskId: task.id,
        });
        await sendTaskAssignmentEmail(assignee.email, assignee.name, task.title).catch(() => {});
      }
    }

    res.status(201).json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create task' });
  }
};

export const updateTask = (io: Server) => async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;
    const userId = req.user!.id;
    const updates = req.body;

    const oldTask = await prisma.task.findUnique({ where: { id: taskId } });
    if (!oldTask) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(updates.title !== undefined && { title: updates.title }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.priority !== undefined && { priority: updates.priority }),
        ...(updates.dueDate !== undefined && { dueDate: updates.dueDate ? new Date(updates.dueDate) : null }),
        ...(updates.assigneeId !== undefined && { assigneeId: updates.assigneeId || null }),
        ...(updates.labels !== undefined && { labels: updates.labels }),
      },
      include: taskInclude,
    });

    const changes: string[] = [];
    if (updates.title && updates.title !== oldTask.title) {
      await logActivity(taskId, userId, 'updated title', oldTask.title, updates.title);
      changes.push('title');
    }
    if (updates.priority && updates.priority !== oldTask.priority) {
      await logActivity(taskId, userId, 'changed priority', oldTask.priority, updates.priority);
      changes.push('priority');
    }
    if (updates.assigneeId !== undefined && updates.assigneeId !== oldTask.assigneeId) {
      await logActivity(taskId, userId, 'changed assignee', oldTask.assigneeId || 'none', updates.assigneeId || 'none');

      if (updates.assigneeId && updates.assigneeId !== userId) {
        const assignee = await prisma.user.findUnique({ where: { id: updates.assigneeId } });
        if (assignee) {
          await prisma.notification.create({
            data: {
              userId: updates.assigneeId,
              taskId: task.id,
              message: `You were assigned to "${task.title}"`,
            },
          });
          io.to(`user:${updates.assigneeId}`).emit('notification:new', {
            message: `You were assigned to "${task.title}"`,
            taskId: task.id,
          });
          await sendTaskAssignmentEmail(assignee.email, assignee.name, task.title).catch(() => {});
        }
      }
    }

    const column = await prisma.column.findUnique({
      where: { id: task.columnId },
      include: { board: true },
    });

    if (column) {
      io.to(`workspace:${column.board.workspaceId}`).emit('task:updated', {
        task,
        columnId: task.columnId,
        boardId: column.boardId,
      });
    }

    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update task' });
  }
};

export const moveTask = (io: Server) => async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;
    const { columnId, order } = req.body;
    const userId = req.user!.id;

    const oldTask = await prisma.task.findUnique({ where: { id: taskId } });
    if (!oldTask) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: { columnId, order },
      include: taskInclude,
    });

    if (oldTask.columnId !== columnId) {
      const oldColumn = await prisma.column.findUnique({ where: { id: oldTask.columnId } });
      const newColumn = await prisma.column.findUnique({ where: { id: columnId } });
      await logActivity(
        taskId,
        userId,
        'moved task',
        oldColumn?.title,
        newColumn?.title
      );
    }

    const column = await prisma.column.findUnique({
      where: { id: columnId },
      include: { board: true },
    });

    if (column) {
      io.to(`workspace:${column.board.workspaceId}`).emit('task:moved', {
        task,
        oldColumnId: oldTask.columnId,
        newColumnId: columnId,
        boardId: column.boardId,
      });
    }

    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to move task' });
  }
};

export const deleteTask = (io: Server) => async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { column: { include: { board: true } } },
    });

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    await prisma.task.delete({ where: { id: taskId } });

    io.to(`workspace:${task.column.board.workspaceId}`).emit('task:deleted', {
      taskId,
      columnId: task.columnId,
      boardId: task.column.boardId,
    });

    res.json({ message: 'Task deleted' });
  } catch {
    res.status(500).json({ message: 'Failed to delete task' });
  }
};

export const getTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: taskInclude,
    });
    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }
    res.json(task);
  } catch {
    res.status(500).json({ message: 'Failed to fetch task' });
  }
};

export const uploadAttachment = (io: Server) => async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;
    const file = req.file;

    if (!file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    const attachment = await prisma.attachment.create({
      data: {
        taskId,
        filename: file.originalname,
        url: `/uploads/${file.filename}`,
        mimetype: file.mimetype,
        size: file.size,
      },
    });

    await logActivity(taskId, req.user!.id, 'added attachment', undefined, file.originalname);

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { column: { include: { board: true } } },
    });

    if (task) {
      io.to(`workspace:${task.column.board.workspaceId}`).emit('task:updated', {
        taskId,
        attachment,
      });
    }

    res.status(201).json(attachment);
  } catch {
    res.status(500).json({ message: 'Failed to upload attachment' });
  }
};

export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    res.json(notifications);
  } catch {
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
};

export const markNotificationsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, read: false },
      data: { read: true },
    });
    res.json({ message: 'Notifications marked as read' });
  } catch {
    res.status(500).json({ message: 'Failed to mark notifications' });
  }
};
