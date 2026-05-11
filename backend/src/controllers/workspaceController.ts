import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';
import { sendInviteEmail } from '../services/emailService';

export const createWorkspace = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;
    const userId = req.user!.id;

    const workspace = await prisma.workspace.create({
      data: {
        name,
        description,
        members: { create: { userId, role: 'OWNER' } },
      },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true, avatar: true } } } },
        boards: true,
      },
    });

    res.status(201).json(workspace);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create workspace' });
  }
};

export const getWorkspaces = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const workspaces = await prisma.workspace.findMany({
      where: { members: { some: { userId } } },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
        },
        boards: { select: { id: true, name: true } },
      },
    });
    res.json(workspaces);
  } catch {
    res.status(500).json({ message: 'Failed to fetch workspaces' });
  }
};

export const getWorkspace = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { workspaceId } = req.params;
    const cacheKey = `workspace:${workspaceId}`;

    const cached = await redis.get(cacheKey).catch(() => null);
    if (cached) {
      res.json(JSON.parse(cached));
      return;
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
        },
        boards: true,
      },
    });

    if (!workspace) {
      res.status(404).json({ message: 'Workspace not found' });
      return;
    }

    await redis.setex(cacheKey, 300, JSON.stringify(workspace)).catch(() => {});
    res.json(workspace);
  } catch {
    res.status(500).json({ message: 'Failed to fetch workspace' });
  }
};

export const inviteMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { workspaceId } = req.params;
    const { email, role = 'MEMBER' } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(404).json({ message: 'User not found. They must register first.' });
      return;
    }

    const existing = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: user.id, workspaceId } },
    });
    if (existing) {
      res.status(409).json({ message: 'User is already a member' });
      return;
    }

    const member = await prisma.workspaceMember.create({
      data: { userId: user.id, workspaceId, role },
      include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
    });

    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    await sendInviteEmail(email, user.name, workspace?.name || 'workspace').catch(() => {});

    await redis.del(`workspace:${workspaceId}`).catch(() => {});
    res.status(201).json(member);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to invite member' });
  }
};

export const removeMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { workspaceId, memberId } = req.params;
    await prisma.workspaceMember.delete({
      where: { userId_workspaceId: { userId: memberId, workspaceId } },
    });
    await redis.del(`workspace:${workspaceId}`).catch(() => {});
    res.json({ message: 'Member removed' });
  } catch {
    res.status(500).json({ message: 'Failed to remove member' });
  }
};

export const updateMemberRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { workspaceId, memberId } = req.params;
    const { role } = req.body;
    const member = await prisma.workspaceMember.update({
      where: { userId_workspaceId: { userId: memberId, workspaceId } },
      data: { role },
      include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
    });
    await redis.del(`workspace:${workspaceId}`).catch(() => {});
    res.json(member);
  } catch {
    res.status(500).json({ message: 'Failed to update role' });
  }
};
