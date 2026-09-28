// Permission constants used across the platform
export const PERMISSIONS = {
  // Assets
  ASSET_READ: 'asset:read',
  ASSET_READ_OWN: 'asset:read:own',
  ASSET_CREATE: 'asset:create',
  ASSET_UPDATE: 'asset:update',
  ASSET_ARCHIVE: 'asset:archive',
  ASSET_IMPORT: 'asset:import',
  ASSET_EXPORT: 'asset:export',
  ASSET_ASSIGN: 'asset:assign',
  ASSET_STATUS: 'asset:status',

  // Admin config
  TYPE_MANAGE: 'type:manage',
  USER_MANAGE: 'user:manage',
  ROLE_MANAGE: 'role:manage',
  ORG_MANAGE: 'org:manage',

  // Requests
  REQUEST_CREATE: 'request:create',
  REQUEST_APPROVE: 'request:approve',

  // Maintenance
  MAINTENANCE_READ: 'maintenance:read',
  MAINTENANCE_WRITE: 'maintenance:write',

  // Audits
  AUDIT_RUN: 'audit:run',
  AUDIT_LOG_READ: 'auditlog:read',

  // Reports & Dashboard
  REPORT_READ: 'report:read',
  DASHBOARD_READ: 'dashboard:read',

  // Alerts
  ALERT_MANAGE: 'alert:manage',

  // Documents
  DOCUMENT_UPLOAD: 'document:upload',
  DOCUMENT_READ: 'document:read',

  // AI Assistant
  ASSISTANT_USE: 'assistant:use',
};

// System role definitions with their default permissions
export const SYSTEM_ROLES = {
  Admin: {
    description: 'Full control, configures types, users, roles, alerts',
    permissions: Object.values(PERMISSIONS),
  },
  AssetManager: {
    description: 'Day-to-day asset operations',
    permissions: [
      PERMISSIONS.ORG_MANAGE,
      PERMISSIONS.ASSET_READ,
      PERMISSIONS.ASSET_READ_OWN,
      PERMISSIONS.ASSET_CREATE,
      PERMISSIONS.ASSET_UPDATE,
      PERMISSIONS.ASSET_ARCHIVE,
      PERMISSIONS.ASSET_IMPORT,
      PERMISSIONS.ASSET_EXPORT,
      PERMISSIONS.ASSET_ASSIGN,
      PERMISSIONS.ASSET_STATUS,
      PERMISSIONS.REQUEST_CREATE,
      PERMISSIONS.MAINTENANCE_READ,
      PERMISSIONS.MAINTENANCE_WRITE,
      PERMISSIONS.AUDIT_RUN,
      PERMISSIONS.AUDIT_LOG_READ,
      PERMISSIONS.REPORT_READ,
      PERMISSIONS.DASHBOARD_READ,
      PERMISSIONS.DOCUMENT_UPLOAD,
      PERMISSIONS.DOCUMENT_READ,
      PERMISSIONS.ASSISTANT_USE,
    ],
  },
  Approver: {
    description: 'Approves requests (transfers, disposals, etc.)',
    permissions: [
      PERMISSIONS.ASSET_READ,
      PERMISSIONS.ASSET_READ_OWN,
      PERMISSIONS.REQUEST_CREATE,
      PERMISSIONS.REQUEST_APPROVE,
      PERMISSIONS.DASHBOARD_READ,
      PERMISSIONS.DOCUMENT_READ,
      PERMISSIONS.ASSISTANT_USE,
    ],
  },
  Technician: {
    description: 'Handles repairs and maintenance tasks',
    permissions: [
      PERMISSIONS.ASSET_READ_OWN,
      PERMISSIONS.ASSET_STATUS,
      PERMISSIONS.REQUEST_CREATE,
      PERMISSIONS.MAINTENANCE_READ,
      PERMISSIONS.MAINTENANCE_WRITE,
      PERMISSIONS.DASHBOARD_READ,
      PERMISSIONS.DOCUMENT_UPLOAD,
      PERMISSIONS.DOCUMENT_READ,
      PERMISSIONS.ASSISTANT_USE,
    ],
  },
  Auditor: {
    description: 'Read-only plus runs physical audits',
    permissions: [
      PERMISSIONS.ASSET_READ,
      PERMISSIONS.ASSET_READ_OWN,
      PERMISSIONS.ASSET_EXPORT,
      PERMISSIONS.AUDIT_RUN,
      PERMISSIONS.AUDIT_LOG_READ,
      PERMISSIONS.MAINTENANCE_READ,
      PERMISSIONS.DASHBOARD_READ,
      PERMISSIONS.DOCUMENT_READ,
      PERMISSIONS.ASSISTANT_USE,
    ],
  },
  Employee: {
    description: 'Sees own assets, raises requests',
    permissions: [
      PERMISSIONS.ASSET_READ_OWN,
      PERMISSIONS.REQUEST_CREATE,
      PERMISSIONS.DASHBOARD_READ,
      PERMISSIONS.ASSISTANT_USE,
    ],
  },
};

// Asset lifecycle event kinds
export const LIFECYCLE_EVENT_KINDS = [
  'created',
  'updated',
  'status_change',
  'assigned',
  'returned',
  'transferred',
  'maintenance',
  'archived',
  'parent_changed',
];

// Request kinds
export const REQUEST_KINDS = [
  'asset_request',
  'transfer',
  'return',
  'repair',
  'status_change',
  'disposal',
];

// Request statuses
export const REQUEST_STATUSES = ['pending', 'approved', 'rejected', 'cancelled', 'fulfilled'];

// Maintenance kinds
export const MAINTENANCE_KINDS = ['repair', 'preventive', 'inspection', 'calibration'];

// Maintenance statuses
export const MAINTENANCE_STATUSES = ['scheduled', 'in_progress', 'done', 'cancelled'];

// Document categories
export const DOCUMENT_CATEGORIES = ['manual', 'invoice', 'warranty', 'policy', 'photo', 'other'];

// Document categories that trigger RAG ingestion
export const RAG_INGEST_CATEGORIES = ['manual', 'warranty', 'policy'];

// Notification channels
export const NOTIFICATION_CHANNELS = ['in_app', 'email'];

// Alert trigger kinds
export const ALERT_TRIGGER_KINDS = [
  'warranty_expiry',
  'amc_expiry',
  'maintenance_due',
  'overdue_return',
  'custom_date',
];

// Location kinds
export const LOCATION_KINDS = ['country', 'city', 'building', 'floor', 'room', 'other'];

// Field data types
export const FIELD_DATA_TYPES = [
  'text',
  'number',
  'date',
  'boolean',
  'select',
  'multiselect',
  'user',
  'location',
];
