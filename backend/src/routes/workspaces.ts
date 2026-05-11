import { Router } from 'express';
import { authenticate, requireWorkspaceRole } from '../middleware/auth';
import {
  createWorkspace,
  getWorkspaces,
  getWorkspace,
  inviteMember,
  removeMember,
  updateMemberRole,
} from '../controllers/workspaceController';
import boardRouter from './boards';

const router = Router();

router.use('/:workspaceId/boards', boardRouter);

router.get('/', authenticate, getWorkspaces);
router.post('/', authenticate, createWorkspace);
router.get('/:workspaceId', authenticate, getWorkspace);

router.post(
  '/:workspaceId/members',
  authenticate,
  requireWorkspaceRole(['OWNER', 'ADMIN']),
  inviteMember
);

router.delete(
  '/:workspaceId/members/:memberId',
  authenticate,
  requireWorkspaceRole(['OWNER', 'ADMIN']),
  removeMember
);

router.patch(
  '/:workspaceId/members/:memberId/role',
  authenticate,
  requireWorkspaceRole(['OWNER']),
  updateMemberRole
);

export default router;
