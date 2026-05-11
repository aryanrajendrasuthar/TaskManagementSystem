import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

interface SocketUser {
  id: string;
  name: string;
  email: string;
}

const authenticateSocket = (token: string): SocketUser | null => {
  try {
    const secret = process.env.JWT_SECRET || 'secret';
    return jwt.verify(token, secret) as SocketUser;
  } catch {
    return null;
  }
};

export const setupSocketHandlers = (io: Server): void => {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    const user = authenticateSocket(token);
    if (!user) {
      return next(new Error('Invalid token'));
    }
    (socket as Socket & { user: SocketUser }).user = user;
    next();
  });

  io.on('connection', (socket) => {
    const user = (socket as Socket & { user: SocketUser }).user;
    console.log(`Socket connected: ${user.name} (${socket.id})`);

    socket.join(`user:${user.id}`);

    socket.on('workspace:join', (workspaceId: string) => {
      socket.join(`workspace:${workspaceId}`);
      socket.to(`workspace:${workspaceId}`).emit('user:joined', {
        userId: user.id,
        name: user.name,
      });
    });

    socket.on('workspace:leave', (workspaceId: string) => {
      socket.leave(`workspace:${workspaceId}`);
    });

    socket.on('board:join', (boardId: string) => {
      socket.join(`board:${boardId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${user.name}`);
    });
  });
};
