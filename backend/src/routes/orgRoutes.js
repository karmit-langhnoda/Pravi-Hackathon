import { Router } from 'express';
import * as orgController from '../controllers/orgController.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/requirePermission.js';
import { PERMISSIONS } from '../config/constants.js';

const router = Router();

router.use(authenticate);

// ==================== DEPARTMENTS ====================

router.get('/departments', orgController.listDepartments);
router.get('/departments/tree', orgController.getDepartmentTree);
router.get('/departments/:id', orgController.getDepartmentById);

router.post(
  '/departments',
  requirePermission(PERMISSIONS.ORG_MANAGE),
  orgController.createDepartment
);
router.put(
  '/departments/:id',
  requirePermission(PERMISSIONS.ORG_MANAGE),
  orgController.updateDepartment
);
router.delete(
  '/departments/:id',
  requirePermission(PERMISSIONS.ORG_MANAGE),
  orgController.deleteDepartment
);

// ==================== LOCATIONS ====================

router.get('/locations', orgController.listLocations);
router.get('/locations/tree', orgController.getLocationTree);
router.get('/locations/:id', orgController.getLocationById);

router.post(
  '/locations',
  requirePermission(PERMISSIONS.ORG_MANAGE),
  orgController.createLocation
);
router.put(
  '/locations/:id',
  requirePermission(PERMISSIONS.ORG_MANAGE),
  orgController.updateLocation
);
router.delete(
  '/locations/:id',
  requirePermission(PERMISSIONS.ORG_MANAGE),
  orgController.deleteLocation
);

export default router;
