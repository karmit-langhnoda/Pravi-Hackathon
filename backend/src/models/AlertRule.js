import { createPgModel } from '../lib/pgModel.js';

export const AlertRule = createPgModel('alert_rules', 'AlertRule');
export const Notification = createPgModel('notifications', 'Notification');
