import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';

import { prisma } from './lib/prisma';
import { redis, pubClient, subClient } from './lib/redis';
import { setupSocketHandlers } from './socket/socketHandlers';
import authRoutes from './routes/auth';
import workspaceRoutes from './routes/workspaces';
import createTaskRouter from './routes/tasks';

const app = express();
const server = http.createServer(app);

const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

const io = new Server(server, {
  cors: {
    origin: clientUrl,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors({ origin: clientUrl, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);

const taskRouter = createTaskRouter(io);
app.use('/api', taskRouter);

// 404
app.use((_req, res) => res.status(404).json({ message: 'Route not found' }));

// Setup Socket.io
setupSocketHandlers(io);

const PORT = parseInt(process.env.PORT || '5000');

const start = async () => {
  try {
    await prisma.$connect();
    console.log('PostgreSQL connected');

    await Promise.allSettled([
      redis.connect().catch(() => console.warn('Redis unavailable — running without cache')),
      pubClient.connect().catch(() => {}),
      subClient.connect().catch(() => {}),
    ]);

    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

const shutdown = async () => {
  console.log('Shutting down...');
  await prisma.$disconnect();
  redis.disconnect();
  server.close(() => process.exit(0));
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start();

export { io };
