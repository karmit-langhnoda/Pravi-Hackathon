import { Router } from 'express';
import * as assetTypeController from '../controllers/assetTypeController.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/requirePermission.js';
import { PERMISSIONS } from '../config/constants.js';

const router = Router();

router.use(authenticate);

// Read routes - available to anyone with asset:read
router.get('/', assetTypeController.listAssetTypes);
router.get('/:id', assetTypeController.getAssetTypeById);
router.get('/:id/form-schema', assetTypeController.getFormSchema);
router.get('/:id/allowed-children', assetTypeController.getAllowedChildren);
router.get('/:id/import-template', requirePermission(PERMISSIONS.ASSET_IMPORT), assetTypeController.getImportTemplate);

// Write routes - require type:manage
router.post('/', requirePermission(PERMISSIONS.TYPE_MANAGE), assetTypeController.createAssetType);
router.put('/:id', requirePermission(PERMISSIONS.TYPE_MANAGE), assetTypeController.updateAssetType);
router.post('/:id/deactivate', requirePermission(PERMISSIONS.TYPE_MANAGE), assetTypeController.deactivateAssetType);

export default router;
