import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createBoard,
  getBoards,
  getBoard,
  updateBoard,
  deleteBoard,
  createColumn,
  updateColumn,
  deleteColumn,
} from '../controllers/boardController';

const router = Router({ mergeParams: true });

router.get('/', authenticate, getBoards);
router.post('/', authenticate, createBoard);
router.get('/:boardId', authenticate, getBoard);
router.patch('/:boardId', authenticate, updateBoard);
router.delete('/:boardId', authenticate, deleteBoard);

router.post('/:boardId/columns', authenticate, createColumn);
router.patch('/:boardId/columns/:columnId', authenticate, updateColumn);
router.delete('/:boardId/columns/:columnId', authenticate, deleteColumn);

export default router;
