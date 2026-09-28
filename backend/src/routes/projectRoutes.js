import { Router } from 'express';
import * as c from '../controllers/projectController.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/requirePermission.js';
import { PERMISSIONS } from '../config/constants.js';

const router = Router();
router.use(authenticate);

router.get('/', requirePermission(PERMISSIONS.ASSET_READ), c.listProjects);
router.post('/', requirePermission(PERMISSIONS.ORG_MANAGE), c.createProject);
router.get('/:id', requirePermission(PERMISSIONS.ASSET_READ), c.getProjectById);
router.patch('/:id', requirePermission(PERMISSIONS.ORG_MANAGE), c.updateProject);
router.delete('/:id', requirePermission(PERMISSIONS.ORG_MANAGE), c.deleteProject);

export default router;
