import { Router } from 'express';
import { createBlock, deleteBlock, listBlocks, updateBlock } from '../controllers/blockController';
import { requireAuth } from '../middleware/auth';

export const blockRouter = Router();

blockRouter.use(requireAuth());
blockRouter.get('/', listBlocks);
blockRouter.post('/', createBlock);
blockRouter.put('/:id', updateBlock);
blockRouter.delete('/:id', deleteBlock);
