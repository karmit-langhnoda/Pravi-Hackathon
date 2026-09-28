import { createPgModel } from '../lib/pgModel.js';

export const User = createPgModel('users', 'User');
