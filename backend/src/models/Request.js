import { createPgModel } from '../lib/pgModel.js';

export const Request = createPgModel('requests', 'Request');
