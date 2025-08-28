import { useState, useEffect } from 'react'
import { 
  Save,
  Upload,
  MapPin,
  Phone,
  Mail,
  Globe,
  Calendar,
  FileText,
  Camera,
  AlertCircle,
  Check,
  Building,
  CreditCard
} from 'lucide-react'
import { agencyService } from '../services/index.js'

const AgencySettings = () => {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    license_number: '',
    established_year: '',
    logo_url: ''
  })
  const [settings, setSettings] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Fetch agency settings using service
  useEffect(() => {
    const fetchAgencySettings = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const agencyData = await agencyService.getAgencyProfile()
        setSettings(agencyData)
        setFormData(agencyData)
      } catch (err) {
        console.error('Failed to fetch agency settings:', err)
        setError(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAgencySettings()
  }, [])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setSaveSuccess(false)
      
      const updatedSettings = await agencyService.updateAgencyProfile(formData)
      setSettings(updatedSettings)
      setIsEditing(false)
      setSaveSuccess(true)
      
      // Hide success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      console.error('Failed to update settings:', error)
      setError(error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData(settings)
    setIsEditing(false)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="card p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i}>
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load settings</h2>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agency Settings</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your agency profile and business information
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex space-x-3">
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="btn-primary disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="btn-primary"
            >
              Edit Settings
            </button>
          )}
        </div>
      </div>

      {/* Success Message */}
      {saveSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <Check className="w-5 h-5 text-green-600 mr-2" />
            <span className="text-sm font-medium text-green-900">
              Settings updated successfully!
            </span>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Agency Logo */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Agency Logo</h2>
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
              {formData.logo_url ? (
                <img 
                  src={formData.logo_url} 
                  alt="Agency Logo" 
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <Building className="w-8 h-8 text-gray-400" />
              )}
            </div>
            
            {isEditing ? (
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <input
                    type="url"
                    value={formData.logo_url}
                    onChange={(e) => handleInputChange('logo_url', e.target.value)}
                    placeholder="Enter logo URL"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <button className="btn-secondary flex items-center">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Recommended size: 200x200 pixels, PNG or JPG format
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-gray-900">{formData.name || 'Agency Name'}</p>
                <p className="text-sm text-gray-600">Current logo</p>
              </div>
            )}
          </div>
        </div>

        {/* Basic Information */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Agency Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter agency name"
                />
              ) : (
                <p className="px-3 py-2 bg-gray-50 rounded-md">{formData.name || 'Not set'}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                License Number
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.license_number}
                  onChange={(e) => handleInputChange('license_number', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter license number"
                />
              ) : (
                <p className="px-3 py-2 bg-gray-50 rounded-md">{formData.license_number || 'Not set'}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Established Year
              </label>
              {isEditing ? (
                <input
                  type="number"
                  value={formData.established_year}
                  onChange={(e) => handleInputChange('established_year', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="YYYY"
                  min="1900"
                  max={new Date().getFullYear()}
                />
              ) : (
                <p className="px-3 py-2 bg-gray-50 rounded-md">{formData.established_year || 'Not set'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                <Phone className="w-4 h-4 mr-2" />
                Phone Number
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter phone number"
                />
              ) : (
                <p className="px-3 py-2 bg-gray-50 rounded-md">{formData.phone || 'Not set'}</p>
              )}
            </div>
            
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                <Mail className="w-4 h-4 mr-2" />
                Email Address
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter email address"
                />
              ) : (
                <p className="px-3 py-2 bg-gray-50 rounded-md">{formData.email || 'Not set'}</p>
              )}
            </div>
            
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                <Globe className="w-4 h-4 mr-2" />
                Website
              </label>
              {isEditing ? (
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="https://www.example.com"
                />
              ) : (
                <p className="px-3 py-2 bg-gray-50 rounded-md">
                  {formData.website ? (
                    <a href={formData.website} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-800">
                      {formData.website}
                    </a>
                  ) : (
                    'Not set'
                  )}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Address</h2>
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
              <MapPin className="w-4 h-4 mr-2" />
              Full Address
            </label>
            {isEditing ? (
              <textarea
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter complete address"
              />
            ) : (
              <p className="px-3 py-2 bg-gray-50 rounded-md whitespace-pre-wrap">
                {formData.address || 'Not set'}
              </p>
            )}
          </div>
        </div>

        {/* System Information */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">System Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <label className="flex items-center text-gray-700 mb-1">
                <CreditCard className="w-4 h-4 mr-2" />
                Account Type
              </label>
              <p className="px-3 py-2 bg-gray-50 rounded-md">Premium Agency</p>
            </div>
            
            <div>
              <label className="flex items-center text-gray-700 mb-1">
                <Calendar className="w-4 h-4 mr-2" />
                Last Updated
              </label>
              <p className="px-3 py-2 bg-gray-50 rounded-md">
                {new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            
            <div>
              <label className="flex items-center text-gray-700 mb-1">
                <FileText className="w-4 h-4 mr-2" />
                Data Export
              </label>
              <button className="text-primary-600 hover:text-primary-800 text-sm">
                Download Agency Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AgencySettings