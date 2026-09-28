import { createPgModel } from '../lib/pgModel.js';

export const LifecycleEvent = createPgModel('lifecycle_events', 'LifecycleEvent');
