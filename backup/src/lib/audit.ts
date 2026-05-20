/**
 * Audit Log Service - RGPD Compliance
 * 
 * This service handles logging of all user actions for regulatory compliance.
 * Logs are stored in localStorage and can be exported for audit purposes.
 */

import { toast } from 'sonner';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  userName: string;
  action: AuditAction;
  entityType: EntityType;
  entityId?: string;
  entityName?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export type AuditAction = 
  | 'LOGIN'
  | 'LOGOUT'
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'VIEW'
  | 'EXPORT'
  | 'IMPORT'
  | 'PASSWORD_RESET'
  | 'PASSWORD_CHANGE'
  | 'PERMISSION_CHANGE'
  | 'SETTINGS_CHANGE';

export type EntityType = 
  | 'USER'
  | 'DECHET'
  | 'PRESTATAIRE'
  | 'TRANSPORTEUR'
  | 'REFERENTIEL'
  | 'CONTRAT'
  | 'SITE_SETTINGS'
  | 'LISTE'
  | 'PRODUCTION_DATA';

const AUDIT_LOG_KEY = 'sincereal-audit-logs';
const MAX_LOG_ENTRIES = 10000; // Keep last 10,000 entries

/**
 * Generate a unique ID for log entries
 */
function generateLogId(): string {
  return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get current audit logs from localStorage
 */
export function getAuditLogs(): AuditLogEntry[] {
  try {
    const logs = localStorage.getItem(AUDIT_LOG_KEY);
    return logs ? JSON.parse(logs) : [];
  } catch (error) {
    console.error('Error reading audit logs:', error);
    return [];
  }
}

/**
 * Save audit logs to localStorage
 */
function saveAuditLogs(logs: AuditLogEntry[]): void {
  try {
    // Keep only the last MAX_LOG_ENTRIES
    const trimmedLogs = logs.slice(-MAX_LOG_ENTRIES);
    localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(trimmedLogs));
  } catch (error) {
    console.error('Error saving audit logs:', error);
  }
}

/**
 * Add a new audit log entry
 */
export function addAuditLog(
  userId: string,
  userEmail: string,
  userName: string,
  action: AuditAction,
  entityType: EntityType,
  details: Record<string, any> = {},
  entityId?: string,
  entityName?: string
): void {
  const entry: AuditLogEntry = {
    id: generateLogId(),
    timestamp: new Date().toISOString(),
    userId,
    userEmail,
    userName,
    action,
    entityType,
    entityId,
    entityName,
    details,
    userAgent: navigator.userAgent,
  };

  const logs = getAuditLogs();
  logs.push(entry);
  saveAuditLogs(logs);
}

/**
 * Log user login
 */
export function logLogin(userId: string, userEmail: string, userName: string): void {
  addAuditLog(userId, userEmail, userName, 'LOGIN', 'USER', {});
}

/**
 * Log user logout
 */
export function logLogout(userId: string, userEmail: string, userName: string): void {
  addAuditLog(userId, userEmail, userName, 'LOGOUT', 'USER', {});
}

/**
 * Log entity creation
 */
export function logCreate(
  userId: string,
  userEmail: string,
  userName: string,
  entityType: EntityType,
  entityId: string,
  entityName: string,
  details?: Record<string, any>
): void {
  addAuditLog(userId, userEmail, userName, 'CREATE', entityType, details || {}, entityId, entityName);
}

/**
 * Log entity update
 */
export function logUpdate(
  userId: string,
  userEmail: string,
  userName: string,
  entityType: EntityType,
  entityId: string,
  entityName: string,
  changes: Record<string, { old: any; new: any }>
): void {
  addAuditLog(userId, userEmail, userName, 'UPDATE', entityType, { changes }, entityId, entityName);
}

/**
 * Log entity deletion
 */
export function logDelete(
  userId: string,
  userEmail: string,
  userName: string,
  entityType: EntityType,
  entityId: string,
  entityName: string,
  details?: Record<string, any>
): void {
  addAuditLog(userId, userEmail, userName, 'DELETE', entityType, details || {}, entityId, entityName);
}

