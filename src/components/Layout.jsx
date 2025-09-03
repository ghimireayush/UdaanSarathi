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
  LogOut,
  History
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { PERMISSIONS } from '../services/authService.js'
import logo from '../assets/logo.svg'

const Layout = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, hasPermission, hasAnyPermission, isAdmin } = useAuth()

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
      path: '/drafts', 
      label: 'Drafts', 
      icon: FileEdit,
      show: hasAnyPermission([PERMISSIONS.CREATE_JOB, PERMISSIONS.EDIT_JOB])
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
      path: '/auditlog', 
      label: 'Audit Log', 
      icon: History,
      show: hasPermission(PERMISSIONS.VIEW_AUDIT_LOGS) // Only show to users with audit log permission (admins)
    },
    { 
      path: '/settings', 
      label: 'Agency Settings', 
      icon: Settings,
      show: hasPermission(PERMISSIONS.MANAGE_SETTINGS)
    }

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      {/* Skip to content link for accessibility */}
      <a 
        href="#main-content" 
        className="absolute left-0 top-0 bg-brand-navy text-white px-4 py-2 rounded-br-md transform -translate-y-full focus:translate-y-0 transition-transform z-50"
      >
        Skip to main content
      </a>
      
      {/* Left Sidebar Navigation */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex flex-col flex-grow bg-white/80 backdrop-blur-sm border-r border-gray-200/50 pt-5 pb-4 overflow-y-auto shadow-lg">
          <div className="flex items-center flex-shrink-0 px-4 py-4">
            <Link to="/dashboard" className="w-full flex flex-col items-center focus:outline-none focus:ring-2 focus:ring-brand-blue-bright rounded p-2 hover:bg-white/50 transition-all duration-300">
              <img src={logo} alt="Udaan Sarathi Logo" className="w-16 h-16 object-contain drop-shadow-md" />
              <h1 className="text-lg font-bold text-brand-navy mt-3 text-center bg-gradient-to-r from-brand-navy to-brand-blue-bright bg-clip-text text-transparent">
                Udaan Sarathi
              </h1>
            </Link>
          </div>
          <div className="mt-5 flex-grow flex flex-col">
            <nav className="flex-1 px-2 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-300 ${
                      isActive(item.path)
                        ? 'bg-white shadow-md transform scale-105 border border-brand-blue-bright/30'
                        : 'text-gray-700 hover:bg-white/50 hover:text-brand-navy hover:shadow-sm border border-transparent'
                    }`}
                    aria-current={isActive(item.path) ? 'page' : undefined}
                  >
                    <Icon className={`mr-3 flex-shrink-0 h-5 w-5 ${isActive(item.path) ? 'text-brand-blue-bright' : 'text-gray-500 group-hover:text-brand-blue-bright'}`} aria-hidden="true" />
                    <span className={isActive(item.path) ? 'text-brand-navy font-semibold' : ''}>
                      {item.label}
                    </span>
                  </Link>
                )
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-200/50 p-4">
            <div className="flex items-center w-full bg-white/50 backdrop-blur-sm p-2 rounded-xl shadow-sm border border-gray-200/30">
              <div className="flex-shrink-0">
                <div className="w-9 h-9 bg-brand-green-vibrant/10 rounded-full flex items-center justify-center" role="img" aria-label="User avatar">
                  <User className="w-5 h-5 text-brand-green-vibrant" aria-hidden="true" />
                </div>
              </div>
              <div className="ml-3">
                {user && (
                  <>
                    <p className="text-sm font-medium text-gray-800">{user.name}</p>
                    <p className="text-xs font-medium text-gray-600 capitalize">{user.role}</p>
                  </>
                )}
              </div>
              <button 
                onClick={handleLogout}
                className="ml-auto flex-shrink-0 p-2 text-gray-500 hover:text-brand-navy hover:bg-white/50 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-brand-blue-bright"
                aria-label="Logout"
              >
                <LogOut className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu button */}
      <div className="md:hidden sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-200/50 shadow-md">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center">
            <button 
              className="p-2 text-gray-500 hover:text-brand-navy hover:bg-gray-50/50 rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-brand-blue-bright"
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
            <Link to="/dashboard" className="ml-2 flex flex-col items-center focus:outline-none focus:ring-2 focus:ring-brand-blue-bright rounded py-2 px-3">
              <img src={logo} alt="Udaan Sarathi Logo" className="w-10 h-10 object-contain drop-shadow-md" />
              <h1 className="text-sm font-bold text-brand-navy mt-1 text-center bg-gradient-to-r from-brand-navy to-brand-blue-bright bg-clip-text text-transparent">
                Udaan Sarathi
              </h1>
            </Link>
          </div>
          <button 
            className="p-2 text-gray-500 hover:text-brand-navy hover:bg-gray-50/50 rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-brand-blue-bright"
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
            className="mobile-nav-backdrop md:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={closeMobileMenu}
            aria-hidden="true"
          ></div>
          
          {/* Mobile menu */}
          <div 
            id="mobile-menu"
            className="md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white/90 backdrop-blur-lg border-r border-gray-200/50 overflow-y-auto shadow-xl"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="mobile-menu-button"
          >
            <div className="pt-5 pb-4">
              <div className="flex items-center px-4">
                <Link to="/dashboard" className="focus:outline-none focus:ring-2 focus:ring-brand-blue-bright rounded">
                  <h1 className="text-xl font-bold text-brand-navy bg-gradient-to-r from-brand-navy to-brand-blue-bright bg-clip-text text-transparent">
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
                      className={`group flex items-center px-2 py-3 text-base font-medium rounded-lg transition-all duration-300 touch-target ${
                        isActive(item.path)
                          ? 'bg-white shadow-md border border-brand-blue-bright/30 text-brand-navy font-semibold'
                          : 'text-gray-700 hover:bg-white/50 hover:text-brand-navy border border-transparent'
                      }`}
                      role="menuitem"
                      aria-current={isActive(item.path) ? 'page' : undefined}
                    >
                      <Icon className={`mr-3 flex-shrink-0 h-6 w-6 ${isActive(item.path) ? 'text-brand-blue-bright' : 'text-gray-500 group-hover:text-brand-blue-bright'}`} aria-hidden="true" />
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
                    className="group flex items-center px-2 py-3 text-base font-medium rounded-lg transition-all duration-300 touch-target text-gray-700 hover:bg-white/50 hover:text-brand-navy border border-transparent w-full text-left mt-2"
                    role="menuitem"
                  >
                    <LogOut className="mr-3 flex-shrink-0 h-6 w-6 text-gray-500 group-hover:text-brand-blue-bright" aria-hidden="true" />
                    <span>Logout</span>
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