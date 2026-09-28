import { Router } from 'express';
import * as roleController from '../controllers/roleController.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/requirePermission.js';
import { PERMISSIONS } from '../config/constants.js';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission(PERMISSIONS.ROLE_MANAGE, PERMISSIONS.USER_MANAGE), roleController.listRoles);
router.get('/:id', requirePermission(PERMISSIONS.ROLE_MANAGE), roleController.getRoleById);
router.post('/', requirePermission(PERMISSIONS.ROLE_MANAGE), roleController.createRole);
router.put('/:id', requirePermission(PERMISSIONS.ROLE_MANAGE), roleController.updateRole);
router.delete('/:id', requirePermission(PERMISSIONS.ROLE_MANAGE), roleController.deleteRole);

export default router;