/**
 * Log data export
 */
export function logExport(
  userId: string,
  userEmail: string,
  userName: string,
  entityType: EntityType,
  format: string,
  recordCount: number
): void {
  addAuditLog(userId, userEmail, userName, 'EXPORT', entityType, { format, recordCount });
}

/**
 * Log data import
 */
export function logImport(
  userId: string,
  userEmail: string,
  userName: string,
  entityType: EntityType,
  recordCount: number,
  duplicateCount: number
): void {
  addAuditLog(userId, userEmail, userName, 'IMPORT', entityType, { recordCount, duplicateCount });
}

/**
 * Log password reset
 */
export function logPasswordReset(
  userId: string,
  userEmail: string,
  userName: string,
  targetUserId: string,
  targetUserEmail: string
): void {
  addAuditLog(userId, userEmail, userName, 'PASSWORD_RESET', 'USER', { targetUserId, targetUserEmail });
}

/**
 * Log password change
 */
export function logPasswordChange(
  userId: string,
  userEmail: string,
  userName: string
): void {
  addAuditLog(userId, userEmail, userName, 'PASSWORD_CHANGE', 'USER', {});
}

/**
 * Log permission change
 */
export function logPermissionChange(
  userId: string,
  userEmail: string,
  userName: string,
  targetUserId: string,
  targetUserEmail: string,
  oldPermissions: Record<string, boolean>,
  newPermissions: Record<string, boolean>
): void {
  addAuditLog(userId, userEmail, userName, 'PERMISSION_CHANGE', 'USER', {
    targetUserId,
    targetUserEmail,
    oldPermissions,
    newPermissions,
  });
}

/**
 * Log settings change
 */
export function logSettingsChange(
  userId: string,
  userEmail: string,
  userName: string,
  changes: Record<string, { old: any; new: any }>
): void {
  addAuditLog(userId, userEmail, userName, 'SETTINGS_CHANGE', 'SITE_SETTINGS', { changes });
}

/**
 * Export audit logs to CSV
 */
export function exportAuditLogsToCSV(startDate?: Date, endDate?: Date): void {
  let logs = getAuditLogs();
  
  // Filter by date range if provided
  if (startDate || endDate) {
    logs = logs.filter(log => {
      const logDate = new Date(log.timestamp);
      if (startDate && logDate < startDate) return false;
      if (endDate && logDate > endDate) return false;
      return true;
    });
  }

  if (logs.length === 0) {
    toast.info('Aucun log à exporter pour cette période');
    return;
  }

  const headers = [
    'Date/Heure',
    'Utilisateur',
    'Email',
    'Action',
    'Type',
    'Entité',
    'Détails',
  ];

  const rows = logs.map(log => [
    new Date(log.timestamp).toLocaleString('fr-FR'),
    log.userName,
    log.userEmail,
    log.action,
    log.entityType,
    log.entityName || '-',
    JSON.stringify(log.details),
  ]);

  const csvContent = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  toast.success(`${logs.length} logs exportés`);
}

/**
 * Clear all audit logs (admin only)
 */
export function clearAuditLogs(): void {
  localStorage.removeItem(AUDIT_LOG_KEY);
  toast.success('Logs d\'audit effacés');
}

/**
 * Get audit logs statistics
 */
export function getAuditStats(): {
  totalLogs: number;
  lastLogin?: string;
  actionsByType: Record<AuditAction, number>;
} {
  const logs = getAuditLogs();
  const actionsByType = {} as Record<AuditAction, number>;
  
  logs.forEach(log => {
    actionsByType[log.action] = (actionsByType[log.action] || 0) + 1;
  });

  const lastLogin = logs
    .filter(log => log.action === 'LOGIN')
    .pop()?.timestamp;

  return {
    totalLogs: logs.length,
    lastLogin,
    actionsByType,
  };
}
