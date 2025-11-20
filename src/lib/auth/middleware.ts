/**
 * =============================================================================
 * AUTH MIDDLEWARE
 * =============================================================================
 * Middleware for authentication and authorization
 * =============================================================================
 */

import { getServerSession } from 'next-auth/next';
import { authOptions } from './nextauth.config';
import { Permission, hasPermission } from './permissions';
import { AuthenticationError, AuthorizationError } from '@/lib/utils/errors';
import { UserRole } from '@prisma/client';

/**
 * Get current session or throw error
 */
export async function requireAuth() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    throw new AuthenticationError('You must be logged in');
  }

  return session;
}

/**
 * Require specific permission
 */
export async function requirePermission(permission: Permission) {
  const session = await requireAuth();
  const userRole = session.user.role as UserRole;

  if (!hasPermission(userRole, permission)) {
    throw new AuthorizationError(
      `You don't have permission to perform this action. Required: ${permission}`
    );
  }

  return session;
}

/**
 * Require any of the given permissions
 */
export async function requireAnyPermission(permissions: Permission[]) {
  const session = await requireAuth();
  const userRole = session.user.role as UserRole;

  const hasAny = permissions.some((permission) => hasPermission(userRole, permission));

  if (!hasAny) {
    throw new AuthorizationError(
      `You don't have permission to perform this action. Required one of: ${permissions.join(', ')}`
    );
  }

  return session;
}

/**
 * Require all of the given permissions
 */
export async function requireAllPermissions(permissions: Permission[]) {
  const session = await requireAuth();
  const userRole = session.user.role as UserRole;

  const hasAll = permissions.every((permission) => hasPermission(userRole, permission));

  if (!hasAll) {
    throw new AuthorizationError(
      `You don't have permission to perform this action. Required all: ${permissions.join(', ')}`
    );
  }

  return session;
}

/**
 * Require specific role
 */
export async function requireRole(role: UserRole) {
  const session = await requireAuth();

  if (session.user.role !== role) {
    throw new AuthorizationError(`This action requires ${role} role`);
  }

  return session;
}

/**
 * Require minimum role level
 * Owner > Admin > Manager > Agent > Viewer
 */
export async function requireMinRole(minRole: UserRole) {
  const session = await requireAuth();
  const userRole = session.user.role as UserRole;

  const roleLevels: Record<UserRole, number> = {
    OWNER: 5,
    ADMIN: 4,
    MANAGER: 3,
    AGENT: 2,
    VIEWER: 1,
  };

  if (roleLevels[userRole] < roleLevels[minRole]) {
    throw new AuthorizationError(`This action requires at least ${minRole} role`);
  }

  return session;
}
