"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteColumn = exports.updateColumn = exports.createColumn = exports.deleteBoard = exports.updateBoard = exports.getBoard = exports.getBoards = exports.createBoard = void 0;
const prisma_1 = require("../lib/prisma");
const DEFAULT_COLUMNS = [
    { title: 'To Do', order: 0, color: '#64748B' },
    { title: 'In Progress', order: 1, color: '#F59E0B' },
    { title: 'Review', order: 2, color: '#8B5CF6' },
    { title: 'Done', order: 3, color: '#10B981' },
];
const createBoard = async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const { name, description } = req.body;
        const board = await prisma_1.prisma.board.create({
            data: {
                name,
                description,
                workspaceId,
                columns: { create: DEFAULT_COLUMNS },
            },
            include: {
                columns: {
                    include: {
                        tasks: {
                            include: {
                                assignee: { select: { id: true, name: true, email: true, avatar: true } },
                                creator: { select: { id: true, name: true, email: true, avatar: true } },
                                attachments: true,
                            },
                            orderBy: { order: 'asc' },
                        },
                    },
                    orderBy: { order: 'asc' },
                },
            },
        });
        res.status(201).json(board);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to create board' });
    }
};
exports.createBoard = createBoard;
const getBoards = async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const boards = await prisma_1.prisma.board.findMany({
            where: { workspaceId },
            include: { columns: { select: { id: true, title: true, order: true }, orderBy: { order: 'asc' } } },
        });
        res.json(boards);
    }
    catch {
        res.status(500).json({ message: 'Failed to fetch boards' });
    }
};
exports.getBoards = getBoards;
const getBoard = async (req, res) => {
    try {
        const { boardId } = req.params;
        const board = await prisma_1.prisma.board.findUnique({
            where: { id: boardId },
            include: {
                columns: {
                    include: {
                        tasks: {
                            include: {
                                assignee: { select: { id: true, name: true, email: true, avatar: true } },
                                creator: { select: { id: true, name: true, email: true, avatar: true } },
                                attachments: true,
                            },
                            orderBy: { order: 'asc' },
                        },
                    },
                    orderBy: { order: 'asc' },
                },
            },
        });
        if (!board) {
            res.status(404).json({ message: 'Board not found' });
            return;
        }
        res.json(board);
    }
    catch {
        res.status(500).json({ message: 'Failed to fetch board' });
    }
};
exports.getBoard = getBoard;
const updateBoard = async (req, res) => {
    try {
        const { boardId } = req.params;
        const { name, description } = req.body;
        const board = await prisma_1.prisma.board.update({
            where: { id: boardId },
            data: { name, description },
        });
        res.json(board);
    }
    catch {
        res.status(500).json({ message: 'Failed to update board' });
    }
};
exports.updateBoard = updateBoard;
const deleteBoard = async (req, res) => {
    try {
        const { boardId } = req.params;
        await prisma_1.prisma.board.delete({ where: { id: boardId } });
        res.json({ message: 'Board deleted' });
    }
    catch {
        res.status(500).json({ message: 'Failed to delete board' });
    }
};
exports.deleteBoard = deleteBoard;
const createColumn = async (req, res) => {
    try {
        const { boardId } = req.params;
        const { title, color } = req.body;
        const lastColumn = await prisma_1.prisma.column.findFirst({
            where: { boardId },
            orderBy: { order: 'desc' },
        });
        const column = await prisma_1.prisma.column.create({
            data: { title, color: color || '#6366F1', boardId, order: (lastColumn?.order ?? -1) + 1 },
            include: { tasks: true },
        });
        res.status(201).json(column);
    }
    catch {
        res.status(500).json({ message: 'Failed to create column' });
    }
};
exports.createColumn = createColumn;
const updateColumn = async (req, res) => {
    try {
        const { columnId } = req.params;
        const { title, color } = req.body;
        const column = await prisma_1.prisma.column.update({
            where: { id: columnId },
            data: { title, color },
        });
        res.json(column);
    }
    catch {
        res.status(500).json({ message: 'Failed to update column' });
    }
};
exports.updateColumn = updateColumn;
const deleteColumn = async (req, res) => {
    try {
        const { columnId } = req.params;
        await prisma_1.prisma.column.delete({ where: { id: columnId } });
        res.json({ message: 'Column deleted' });
    }
    catch {
        res.status(500).json({ message: 'Failed to delete column' });
    }
};
exports.deleteColumn = deleteColumn;
//# sourceMappingURL=boardController.js.map