import React from 'react'
import authService from '../services/authService.js'
import { AlertCircle, Lock } from 'lucide-react'

/**
 * Permission Guard Component
 * Conditionally renders children based on user permissions
 */
const PermissionGuard = ({ 
  permission, 
  permissions = [], 
  role, 
  roles = [],
  requireAll = false,
  fallback = null,
  showFallback = true,
  children 
}) => {
  // Check single permission
  if (permission && !authService.hasPermission(permission)) {
    return showFallback ? (fallback || <PermissionDenied />) : null
  }

  // Check multiple permissions
  if (permissions.length > 0) {
    const hasPermissions = requireAll 
      ? authService.hasAllPermissions(permissions)
      : authService.hasAnyPermission(permissions)
    
    if (!hasPermissions) {
      return showFallback ? (fallback || <PermissionDenied />) : null
    }
  }

  // Check single role
  if (role && !authService.hasRole(role)) {
    return showFallback ? (fallback || <PermissionDenied />) : null
  }

  // Check multiple roles
  if (roles.length > 0) {
    const hasRole = roles.some(r => authService.hasRole(r))
    if (!hasRole) {
      return showFallback ? (fallback || <PermissionDenied />) : null
    }
  }

  // User has required permissions/roles
  return children
}

/**
 * Default Permission Denied Component
 */
const PermissionDenied = ({ message = "You don't have permission to access this feature." }) => (
  <div className="flex items-center justify-center p-8">
    <div className="text-center max-w-md">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Lock className="w-8 h-8 text-red-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
      <p className="text-gray-600 mb-4">{message}</p>
      <div className="flex items-center justify-center text-sm text-red-600">
        <AlertCircle className="w-4 h-4 mr-1" />
        <span>Contact your administrator for access</span>
      </div>
    </div>
  </div>
)

/**
 * Hook for checking permissions in components
 */
export const usePermissions = () => {
  const currentUser = authService.getCurrentUser()
  const userRole = authService.getUserRole()
  const userPermissions = authService.getUserPermissions(userRole)

  return {
    user: currentUser,
    role: userRole,
    permissions: userPermissions,
    hasPermission: (permission) => authService.hasPermission(permission),
    hasAnyPermission: (permissions) => authService.hasAnyPermission(permissions),
    hasAllPermissions: (permissions) => authService.hasAllPermissions(permissions),
    hasRole: (role) => authService.hasRole(role),
    isAdmin: () => authService.isAdmin(),
    isRecruiter: () => authService.isRecruiter(),
    isCoordinator: () => authService.isCoordinator()
  }
}

/**
 * Higher-order component for permission-based rendering
 */
export const withPermissions = (Component, requiredPermissions = []) => {
  return function PermissionWrappedComponent(props) {
    return (
      <PermissionGuard permissions={requiredPermissions}>
        <Component {...props} />
      </PermissionGuard>
    )
  }
}

/**
 * Button component with permission checking
 */
export const PermissionButton = ({ 
  permission, 
  permissions = [], 
  role,
  roles = [],
  requireAll = false,
  disabled = false,
  disabledMessage = "You don't have permission for this action",
  children,
  ...buttonProps 
}) => {
  const hasAccess = React.useMemo(() => {
    if (permission && !authService.hasPermission(permission)) return false
    if (permissions.length > 0) {
      return requireAll 
        ? authService.hasAllPermissions(permissions)
        : authService.hasAnyPermission(permissions)
    }
    if (role && !authService.hasRole(role)) return false
    if (roles.length > 0) {
      return roles.some(r => authService.hasRole(r))
    }
    return true
  }, [permission, permissions, role, roles, requireAll])

  const isDisabled = disabled || !hasAccess

  return (
    <button
      {...buttonProps}
      disabled={isDisabled}
      title={!hasAccess ? disabledMessage : buttonProps.title}
      className={`${buttonProps.className || ''} ${
        !hasAccess ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {children}
    </button>
  )
}

/**
 * Link component with permission checking
 */
export const PermissionLink = ({ 
  permission, 
  permissions = [], 
  role,
  roles = [],
  requireAll = false,
  fallback = null,
  children,
  ...linkProps 
}) => {
  const hasAccess = React.useMemo(() => {
    if (permission && !authService.hasPermission(permission)) return false
    if (permissions.length > 0) {
      return requireAll 
        ? authService.hasAllPermissions(permissions)
        : authService.hasAnyPermission(permissions)
    }
    if (role && !authService.hasRole(role)) return false
    if (roles.length > 0) {
      return roles.some(r => authService.hasRole(r))
    }
    return true
  }, [permission, permissions, role, roles, requireAll])

  if (!hasAccess) {
    return fallback || <span className="text-gray-400 cursor-not-allowed">{children}</span>
  }

  return (
    <a {...linkProps}>
      {children}
    </a>
  )
}

/**
 * Role Badge Component
 */
export const RoleBadge = ({ role, className = '' }) => {
  const roleConfig = {
    admin: { 
      label: 'Admin', 
      className: 'bg-red-100 text-red-800 border-red-200' 
    },
    recruiter: { 
      label: 'Recruiter', 
      className: 'bg-blue-100 text-blue-800 border-blue-200' 
    },
    coordinator: { 
      label: 'Coordinator', 
      className: 'bg-green-100 text-green-800 border-green-200' 
    }
  }

  const config = roleConfig[role] || { 
    label: role, 
    className: 'bg-gray-100 text-gray-800 border-gray-200' 
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className} ${className}`}>
      {config.label}
    </span>
  )
}

export default PermissionGuard