import { createPgModel } from '../lib/pgModel.js';

export const ImportJob = createPgModel('import_jobs', 'ImportJob');
