"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireWorkspaceRole = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../lib/prisma");
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ message: 'No token provided' });
            return;
        }
        const token = authHeader.substring(7);
        const secret = process.env.JWT_SECRET || 'secret';
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, email: true, name: true },
        });
        if (!user) {
            res.status(401).json({ message: 'User not found' });
            return;
        }
        req.user = user;
        next();
    }
    catch {
        res.status(401).json({ message: 'Invalid token' });
    }
};
exports.authenticate = authenticate;
const requireWorkspaceRole = (roles) => {
    return async (req, res, next) => {
        try {
            const { workspaceId } = req.params;
            const userId = req.user?.id;
            if (!userId || !workspaceId) {
                res.status(403).json({ message: 'Forbidden' });
                return;
            }
            const member = await prisma_1.prisma.workspaceMember.findUnique({
                where: { userId_workspaceId: { userId, workspaceId } },
            });
            if (!member || !roles.includes(member.role)) {
                res.status(403).json({ message: 'Insufficient permissions' });
                return;
            }
            next();
        }
        catch {
            res.status(500).json({ message: 'Server error' });
        }
    };
};
exports.requireWorkspaceRole = requireWorkspaceRole;
//# sourceMappingURL=auth.js.map