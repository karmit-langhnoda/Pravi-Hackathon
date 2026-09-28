import { Router } from 'express';
import * as dashboardController from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/requirePermission.js';
import { PERMISSIONS } from '../config/constants.js';

const router = Router();

router.use(authenticate);
router.use(requirePermission(PERMISSIONS.DASHBOARD_READ));

router.get('/summary', dashboardController.getSummary);
router.get('/by-status', dashboardController.getByStatus);
router.get('/by-type', dashboardController.getByType);
router.get('/by-location', dashboardController.getByLocation);
router.get('/expiring-warranties', dashboardController.getExpiringWarranties);
router.get('/overdue-returns', dashboardController.getOverdueReturns);
router.get('/upcoming-maintenance', dashboardController.getUpcomingMaintenance);
router.get('/recent-activity', dashboardController.getRecentActivity);

export default router;
