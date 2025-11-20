/**
 * =============================================================================
 * RBAC PERMISSIONS - Role-Based Access Control
 * =============================================================================
 * Defines permissions for each user role
 * =============================================================================
 */

import { UserRole } from '@prisma/client';

/**
 * Permission types
 */
export enum Permission {
  // User management
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',

  // WhatsApp accounts
  ACCOUNT_CREATE = 'account:create',
  ACCOUNT_READ = 'account:read',
  ACCOUNT_UPDATE = 'account:update',
  ACCOUNT_DELETE = 'account:delete',

  // Messages
  MESSAGE_READ = 'message:read',
  MESSAGE_SEND = 'message:send',
  MESSAGE_DELETE = 'message:delete',

  // Contacts
  CONTACT_READ = 'contact:read',
  CONTACT_UPDATE = 'contact:update',
  CONTACT_DELETE = 'contact:delete',

  // Conversations
  CONVERSATION_READ = 'conversation:read',
  CONVERSATION_ASSIGN = 'conversation:assign',
  CONVERSATION_UPDATE = 'conversation:update',

  // Automations
  AUTOMATION_CREATE = 'automation:create',
  AUTOMATION_READ = 'automation:read',
  AUTOMATION_UPDATE = 'automation:update',
  AUTOMATION_DELETE = 'automation:delete',

  // Campaigns
  CAMPAIGN_CREATE = 'campaign:create',
  CAMPAIGN_READ = 'campaign:read',
  CAMPAIGN_UPDATE = 'campaign:update',
  CAMPAIGN_DELETE = 'campaign:delete',

  // Analytics
  ANALYTICS_READ = 'analytics:read',

  // Settings
  SETTINGS_READ = 'settings:read',
  SETTINGS_UPDATE = 'settings:update',

  // AI Configuration
  AI_CONFIG_READ = 'ai:read',
  AI_CONFIG_UPDATE = 'ai:update',
}

/**
 * Role permissions mapping
 */
export const RolePermissions: Record<UserRole, Permission[]> = {
  OWNER: [
    // Full access to everything
    ...Object.values(Permission),
  ],

  ADMIN: [
    // User management (except delete)
    Permission.USER_CREATE,
    Permission.USER_READ,
    Permission.USER_UPDATE,

    // Full account management
    Permission.ACCOUNT_CREATE,
    Permission.ACCOUNT_READ,
    Permission.ACCOUNT_UPDATE,
    Permission.ACCOUNT_DELETE,

    // Full message access
    Permission.MESSAGE_READ,
    Permission.MESSAGE_SEND,
    Permission.MESSAGE_DELETE,

    // Full contact access
    Permission.CONTACT_READ,
    Permission.CONTACT_UPDATE,
    Permission.CONTACT_DELETE,

    // Full conversation access
    Permission.CONVERSATION_READ,
    Permission.CONVERSATION_ASSIGN,
    Permission.CONVERSATION_UPDATE,

    // Full automation access
    Permission.AUTOMATION_CREATE,
    Permission.AUTOMATION_READ,
    Permission.AUTOMATION_UPDATE,
    Permission.AUTOMATION_DELETE,

    // Full campaign access
    Permission.CAMPAIGN_CREATE,
    Permission.CAMPAIGN_READ,
    Permission.CAMPAIGN_UPDATE,
    Permission.CAMPAIGN_DELETE,

    // Analytics
    Permission.ANALYTICS_READ,

    // Settings
    Permission.SETTINGS_READ,
    Permission.SETTINGS_UPDATE,

    // AI Config
    Permission.AI_CONFIG_READ,
    Permission.AI_CONFIG_UPDATE,
  ],

  MANAGER: [
    // User read only
    Permission.USER_READ,

    // Account read
    Permission.ACCOUNT_READ,

    // Full message access
    Permission.MESSAGE_READ,
    Permission.MESSAGE_SEND,

    // Full contact access
    Permission.CONTACT_READ,
    Permission.CONTACT_UPDATE,

    // Full conversation access
    Permission.CONVERSATION_READ,
    Permission.CONVERSATION_ASSIGN,
    Permission.CONVERSATION_UPDATE,

    // Full automation access
    Permission.AUTOMATION_CREATE,
    Permission.AUTOMATION_READ,
    Permission.AUTOMATION_UPDATE,
    Permission.AUTOMATION_DELETE,

    // Full campaign access
    Permission.CAMPAIGN_CREATE,
    Permission.CAMPAIGN_READ,
    Permission.CAMPAIGN_UPDATE,
    Permission.CAMPAIGN_DELETE,

    // Analytics
    Permission.ANALYTICS_READ,

    // Settings read
    Permission.SETTINGS_READ,

    // AI Config read
    Permission.AI_CONFIG_READ,
  ],

  AGENT: [
    // Message access
    Permission.MESSAGE_READ,
    Permission.MESSAGE_SEND,

    // Contact read/update
    Permission.CONTACT_READ,
    Permission.CONTACT_UPDATE,

    // Conversation access
    Permission.CONVERSATION_READ,
    Permission.CONVERSATION_UPDATE,

    // Automation read
    Permission.AUTOMATION_READ,

    // Campaign read
    Permission.CAMPAIGN_READ,

    // Settings read
    Permission.SETTINGS_READ,
  ],

  VIEWER: [
    // Read-only access
    Permission.MESSAGE_READ,
    Permission.CONTACT_READ,
    Permission.CONVERSATION_READ,
    Permission.AUTOMATION_READ,
    Permission.CAMPAIGN_READ,
    Permission.ANALYTICS_READ,
    Permission.SETTINGS_READ,
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return RolePermissions[role].includes(permission);
}

/**
 * Check if a role has any of the given permissions
 */
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  const rolePermissions = RolePermissions[role];
  return permissions.some((permission) => rolePermissions.includes(permission));
}

/**
 * Check if a role has all of the given permissions
 */
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  const rolePermissions = RolePermissions[role];
  return permissions.every((permission) => rolePermissions.includes(permission));
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return RolePermissions[role];
}
