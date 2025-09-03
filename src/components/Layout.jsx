import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  BarChart3, 
  Briefcase, 
  Users, 
  Calendar, 
  GitBranch, 
  FileEdit, 
  Settings,
  Bell,
  User,
  Menu,
  X,
  LogOut
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { PERMISSIONS } from '../services/authService.js'

const Layout = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, hasPermission, hasAnyPermission } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = [
    { 
      path: '/dashboard', 
      label: 'Dashboard', 
      icon: BarChart3,
      show: true // Dashboard is always accessible
    },
    { 
      path: '/jobs', 
      label: 'Jobs', 
      icon: Briefcase,
      show: hasPermission(PERMISSIONS.VIEW_JOBS)
    },
    { 
      path: '/applications', 
      label: 'Applications', 
      icon: Users,
      show: hasPermission(PERMISSIONS.VIEW_APPLICATIONS)
    },
    { 
      path: '/interviews', 
      label: 'Interviews', 
      icon: Calendar,
      show: hasAnyPermission([PERMISSIONS.VIEW_INTERVIEWS, PERMISSIONS.SCHEDULE_INTERVIEW])
    },
    { 
      path: '/workflow', 
      label: 'Workflow', 
      icon: GitBranch,
      show: hasPermission(PERMISSIONS.VIEW_WORKFLOW)
    },
    { 
      path: '/drafts', 
      label: 'Drafts', 
      icon: FileEdit,
      show: hasAnyPermission([PERMISSIONS.CREATE_JOB, PERMISSIONS.EDIT_JOB])
    },
    { 
      path: '/settings', 
      label: 'Agency Settings', 
      icon: Settings,
      show: hasPermission(PERMISSIONS.MANAGE_SETTINGS)
    },

  ].filter(item => item.show)

  const isActive = (path) => {
    if (path === '/dashboard' && location.pathname === '/') return true
    return location.pathname.startsWith(path)
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Skip to content link for accessibility */}
      <a 
        href="#main-content" 
        className="absolute left-0 top-0 bg-primary-600 text-white px-4 py-2 rounded-br-md transform -translate-y-full focus:translate-y-0 transition-transform z-50"
      >
        Skip to main content
      </a>
      
      {/* Left Sidebar Navigation */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <Link to="/dashboard" className="focus:outline-none focus:ring-2 focus:ring-primary-500 rounded">
              <h1 className="text-xl font-bold text-primary-600">
                Udaan Sarathi
              </h1>
            </Link>
          </div>
          <div className="mt-5 flex-grow flex flex-col">
            <nav className="flex-1 px-2 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200 touch-target ${
                      isActive(item.path)
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    aria-current={isActive(item.path) ? 'page' : undefined}
                  >
                    <Icon className="mr-3 flex-shrink-0 h-5 w-5" aria-hidden="true" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center" role="img" aria-label="User avatar">
                  <User className="w-5 h-5 text-primary-600" aria-hidden="true" />
                </div>
              </div>
              <div className="ml-3">
                {user && (
                  <>
                    <p className="text-sm font-medium text-gray-700">{user.name}</p>
                    <p className="text-xs font-medium text-gray-500 capitalize">{user.role}</p>
                  </>
                )}
              </div>
              <button 
                onClick={handleLogout}
                className="ml-auto flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 focus:text-gray-600 transition-colors touch-target"
                aria-label="Logout"
              >
                <LogOut className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu button */}
      <div className="md:hidden sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center">
            <button 
              className="p-2 text-gray-400 hover:text-gray-600 focus:text-gray-600 transition-colors touch-target"
              onClick={toggleMobileMenu}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label="Toggle main menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" aria-hidden="true" />
              ) : (
                <Menu className="w-6 h-6" aria-hidden="true" />
              )}
            </button>
            <Link to="/dashboard" className="ml-2 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded">
              <h1 className="text-lg font-bold text-primary-600">
                Udaan Sarathi
              </h1>
            </Link>
          </div>
          <button 
            className="p-2 text-gray-400 hover:text-gray-600 focus:text-gray-600 transition-colors touch-target"
            aria-label="View notifications"
          >
            <Bell className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Mobile navigation menu */}
      {mobileMenuOpen && (
        <>
          {/* Mobile menu backdrop */}
          <div 
            className="mobile-nav-backdrop md:hidden fixed inset-0 z-40"
            onClick={closeMobileMenu}
            aria-hidden="true"
          ></div>
          
          {/* Mobile menu */}
          <div 
            id="mobile-menu"
            className="md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 overflow-y-auto"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="mobile-menu-button"
          >
            <div className="pt-5 pb-4">
              <div className="flex items-center px-4">
                <Link to="/dashboard" className="focus:outline-none focus:ring-2 focus:ring-primary-500 rounded">
                  <h1 className="text-xl font-bold text-primary-600">
                    Udaan Sarathi
                  </h1>
                </Link>
              </div>
              <nav className="mt-5 px-2 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={closeMobileMenu}
                      className={`group flex items-center px-2 py-2 text-base font-medium rounded-md transition-colors duration-200 touch-target ${
                        isActive(item.path)
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                      role="menuitem"
                      aria-current={isActive(item.path) ? 'page' : undefined}
                    >
                      <Icon className="mr-3 flex-shrink-0 h-6 w-6" aria-hidden="true" />
                      {item.label}
                    </Link>
                  )
                })}
                {user && (
                  <button
                    onClick={() => {
                      handleLogout()
                      closeMobileMenu()
                    }}
                    className="group flex items-center px-2 py-2 text-base font-medium rounded-md transition-colors duration-200 touch-target text-gray-600 hover:bg-gray-50 hover:text-gray-900 w-full text-left"
                    role="menuitem"
                  >
                    <LogOut className="mr-3 flex-shrink-0 h-6 w-6" aria-hidden="true" />
                    Logout
                  </button>
                )}
              </nav>
            </div>
          </div>
        </>
      )}

      {/* Main content */}
      <main id="main-content" className="flex-1 md:pl-64" role="main">
        {children}
      </main>
    </div>
  )
}

export default Layout