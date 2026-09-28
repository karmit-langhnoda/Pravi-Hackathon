import { createPgModel } from '../lib/pgModel.js';

export const AuditCampaign = createPgModel('audit_campaigns', 'AuditCampaign');
export const AuditItem = createPgModel('audit_items', 'AuditItem');
