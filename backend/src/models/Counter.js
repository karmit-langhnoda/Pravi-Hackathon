import { createPgModel } from '../lib/pgModel.js';

export const Counter = createPgModel('counters', 'Counter');
