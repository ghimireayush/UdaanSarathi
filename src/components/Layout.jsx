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
import { useUser } from '../contexts/UserContext'

const Layout = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useUser()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { path: '/jobs', label: 'Jobs', icon: Briefcase },
    { path: '/applications', label: 'Applications', icon: Users },
    { path: '/interviews', label: 'Interviews', icon: Calendar },
    { path: '/workflow', label: 'Workflow', icon: GitBranch },
    { path: '/drafts', label: 'Drafts', icon: FileEdit },
    { path: '/settings', label: 'Agency Settings', icon: Settings },
  ]

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
    <div className="min-h-screen bg-gray-50">
      {/* Skip to content link for accessibility */}
      <a 
        href="#main-content" 
        className="skip-to-content"
        onFocus={(e) => e.target.classList.remove('-translate-y-full')}
        onBlur={(e) => e.target.classList.add('-translate-y-full')}
      >
        Skip to main content
      </a>
      
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200" role="navigation" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and main nav */}
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/dashboard" className="focus:outline-none focus:ring-2 focus:ring-primary-500 rounded">
                  <h1 className="text-xl font-bold text-primary-600">
                    Udaan Sarathi
                  </h1>
                </Link>
              </div>
              
              {/* Desktop Navigation */}
              <div className="hidden lg:ml-8 lg:flex lg:space-x-8">
                {navItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200 touch-target ${
                        isActive(item.path)
                          ? 'border-primary-500 text-primary-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 focus:text-gray-700 focus:border-gray-300'
                      }`}
                      aria-current={isActive(item.path) ? 'page' : undefined}
                    >
                      <Icon className="w-4 h-4 mr-2" aria-hidden="true" />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Right side - notifications and user */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Mobile menu button */}
              <button 
                className="lg:hidden p-2 text-gray-400 hover:text-gray-600 focus:text-gray-600 transition-colors touch-target"
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
              
              <button 
                className="p-2 text-gray-400 hover:text-gray-600 focus:text-gray-600 transition-colors touch-target"
                aria-label="View notifications"
              >
                <Bell className="w-5 h-5" aria-hidden="true" />
              </button>
              
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center" role="img" aria-label="User avatar">
                  <User className="w-5 h-5 text-primary-600" aria-hidden="true" />
                </div>
                {user && (
                  <div className="hidden md:block">
                    <div className="text-sm text-gray-700 font-medium">{user.name}</div>
                    <div className="text-xs text-gray-500 capitalize">{user.role}</div>
                  </div>
                )}
                <button 
                  onClick={handleLogout}
                  className="hidden md:flex p-2 text-gray-400 hover:text-gray-600 focus:text-gray-600 transition-colors touch-target"
                  aria-label="Logout"
                >
                  <LogOut className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile navigation menu */}
        {mobileMenuOpen && (
          <>
            {/* Mobile menu backdrop */}
            <div 
              className="mobile-nav-backdrop lg:hidden"
              onClick={closeMobileMenu}
              aria-hidden="true"
            ></div>
            
            {/* Mobile menu */}
            <div 
              id="mobile-menu"
              className="lg:hidden bg-white border-t border-gray-200"
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="mobile-menu-button"
            >
              <div className="pt-2 pb-3 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={closeMobileMenu}
                      className={`flex items-center pl-3 pr-4 py-3 border-l-4 text-base font-medium transition-colors duration-200 touch-target ${
                        isActive(item.path)
                          ? 'bg-primary-50 border-primary-500 text-primary-700'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 hover:border-gray-300 focus:text-gray-700 focus:bg-gray-50 focus:border-gray-300'
                      }`}
                      role="menuitem"
                      aria-current={isActive(item.path) ? 'page' : undefined}
                    >
                      <Icon className="w-5 h-5 mr-3" aria-hidden="true" />
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
                    className="flex items-center pl-3 pr-4 py-3 border-l-4 text-base font-medium transition-colors duration-200 touch-target border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 hover:border-gray-300 focus:text-gray-700 focus:bg-gray-50 focus:border-gray-300 w-full text-left"
                    role="menuitem"
                  >
                    <LogOut className="w-5 h-5 mr-3" aria-hidden="true" />
                    Logout
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </nav>

      {/* Main content */}
      <main id="main-content" className="flex-1" role="main">
        {children}
      </main>
    </div>
  )
}

export default Layout