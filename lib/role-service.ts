import AsyncStorage from '@react-native-async-storage/async-storage';

export enum UserRole {
  OPERATOR = 'operator',
  SUPERVISOR = 'supervisor',
  ADMIN = 'admin',
}

export interface UserPermissions {
  canDownloadData: boolean;
  canMarkAttendance: boolean;
  canVerifyBiometric: boolean;
  canSyncData: boolean;
  canViewReports: boolean;
  canManageOperators: boolean;
  canViewAuditLogs: boolean;
  canManageRoles: boolean;
  canConfigureSettings: boolean;
  canExportData: boolean;
}

export interface User {
  id: string;
  operatorId: string;
  name: string;
  email?: string;
  role: UserRole;
  permissions: UserPermissions;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

const ROLE_PERMISSIONS: Record<UserRole, UserPermissions> = {
  [UserRole.OPERATOR]: {
    canDownloadData: true,
    canMarkAttendance: true,
    canVerifyBiometric: true,
    canSyncData: true,
    canViewReports: false,
    canManageOperators: false,
    canViewAuditLogs: false,
    canManageRoles: false,
    canConfigureSettings: false,
    canExportData: false,
  },
  [UserRole.SUPERVISOR]: {
    canDownloadData: true,
    canMarkAttendance: false,
    canVerifyBiometric: false,
    canSyncData: true,
    canViewReports: true,
    canManageOperators: true,
    canViewAuditLogs: true,
    canManageRoles: false,
    canConfigureSettings: false,
    canExportData: true,
  },
  [UserRole.ADMIN]: {
    canDownloadData: true,
    canMarkAttendance: true,
    canVerifyBiometric: true,
    canSyncData: true,
    canViewReports: true,
    canManageOperators: true,
    canViewAuditLogs: true,
    canManageRoles: true,
    canConfigureSettings: true,
    canExportData: true,
  },
};

class RoleService {
  private currentUser: User | null = null;

  /**
   * Initialize role service
   */
  async initialize(): Promise<void> {
    try {
      const userJson = await AsyncStorage.getItem('current_user');
      if (userJson) {
        this.currentUser = JSON.parse(userJson);
      }
    } catch (error) {
      console.error('Role service initialization error:', error);
    }
  }

  /**
   * Set current user
   */
  async setCurrentUser(user: User): Promise<void> {
    try {
      this.currentUser = user;
      await AsyncStorage.setItem('current_user', JSON.stringify(user));
    } catch (error) {
      console.error('Error setting current user:', error);
      throw error;
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Get user role
   */
  getUserRole(): UserRole | null {
    return this.currentUser?.role || null;
  }

  /**
   * Get user permissions
   */
  getUserPermissions(): UserPermissions | null {
    if (!this.currentUser) return null;
    return ROLE_PERMISSIONS[this.currentUser.role];
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission: keyof UserPermissions): boolean {
    if (!this.currentUser) return false;

    const permissions = ROLE_PERMISSIONS[this.currentUser.role];
    return permissions[permission] || false;
  }

  /**
   * Check if user has role
   */
  hasRole(role: UserRole): boolean {
    return this.currentUser?.role === role;
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roles: UserRole[]): boolean {
    if (!this.currentUser) return false;
    return roles.includes(this.currentUser.role);
  }

  /**
   * Check if user has all of the specified permissions
   */
  hasAllPermissions(permissions: (keyof UserPermissions)[]): boolean {
    return permissions.every((permission) => this.hasPermission(permission));
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(permissions: (keyof UserPermissions)[]): boolean {
    return permissions.some((permission) => this.hasPermission(permission));
  }

  /**
   * Get role description
   */
  getRoleDescription(role: UserRole): string {
    const descriptions: Record<UserRole, string> = {
      [UserRole.OPERATOR]: 'Exam Operator - Can mark attendance and verify biometric data',
      [UserRole.SUPERVISOR]: 'Supervisor - Can manage operators and view reports',
      [UserRole.ADMIN]: 'Administrator - Full access to all features',
    };

    return descriptions[role];
  }

  /**
   * Get available roles
   */
  getAvailableRoles(): UserRole[] {
    return Object.values(UserRole);
  }

  /**
   * Get permissions for role
   */
  getPermissionsForRole(role: UserRole): UserPermissions {
    return ROLE_PERMISSIONS[role];
  }

  /**
   * Create user with role
   */
  createUser(userData: Omit<User, 'permissions'>): User {
    return {
      ...userData,
      permissions: ROLE_PERMISSIONS[userData.role],
    };
  }

  /**
   * Update user role
   */
  async updateUserRole(userId: string, newRole: UserRole): Promise<void> {
    if (this.currentUser && this.currentUser.id === userId) {
      this.currentUser.role = newRole;
      this.currentUser.permissions = ROLE_PERMISSIONS[newRole];
      await AsyncStorage.setItem('current_user', JSON.stringify(this.currentUser));
    }
  }

  /**
   * Check if user is operator
   */
  isOperator(): boolean {
    return this.currentUser?.role === UserRole.OPERATOR;
  }

  /**
   * Check if user is supervisor
   */
  isSupervisor(): boolean {
    return this.currentUser?.role === UserRole.SUPERVISOR;
  }

  /**
   * Check if user is admin
   */
  isAdmin(): boolean {
    return this.currentUser?.role === UserRole.ADMIN;
  }

  /**
   * Check if user is active
   */
  isUserActive(): boolean {
    return this.currentUser?.isActive || false;
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      this.currentUser = null;
      await AsyncStorage.removeItem('current_user');
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  }

  /**
   * Get role hierarchy (higher role has more permissions)
   */
  getRoleHierarchy(): Record<UserRole, number> {
    return {
      [UserRole.OPERATOR]: 1,
      [UserRole.SUPERVISOR]: 2,
      [UserRole.ADMIN]: 3,
    };
  }

  /**
   * Check if user role is higher than another role
   */
  isRoleHigherThan(role1: UserRole, role2: UserRole): boolean {
    const hierarchy = this.getRoleHierarchy();
    return hierarchy[role1] > hierarchy[role2];
  }

  /**
   * Get all users with specific role (mock - would come from API)
   */
  async getUsersByRole(role: UserRole): Promise<User[]> {
    // This would typically fetch from an API
    // For now, return empty array
    return [];
  }

  /**
   * Validate user permissions for action
   */
  validatePermissionForAction(action: string): boolean {
    const actionPermissionMap: Record<string, keyof UserPermissions> = {
      'download-data': 'canDownloadData',
      'mark-attendance': 'canMarkAttendance',
      'verify-biometric': 'canVerifyBiometric',
      'sync-data': 'canSyncData',
      'view-reports': 'canViewReports',
      'manage-operators': 'canManageOperators',
      'view-audit-logs': 'canViewAuditLogs',
      'manage-roles': 'canManageRoles',
      'configure-settings': 'canConfigureSettings',
      'export-data': 'canExportData',
    };

    const permission = actionPermissionMap[action];
    if (!permission) {
      console.warn(`Unknown action: ${action}`);
      return false;
    }

    return this.hasPermission(permission);
  }
}

export const roleService = new RoleService();
