"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMemberRole = exports.removeMember = exports.inviteMember = exports.getWorkspace = exports.getWorkspaces = exports.createWorkspace = void 0;
const prisma_1 = require("../lib/prisma");
const redis_1 = require("../lib/redis");
const emailService_1 = require("../services/emailService");
const createWorkspace = async (req, res) => {
    try {
        const { name, description } = req.body;
        const userId = req.user.id;
        const workspace = await prisma_1.prisma.workspace.create({
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
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to create workspace' });
    }
};
exports.createWorkspace = createWorkspace;
const getWorkspaces = async (req, res) => {
    try {
        const userId = req.user.id;
        const workspaces = await prisma_1.prisma.workspace.findMany({
            where: { members: { some: { userId } } },
            include: {
                members: {
                    include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
                },
                boards: { select: { id: true, name: true } },
            },
        });
        res.json(workspaces);
    }
    catch {
        res.status(500).json({ message: 'Failed to fetch workspaces' });
    }
};
exports.getWorkspaces = getWorkspaces;
const getWorkspace = async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const cacheKey = `workspace:${workspaceId}`;
        const cached = await redis_1.redis.get(cacheKey).catch(() => null);
        if (cached) {
            res.json(JSON.parse(cached));
            return;
        }
        const workspace = await prisma_1.prisma.workspace.findUnique({
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
        await redis_1.redis.setex(cacheKey, 300, JSON.stringify(workspace)).catch(() => { });
        res.json(workspace);
    }
    catch {
        res.status(500).json({ message: 'Failed to fetch workspace' });
    }
};
exports.getWorkspace = getWorkspace;
const inviteMember = async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const { email, role = 'MEMBER' } = req.body;
        const user = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (!user) {
            res.status(404).json({ message: 'User not found. They must register first.' });
            return;
        }
        const existing = await prisma_1.prisma.workspaceMember.findUnique({
            where: { userId_workspaceId: { userId: user.id, workspaceId } },
        });
        if (existing) {
            res.status(409).json({ message: 'User is already a member' });
            return;
        }
        const member = await prisma_1.prisma.workspaceMember.create({
            data: { userId: user.id, workspaceId, role },
            include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
        });
        const workspace = await prisma_1.prisma.workspace.findUnique({ where: { id: workspaceId } });
        await (0, emailService_1.sendInviteEmail)(email, user.name, workspace?.name || 'workspace').catch(() => { });
        await redis_1.redis.del(`workspace:${workspaceId}`).catch(() => { });
        res.status(201).json(member);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to invite member' });
    }
};
exports.inviteMember = inviteMember;
const removeMember = async (req, res) => {
    try {
        const { workspaceId, memberId } = req.params;
        await prisma_1.prisma.workspaceMember.delete({
            where: { userId_workspaceId: { userId: memberId, workspaceId } },
        });
        await redis_1.redis.del(`workspace:${workspaceId}`).catch(() => { });
        res.json({ message: 'Member removed' });
    }
    catch {
        res.status(500).json({ message: 'Failed to remove member' });
    }
};
exports.removeMember = removeMember;
const updateMemberRole = async (req, res) => {
    try {
        const { workspaceId, memberId } = req.params;
        const { role } = req.body;
        const member = await prisma_1.prisma.workspaceMember.update({
            where: { userId_workspaceId: { userId: memberId, workspaceId } },
            data: { role },
            include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
        });
        await redis_1.redis.del(`workspace:${workspaceId}`).catch(() => { });
        res.json(member);
    }
    catch {
        res.status(500).json({ message: 'Failed to update role' });
    }
};
exports.updateMemberRole = updateMemberRole;
//# sourceMappingURL=workspaceController.js.map