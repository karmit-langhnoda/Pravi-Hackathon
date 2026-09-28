import { createPgModel } from '../lib/pgModel.js';

export const MaintenanceRecord = createPgModel('maintenance_records', 'MaintenanceRecord');
