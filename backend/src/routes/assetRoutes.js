import { Router } from 'express';
import * as c from '../controllers/assetController.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/requirePermission.js';
import { PERMISSIONS } from '../config/constants.js';

const router = Router();
router.use(authenticate);

router.get('/', requirePermission(PERMISSIONS.ASSET_READ, PERMISSIONS.ASSET_READ_OWN), c.listAssets);
router.get('/by-tag/:tag', requirePermission(PERMISSIONS.ASSET_READ, PERMISSIONS.ASSET_READ_OWN), c.getAssetByTag);
router.post('/', requirePermission(PERMISSIONS.ASSET_CREATE), c.createAsset);
router.get('/:id', requirePermission(PERMISSIONS.ASSET_READ, PERMISSIONS.ASSET_READ_OWN), c.getAssetById);
router.patch('/:id', requirePermission(PERMISSIONS.ASSET_UPDATE), c.updateAsset);
router.delete('/:id', requirePermission(PERMISSIONS.ASSET_UPDATE), c.deleteAsset);
router.post('/:id/archive', requirePermission(PERMISSIONS.ASSET_ARCHIVE), c.archiveAsset);
router.post('/:id/status', requirePermission(PERMISSIONS.ASSET_STATUS), c.changeStatus);
router.get('/:id/history', requirePermission(PERMISSIONS.ASSET_READ, PERMISSIONS.ASSET_READ_OWN), c.getAssetHistory);
router.get('/:id/qr', requirePermission(PERMISSIONS.ASSET_READ, PERMISSIONS.ASSET_READ_OWN), c.getAssetQR);
router.get('/:id/children', requirePermission(PERMISSIONS.ASSET_READ), c.getAssetChildren);
router.get('/:id/summary', requirePermission(PERMISSIONS.ASSET_READ), c.getContainerSummary);
router.post('/:id/set-parent', requirePermission(PERMISSIONS.ASSET_UPDATE), c.setAssetParent);

export default router;
