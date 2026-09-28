import { createPgModel } from '../lib/pgModel.js';

export const AuditLog = createPgModel('audit_logs', 'AuditLog');
