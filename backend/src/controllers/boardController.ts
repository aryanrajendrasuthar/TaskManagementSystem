import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const DEFAULT_COLUMNS = [
  { title: 'To Do', order: 0, color: '#64748B' },
  { title: 'In Progress', order: 1, color: '#F59E0B' },
  { title: 'Review', order: 2, color: '#8B5CF6' },
  { title: 'Done', order: 3, color: '#10B981' },
];

export const createBoard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { workspaceId } = req.params;
    const { name, description } = req.body;

    const board = await prisma.board.create({
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create board' });
  }
};

export const getBoards = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { workspaceId } = req.params;
    const boards = await prisma.board.findMany({
      where: { workspaceId },
      include: { columns: { select: { id: true, title: true, order: true }, orderBy: { order: 'asc' } } },
    });
    res.json(boards);
  } catch {
    res.status(500).json({ message: 'Failed to fetch boards' });
  }
};

export const getBoard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { boardId } = req.params;
    const board = await prisma.board.findUnique({
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
  } catch {
    res.status(500).json({ message: 'Failed to fetch board' });
  }
};

export const updateBoard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { boardId } = req.params;
    const { name, description } = req.body;
    const board = await prisma.board.update({
      where: { id: boardId },
      data: { name, description },
    });
    res.json(board);
  } catch {
    res.status(500).json({ message: 'Failed to update board' });
  }
};

export const deleteBoard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { boardId } = req.params;
    await prisma.board.delete({ where: { id: boardId } });
    res.json({ message: 'Board deleted' });
  } catch {
    res.status(500).json({ message: 'Failed to delete board' });
  }
};

export const createColumn = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { boardId } = req.params;
    const { title, color } = req.body;

    const lastColumn = await prisma.column.findFirst({
      where: { boardId },
      orderBy: { order: 'desc' },
    });

    const column = await prisma.column.create({
      data: { title, color: color || '#6366F1', boardId, order: (lastColumn?.order ?? -1) + 1 },
      include: { tasks: true },
    });

    res.status(201).json(column);
  } catch {
    res.status(500).json({ message: 'Failed to create column' });
  }
};

export const updateColumn = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { columnId } = req.params;
    const { title, color } = req.body;
    const column = await prisma.column.update({
      where: { id: columnId },
      data: { title, color },
    });
    res.json(column);
  } catch {
    res.status(500).json({ message: 'Failed to update column' });
  }
};

export const deleteColumn = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { columnId } = req.params;
    await prisma.column.delete({ where: { id: columnId } });
    res.json({ message: 'Column deleted' });
  } catch {
    res.status(500).json({ message: 'Failed to delete column' });
  }
};
