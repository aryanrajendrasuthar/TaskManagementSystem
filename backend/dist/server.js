"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const prisma_1 = require("./lib/prisma");
const redis_1 = require("./lib/redis");
const socketHandlers_1 = require("./socket/socketHandlers");
const auth_1 = __importDefault(require("./routes/auth"));
const workspaces_1 = __importDefault(require("./routes/workspaces"));
const tasks_1 = __importDefault(require("./routes/tasks"));
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const io = new socket_io_1.Server(server, {
    cors: {
        origin: clientUrl,
        methods: ['GET', 'POST'],
        credentials: true,
    },
});
exports.io = io;
// Middleware
app.use((0, cors_1.default)({ origin: clientUrl, credentials: true }));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Static uploads
app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'uploads')));
// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
// API Routes
app.use('/api/auth', auth_1.default);
app.use('/api/workspaces', workspaces_1.default);
const taskRouter = (0, tasks_1.default)(io);
app.use('/api', taskRouter);
// 404
app.use((_req, res) => res.status(404).json({ message: 'Route not found' }));
// Setup Socket.io
(0, socketHandlers_1.setupSocketHandlers)(io);
const PORT = parseInt(process.env.PORT || '5000');
const start = async () => {
    try {
        await prisma_1.prisma.$connect();
        console.log('PostgreSQL connected');
        await Promise.allSettled([
            redis_1.redis.connect().catch(() => console.warn('Redis unavailable — running without cache')),
            redis_1.pubClient.connect().catch(() => { }),
            redis_1.subClient.connect().catch(() => { }),
        ]);
        server.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    }
    catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
};
const shutdown = async () => {
    console.log('Shutting down...');
    await prisma_1.prisma.$disconnect();
    redis_1.redis.disconnect();
    server.close(() => process.exit(0));
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
start();
//# sourceMappingURL=server.js.map