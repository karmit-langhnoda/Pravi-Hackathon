import { createPgModel } from '../lib/pgModel.js';

export const Department = createPgModel('departments', 'Department');
