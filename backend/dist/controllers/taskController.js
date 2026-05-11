"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markNotificationsRead = exports.getNotifications = exports.uploadAttachment = exports.getTask = exports.deleteTask = exports.moveTask = exports.updateTask = exports.createTask = void 0;
const prisma_1 = require("../lib/prisma");
const emailService_1 = require("../services/emailService");
const taskInclude = {
    assignee: { select: { id: true, name: true, email: true, avatar: true } },
    creator: { select: { id: true, name: true, email: true, avatar: true } },
    attachments: true,
    activityLogs: {
        include: { user: { select: { id: true, name: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
    },
};
const logActivity = async (taskId, userId, action, oldValue, newValue) => {
    await prisma_1.prisma.activityLog.create({
        data: { taskId, userId, action, oldValue, newValue },
    });
};
const createTask = (io) => async (req, res) => {
    try {
        const { columnId } = req.params;
        const { title, description, priority, dueDate, assigneeId, labels } = req.body;
        const userId = req.user.id;
        const lastTask = await prisma_1.prisma.task.findFirst({
            where: { columnId },
            orderBy: { order: 'desc' },
        });
        const task = await prisma_1.prisma.task.create({
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
        const column = await prisma_1.prisma.column.findUnique({
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
            const assignee = await prisma_1.prisma.user.findUnique({ where: { id: assigneeId } });
            if (assignee) {
                await prisma_1.prisma.notification.create({
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
                await (0, emailService_1.sendTaskAssignmentEmail)(assignee.email, assignee.name, task.title).catch(() => { });
            }
        }
        res.status(201).json(task);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to create task' });
    }
};
exports.createTask = createTask;
const updateTask = (io) => async (req, res) => {
    try {
        const { taskId } = req.params;
        const userId = req.user.id;
        const updates = req.body;
        const oldTask = await prisma_1.prisma.task.findUnique({ where: { id: taskId } });
        if (!oldTask) {
            res.status(404).json({ message: 'Task not found' });
            return;
        }
        const task = await prisma_1.prisma.task.update({
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
        const changes = [];
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
                const assignee = await prisma_1.prisma.user.findUnique({ where: { id: updates.assigneeId } });
                if (assignee) {
                    await prisma_1.prisma.notification.create({
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
                    await (0, emailService_1.sendTaskAssignmentEmail)(assignee.email, assignee.name, task.title).catch(() => { });
                }
            }
        }
        const column = await prisma_1.prisma.column.findUnique({
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
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to update task' });
    }
};
exports.updateTask = updateTask;
const moveTask = (io) => async (req, res) => {
    try {
        const { taskId } = req.params;
        const { columnId, order } = req.body;
        const userId = req.user.id;
        const oldTask = await prisma_1.prisma.task.findUnique({ where: { id: taskId } });
        if (!oldTask) {
            res.status(404).json({ message: 'Task not found' });
            return;
        }
        const task = await prisma_1.prisma.task.update({
            where: { id: taskId },
            data: { columnId, order },
            include: taskInclude,
        });
        if (oldTask.columnId !== columnId) {
            const oldColumn = await prisma_1.prisma.column.findUnique({ where: { id: oldTask.columnId } });
            const newColumn = await prisma_1.prisma.column.findUnique({ where: { id: columnId } });
            await logActivity(taskId, userId, 'moved task', oldColumn?.title, newColumn?.title);
        }
        const column = await prisma_1.prisma.column.findUnique({
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
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to move task' });
    }
};
exports.moveTask = moveTask;
const deleteTask = (io) => async (req, res) => {
    try {
        const { taskId } = req.params;
        const task = await prisma_1.prisma.task.findUnique({
            where: { id: taskId },
            include: { column: { include: { board: true } } },
        });
        if (!task) {
            res.status(404).json({ message: 'Task not found' });
            return;
        }
        await prisma_1.prisma.task.delete({ where: { id: taskId } });
        io.to(`workspace:${task.column.board.workspaceId}`).emit('task:deleted', {
            taskId,
            columnId: task.columnId,
            boardId: task.column.boardId,
        });
        res.json({ message: 'Task deleted' });
    }
    catch {
        res.status(500).json({ message: 'Failed to delete task' });
    }
};
exports.deleteTask = deleteTask;
const getTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const task = await prisma_1.prisma.task.findUnique({
            where: { id: taskId },
            include: taskInclude,
        });
        if (!task) {
            res.status(404).json({ message: 'Task not found' });
            return;
        }
        res.json(task);
    }
    catch {
        res.status(500).json({ message: 'Failed to fetch task' });
    }
};
exports.getTask = getTask;
const uploadAttachment = (io) => async (req, res) => {
    try {
        const { taskId } = req.params;
        const file = req.file;
        if (!file) {
            res.status(400).json({ message: 'No file uploaded' });
            return;
        }
        const attachment = await prisma_1.prisma.attachment.create({
            data: {
                taskId,
                filename: file.originalname,
                url: `/uploads/${file.filename}`,
                mimetype: file.mimetype,
                size: file.size,
            },
        });
        await logActivity(taskId, req.user.id, 'added attachment', undefined, file.originalname);
        const task = await prisma_1.prisma.task.findUnique({
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
    }
    catch {
        res.status(500).json({ message: 'Failed to upload attachment' });
    }
};
exports.uploadAttachment = uploadAttachment;
const getNotifications = async (req, res) => {
    try {
        const notifications = await prisma_1.prisma.notification.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
        res.json(notifications);
    }
    catch {
        res.status(500).json({ message: 'Failed to fetch notifications' });
    }
};
exports.getNotifications = getNotifications;
const markNotificationsRead = async (req, res) => {
    try {
        await prisma_1.prisma.notification.updateMany({
            where: { userId: req.user.id, read: false },
            data: { read: true },
        });
        res.json({ message: 'Notifications marked as read' });
    }
    catch {
        res.status(500).json({ message: 'Failed to mark notifications' });
    }
};
exports.markNotificationsRead = markNotificationsRead;
//# sourceMappingURL=taskController.js.map