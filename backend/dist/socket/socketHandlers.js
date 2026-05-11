"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocketHandlers = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticateSocket = (token) => {
    try {
        const secret = process.env.JWT_SECRET || 'secret';
        return jsonwebtoken_1.default.verify(token, secret);
    }
    catch {
        return null;
    }
};
const setupSocketHandlers = (io) => {
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication required'));
        }
        const user = authenticateSocket(token);
        if (!user) {
            return next(new Error('Invalid token'));
        }
        socket.user = user;
        next();
    });
    io.on('connection', (socket) => {
        const user = socket.user;
        console.log(`Socket connected: ${user.name} (${socket.id})`);
        socket.join(`user:${user.id}`);
        socket.on('workspace:join', (workspaceId) => {
            socket.join(`workspace:${workspaceId}`);
            socket.to(`workspace:${workspaceId}`).emit('user:joined', {
                userId: user.id,
                name: user.name,
            });
        });
        socket.on('workspace:leave', (workspaceId) => {
            socket.leave(`workspace:${workspaceId}`);
        });
        socket.on('board:join', (boardId) => {
            socket.join(`board:${boardId}`);
        });
        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${user.name}`);
        });
    });
};
exports.setupSocketHandlers = setupSocketHandlers;
//# sourceMappingURL=socketHandlers.js.map