import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import * as roleController from '../controllers/roleController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { loginSchema, changePasswordSchema } from './schemas/authSchema.js';

const router = Router();

// GET /api/v1/auth/roles (public for signup)
router.get('/roles', roleController.listRoles);

// POST /api/v1/auth/signup
router.post('/signup', authController.signup);

// POST /api/v1/auth/login
router.post('/login', validate({ body: loginSchema }), authController.login);

// POST /api/v1/auth/refresh
router.post('/refresh', authController.refresh);

// POST /api/v1/auth/logout
router.post('/logout', authenticate, authController.logout);

// GET /api/v1/auth/me
router.get('/me', authenticate, authController.getMe);

// POST /api/v1/auth/change-password
router.post(
  '/change-password',
  authenticate,
  validate({ body: changePasswordSchema }),
  authController.changePassword
);

export default router;
