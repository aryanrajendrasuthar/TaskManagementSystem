import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const createWorkspace: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getWorkspaces: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getWorkspace: (req: AuthRequest, res: Response) => Promise<void>;
export declare const inviteMember: (req: AuthRequest, res: Response) => Promise<void>;
export declare const removeMember: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateMemberRole: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=workspaceController.d.ts.map