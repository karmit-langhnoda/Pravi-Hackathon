import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/requirePermission.js';
import { validate } from '../middleware/validate.js';
import { createUserSchema, updateUserSchema } from './schemas/userSchema.js';
import { PERMISSIONS } from '../config/constants.js';

const router = Router();

router.use(authenticate);

// GET /api/v1/users
router.get('/', requirePermission(PERMISSIONS.USER_MANAGE), userController.listUsers);

// GET /api/v1/users/:id
router.get('/:id', requirePermission(PERMISSIONS.USER_MANAGE), userController.getUserById);

// POST /api/v1/users
router.post(
  '/',
  requirePermission(PERMISSIONS.USER_MANAGE),
  validate({ body: createUserSchema }),
  userController.createUser
);

// PUT /api/v1/users/:id
router.put(
  '/:id',
  requirePermission(PERMISSIONS.USER_MANAGE),
  validate({ body: updateUserSchema }),
  userController.updateUser
);

// DELETE /api/v1/users/:id
router.delete('/:id', requirePermission(PERMISSIONS.USER_MANAGE), userController.deleteUser);

export default router;
