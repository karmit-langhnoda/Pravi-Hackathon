import { createPgModel } from '../lib/pgModel.js';

export const AssetType = createPgModel('asset_types', 'AssetType');
