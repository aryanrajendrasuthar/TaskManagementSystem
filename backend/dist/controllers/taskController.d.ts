import { Response } from 'express';
import { Server } from 'socket.io';
import { AuthRequest } from '../middleware/auth';
export declare const createTask: (io: Server) => (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateTask: (io: Server) => (req: AuthRequest, res: Response) => Promise<void>;
export declare const moveTask: (io: Server) => (req: AuthRequest, res: Response) => Promise<void>;
export declare const deleteTask: (io: Server) => (req: AuthRequest, res: Response) => Promise<void>;
export declare const getTask: (req: AuthRequest, res: Response) => Promise<void>;
export declare const uploadAttachment: (io: Server) => (req: AuthRequest, res: Response) => Promise<void>;
export declare const getNotifications: (req: AuthRequest, res: Response) => Promise<void>;
export declare const markNotificationsRead: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=taskController.d.ts.map