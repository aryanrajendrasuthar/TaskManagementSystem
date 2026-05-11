import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const createBoard: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getBoards: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getBoard: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateBoard: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deleteBoard: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createColumn: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateColumn: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deleteColumn: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=boardController.d.ts.map