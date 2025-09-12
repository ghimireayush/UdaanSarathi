import React, { useState, useEffect } from 'react'
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Camera,
  Upload,
  Save,
  X,
  Edit,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  Settings,
  Users,
  Clock,
  Award,
  Target,
  Briefcase,
  History
} from 'lucide-react'
import { agencyService, auditService } from '../services/index.js'
import AuditLog from './AuditLog'

const AgencySettings = () => {
  const [activeTab, setActiveTab] = useState('basic')
  const [agencyData, setAgencyData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [editingSection, setEditingSection] = useState(null)
  const [formData, setFormData] = useState({})
  const [currentUser] = useState({
    id: 'user_001',
    name: 'Current User',
    email: 'user@agency.com'
  }) // In real app, get from auth context

  // Fetch agency data
  useEffect(() => {
    const fetchAgencyData = async () => {
      try {
        setIsLoading(true)
        const data = await agencyService.getAgencyProfile()
        setAgencyData(data)
      } catch (err) {
        setError('Failed to load agency data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAgencyData()
  }, [])

  // Handle form field changes
  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Start editing a section
  const startEditing = (section, initialData = {}) => {
    setEditingSection(section)
    setFormData(initialData)
    setError(null)
    setSuccess(null)
  }

  // Cancel editing
  const cancelEditing = () => {
    setEditingSection(null)
    setFormData({})
  }

  // Save changes
  const saveChanges = async (section) => {
    try {
      setSaving(true)
      setError(null)

      const auditInfo = { user: currentUser }
      
      let updatedData
      switch (section) {
        case 'basic':
          updatedData = await agencyService.updateBasicInfo(formData, auditInfo)
          break
        case 'contact':
          updatedData = await agencyService.updateContactInfo(formData, auditInfo)
          break
        case 'social':
          updatedData = await agencyService.updateSocialMedia(formData, auditInfo)
          break
        case 'settings':
          updatedData = await agencyService.updateSettings(formData, auditInfo)
          break
        case 'hours':
          updatedData = await agencyService.updateOperatingHours(formData, auditInfo)
          break
        case 'services':
          updatedData = await agencyService.updateServices(formData.services || [], auditInfo)
          break
        case 'countries':
          updatedData = await agencyService.updateTargetCountries(formData.countries || [], auditInfo)
          break
        case 'specializations':
          updatedData = await agencyService.updateSpecializations(formData.specializations || [], auditInfo)
          break
        default:
          updatedData = await agencyService.updateAgencyProfile(formData, auditInfo)
      }

      setAgencyData(updatedData)
      setEditingSection(null)
      setFormData({})
      setSuccess('Changes saved successfully!')
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  // Handle file upload
  const handleFileUpload = async (file, type) => {
    try {
      setSaving(true)
      setError(null)

      const auditInfo = { user: currentUser }
      
      let updatedData
      if (type === 'logo') {
        updatedData = await agencyService.uploadLogo(file, auditInfo)
      } else if (type === 'banner') {
        updatedData = await agencyService.uploadBanner(file, auditInfo)
      }

      setAgencyData(updatedData)
      setSuccess(`${type === 'logo' ? 'Logo' : 'Banner'} updated successfully!`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(`Failed to upload ${type}`)
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="card p-6">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i}>
                      <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                      <div className="h-10 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <div className="card p-6">
                <div className="h-32 bg-gray-200 rounded mb-4"></div>
                <div className="h-6 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: Building2 },
    { id: 'contact', label: 'Contact', icon: Phone },
    { id: 'location', label: 'Location', icon: MapPin },
    { id: 'media', label: 'Images', icon: Camera },
    { id: 'social', label: 'Social Media', icon: Globe },
    { id: 'services', label: 'Services', icon: Briefcase },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'audit', label: 'Audit Log', icon: History }
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Agency Settings</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your agency profile, contact information, and preferences
        </p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            <p className="text-green-800">{success}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {activeTab === 'basic' && (
            <BasicInfoSection
              data={agencyData}
              isEditing={editingSection === 'basic'}
              formData={formData}
              onFormChange={handleFormChange}
              onStartEdit={() => startEditing('basic', {
                name: agencyData.name,
                description: agencyData.description,
                established_year: agencyData.established_year,
                license_number: agencyData.license_number
              })}
              onSave={() => saveChanges('basic')}
              onCancel={cancelEditing}
              isSaving={isSaving}
            />
          )}

          {activeTab === 'contact' && (
            <ContactSection
              data={agencyData}
              isEditing={editingSection === 'contact'}
              formData={formData}
              onFormChange={handleFormChange}
              onStartEdit={() => startEditing('contact', {
                phone: agencyData.phone,
                mobile: agencyData.mobile,
                email: agencyData.email,
                website: agencyData.website
              })}
              onSave={() => saveChanges('contact')}
              onCancel={cancelEditing}
              isSaving={isSaving}
            />
          )}

          {activeTab === 'location' && (
            <LocationSection
              data={agencyData}
              isEditing={editingSection === 'location'}
              formData={formData}
              onFormChange={handleFormChange}
              onStartEdit={() => startEditing('location', {
                address: agencyData.address
              })}
              onSave={() => saveChanges('basic')}
              onCancel={cancelEditing}
              isSaving={isSaving}
            />
          )}

          {activeTab === 'media' && (
            <MediaSection
              data={agencyData}
              onFileUpload={handleFileUpload}
              isSaving={isSaving}
            />
          )}

          {activeTab === 'social' && (
            <SocialMediaSection
              data={agencyData}
              isEditing={editingSection === 'social'}
              formData={formData}
              onFormChange={handleFormChange}
              onStartEdit={() => startEditing('social', agencyData.social_media || {})}
              onSave={() => saveChanges('social')}
              onCancel={cancelEditing}
              isSaving={isSaving}
            />
          )}

          {activeTab === 'services' && (
            <ServicesSection
              data={agencyData}
              isEditing={editingSection === 'services'}
              formData={formData}
              onFormChange={handleFormChange}
              onStartEdit={() => startEditing('services', {
                services: agencyData.services || [],
                specializations: agencyData.specializations || [],
                countries: agencyData.target_countries || []
              })}
              onSave={() => saveChanges('services')}
              onCancel={cancelEditing}
              isSaving={isSaving}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsSection
              data={agencyData}
              isEditing={editingSection === 'settings'}
              formData={formData}
              onFormChange={handleFormChange}
              onStartEdit={() => startEditing('settings', agencyData.settings || {})}
              onSave={() => saveChanges('settings')}
              onCancel={cancelEditing}
              isSaving={isSaving}
            />
          )}

          {activeTab === 'audit' && (
            <AuditLog 
              resourceType="AGENCY_PROFILE"
              resourceId={agencyData?.id || 'agency_001'}
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <AgencyPreview data={agencyData} />
          <QuickStats data={agencyData} />
        </div>
      </div>
    </div>
  )
}

export default AgencySettings

// Basic Information Section
const BasicInfoSection = ({ data, isEditing, formData, onFormChange, onStartEdit, onSave, onCancel, isSaving }) => {
  if (isEditing) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Edit Basic Information</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={isSaving}
              className="btn-primary text-sm flex items-center"
            >
              <Save className="w-4 h-4 mr-1" />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Agency Name *</label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => onFormChange('name', e.target.value)}
              className="form-input"
              placeholder="Enter agency name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => onFormChange('description', e.target.value)}
              rows={4}
              className="form-textarea"
              placeholder="Describe your agency's mission and services"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Established Year</label>
              <input
                type="number"
                value={formData.established_year || ''}
                onChange={(e) => onFormChange('established_year', parseInt(e.target.value))}
                className="form-input"
                placeholder="2020"
                min="1900"
                max={new Date().getFullYear()}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">License Number *</label>
              <input
                type="text"
                value={formData.license_number || ''}
                onChange={(e) => onFormChange('license_number', e.target.value)}
                className="form-input"
                placeholder="REG-2024-001"
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
        <button
          onClick={onStartEdit}
          className="btn-secondary text-sm flex items-center"
        >
          <Edit className="w-4 h-4 mr-1" />
          Edit
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Agency Name</label>
          <p className="text-sm text-gray-900">{data.name}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <p className="text-sm text-gray-900">{data.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Established</label>
            <p className="text-sm text-gray-900">{data.established_year}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
            <p className="text-sm text-gray-900">{data.license_number}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Contact Information Section
const ContactSection = ({ data, isEditing, formData, onFormChange, onStartEdit, onSave, onCancel, isSaving }) => {
  if (isEditing) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Edit Contact Information</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={isSaving}
              className="btn-primary text-sm flex items-center"
            >
              <Save className="w-4 h-4 mr-1" />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => onFormChange('phone', e.target.value)}
                className="form-input"
                placeholder="+977-1-4567890"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile *</label>
              <input
                type="tel"
                value={formData.mobile || ''}
                onChange={(e) => onFormChange('mobile', e.target.value)}
                className="form-input"
                placeholder="+977-9841234567"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={(e) => onFormChange('email', e.target.value)}
              className="form-input"
              placeholder="info@agency.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
            <input
              type="url"
              value={formData.website || ''}
              onChange={(e) => onFormChange('website', e.target.value)}
              className="form-input"
              placeholder="www.agency.com"
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Contact Information</h2>
        <button
          onClick={onStartEdit}
          className="btn-secondary text-sm flex items-center"
        >
          <Edit className="w-4 h-4 mr-1" />
          Edit
        </button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <div className="flex items-center">
              <Phone className="w-4 h-4 text-gray-400 mr-2" />
              <p className="text-sm text-gray-900">{data.phone}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
            <div className="flex items-center">
              <Phone className="w-4 h-4 text-gray-400 mr-2" />
              <p className="text-sm text-gray-900">{data.mobile}</p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <div className="flex items-center">
            <Mail className="w-4 h-4 text-gray-400 mr-2" />
            <p className="text-sm text-gray-900">{data.email}</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
          <div className="flex items-center">
            <Globe className="w-4 h-4 text-gray-400 mr-2" />
            <a href={`https://${data.website}`} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 hover:text-primary-800">
              {data.website}
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

// Location Section
const LocationSection = ({ data, isEditing, formData, onFormChange, onStartEdit, onSave, onCancel, isSaving }) => {
  if (isEditing) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Edit Location</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={isSaving}
              className="btn-primary text-sm flex items-center"
            >
              <Save className="w-4 h-4 mr-1" />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
            <textarea
              value={formData.address || ''}
              onChange={(e) => onFormChange('address', e.target.value)}
              rows={3}
              className="form-textarea"
              placeholder="Enter complete address including city, district, and country"
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-sm text-gray-600">
              <strong>Tip:</strong> Include landmarks and detailed directions to help candidates find your office easily.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Location</h2>
        <button
          onClick={onStartEdit}
          className="btn-secondary text-sm flex items-center"
        >
          <Edit className="w-4 h-4 mr-1" />
          Edit
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <div className="flex items-start">
            <MapPin className="w-4 h-4 text-gray-400 mr-2 mt-0.5" />
            <p className="text-sm text-gray-900">{data.address}</p>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-md">
          <p className="text-sm text-gray-600">
            This address will be displayed on your public profile and used for candidate visits.
          </p>
        </div>
      </div>
    </div>
  )
}

// Media/Images Section
const MediaSection = ({ data, onFileUpload, isSaving }) => {
  const handleFileChange = (event, type) => {
    const file = event.target.files[0]
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
      if (!validTypes.includes(file.type)) {
        alert('Please select a valid image file (JPEG, PNG, or GIF)')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB')
        return
      }

      onFileUpload(file, type)
    }
  }

  return (
    <div className="space-y-6">
      {/* Logo Section */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Agency Logo</h2>
        
        <div className="flex items-center space-x-6">
          <div className="flex-shrink-0">
            <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
              {data.logo_url ? (
                <img
                  src={data.logo_url}
                  alt="Agency Logo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Building2 className="w-8 h-8 text-gray-400" />
              )}
            </div>
          </div>
          
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-3">
              Upload your agency logo. This will be displayed on your profile and job postings.
            </p>
            <div className="flex items-center space-x-3">
              <label className="btn-secondary text-sm flex items-center cursor-pointer">
                <Upload className="w-4 h-4 mr-1" />
                {isSaving ? 'Uploading...' : 'Upload Logo'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'logo')}
                  className="hidden"
                  disabled={isSaving}
                />
              </label>
              <p className="text-xs text-gray-500">
                Max 5MB, JPEG/PNG/GIF
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Banner Section */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Agency Banner</h2>
        
        <div className="space-y-4">
          <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
            {data.banner_url ? (
              <img
                src={data.banner_url}
                alt="Agency Banner"
                className="w-full h-full object-cover"
              />
            ) : (
              <Camera className="w-8 h-8 text-gray-400" />
            )}
          </div>
          
          <div>
            <p className="text-sm text-gray-600 mb-3">
              Upload a banner image for your agency profile. Recommended size: 1200x300 pixels.
            </p>
            <div className="flex items-center space-x-3">
              <label className="btn-secondary text-sm flex items-center cursor-pointer">
                <Upload className="w-4 h-4 mr-1" />
                {isSaving ? 'Uploading...' : 'Upload Banner'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'banner')}
                  className="hidden"
                  disabled={isSaving}
                />
              </label>
              <p className="text-xs text-gray-500">
                Max 5MB, JPEG/PNG/GIF
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Social Media Section
const SocialMediaSection = ({ data, isEditing, formData, onFormChange, onStartEdit, onSave, onCancel, isSaving }) => {
  const socialPlatforms = [
    { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/yourpage' },
    { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourpage' },
    { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/company/yourcompany' },
    { key: 'twitter', label: 'Twitter', placeholder: 'https://twitter.com/yourhandle' }
  ]

  if (isEditing) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Edit Social Media</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={isSaving}
              className="btn-primary text-sm flex items-center"
            >
              <Save className="w-4 h-4 mr-1" />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {socialPlatforms.map(platform => (
            <div key={platform.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {platform.label}
              </label>
              <input
                type="url"
                value={formData[platform.key] || ''}
                onChange={(e) => onFormChange(platform.key, e.target.value)}
                className="form-input"
                placeholder={platform.placeholder}
              />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Social Media</h2>
        <button
          onClick={onStartEdit}
          className="btn-secondary text-sm flex items-center"
        >
          <Edit className="w-4 h-4 mr-1" />
          Edit
        </button>
      </div>

      <div className="space-y-4">
        {socialPlatforms.map(platform => (
          <div key={platform.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {platform.label}
            </label>
            {data.social_media?.[platform.key] ? (
              <a
                href={data.social_media[platform.key]}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary-600 hover:text-primary-800 break-all"
              >
                {data.social_media[platform.key]}
              </a>
            ) : (
              <p className="text-sm text-gray-500">Not set</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// Services Section
const ServicesSection = ({ data, isEditing, formData, onFormChange, onStartEdit, onSave, onCancel, isSaving }) => {
  const addItem = (field, item) => {
    const currentItems = formData[field] || []
    if (item.trim() && !currentItems.includes(item.trim())) {
      onFormChange(field, [...currentItems, item.trim()])
    }
  }

  const removeItem = (field, index) => {
    const currentItems = formData[field] || []
    onFormChange(field, currentItems.filter((_, i) => i !== index))
  }

  if (isEditing) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Edit Services & Specializations</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={isSaving}
              className="btn-primary text-sm flex items-center"
            >
              <Save className="w-4 h-4 mr-1" />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Services */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Services Offered</label>
            <div className="space-y-2">
              {(formData.services || []).map((service, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md">
                  <span className="text-sm">{service}</span>
                  <button
                    onClick={() => removeItem('services', index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Add new service"
                  className="form-input flex-1"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addItem('services', e.target.value)
                      e.target.value = ''
                    }
                  }}
                />
                <button
                  onClick={(e) => {
                    const input = e.target.previousElementSibling
                    addItem('services', input.value)
                    input.value = ''
                  }}
                  className="btn-secondary text-sm"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Specializations */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Specializations</label>
            <div className="space-y-2">
              {(formData.specializations || []).map((spec, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md">
                  <span className="text-sm">{spec}</span>
                  <button
                    onClick={() => removeItem('specializations', index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Add specialization"
                  className="form-input flex-1"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addItem('specializations', e.target.value)
                      e.target.value = ''
                    }
                  }}
                />
                <button
                  onClick={(e) => {
                    const input = e.target.previousElementSibling
                    addItem('specializations', input.value)
                    input.value = ''
                  }}
                  className="btn-secondary text-sm"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Target Countries */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Target Countries</label>
            <div className="space-y-2">
              {(formData.countries || []).map((country, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md">
                  <span className="text-sm">{country}</span>
                  <button
                    onClick={() => removeItem('countries', index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="flex items-center space-x-2">
                <select
                  className="form-select flex-1"
                  onChange={(e) => {
                    if (e.target.value) {
                      addItem('countries', e.target.value)
                      e.target.value = ''
                    }
                  }}
                >
                  <option value="">Select country to add</option>
                  <option value="UAE">UAE</option>
                  <option value="Saudi Arabia">Saudi Arabia</option>
                  <option value="Qatar">Qatar</option>
                  <option value="Kuwait">Kuwait</option>
                  <option value="Oman">Oman</option>
                  <option value="Bahrain">Bahrain</option>
                  <option value="Malaysia">Malaysia</option>
                  <option value="Singapore">Singapore</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Services & Specializations</h2>
          <button
            onClick={onStartEdit}
            className="btn-secondary text-sm flex items-center"
          >
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Services Offered</h3>
            <div className="flex flex-wrap gap-2">
              {data.services?.map((service, index) => (
                <span key={index} className="chip chip-blue">
                  {service}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Specializations</h3>
            <div className="flex flex-wrap gap-2">
              {data.specializations?.map((spec, index) => (
                <span key={index} className="chip chip-green">
                  {spec}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Target Countries</h3>
            <div className="flex flex-wrap gap-2">
              {data.target_countries?.map((country, index) => (
                <span key={index} className="chip chip-yellow">
                  {country}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Settings Section
const SettingsSection = ({ data, isEditing, formData, onFormChange, onStartEdit, onSave, onCancel, isSaving }) => {
  if (isEditing) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Edit Settings</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={isSaving}
              className="btn-primary text-sm flex items-center"
            >
              <Save className="w-4 h-4 mr-1" />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select
                value={formData.currency || ''}
                onChange={(e) => onFormChange('currency', e.target.value)}
                className="form-select"
              >
                <option value="NPR">NPR - Nepali Rupee</option>
                <option value="USD">USD - US Dollar</option>
                <option value="AED">AED - UAE Dirham</option>
                <option value="SAR">SAR - Saudi Riyal</option>
                <option value="QAR">QAR - Qatari Riyal</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
              <select
                value={formData.timezone || ''}
                onChange={(e) => onFormChange('timezone', e.target.value)}
                className="form-select"
              >
                <option value="Asia/Kathmandu">Asia/Kathmandu</option>
                <option value="Asia/Dubai">Asia/Dubai</option>
                <option value="Asia/Riyadh">Asia/Riyadh</option>
                <option value="Asia/Qatar">Asia/Qatar</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
              <select
                value={formData.language || ''}
                onChange={(e) => onFormChange('language', e.target.value)}
                className="form-select"
              >
                <option value="en">English</option>
                <option value="ne">Nepali</option>
                <option value="hi">Hindi</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Format</label>
              <select
                value={formData.date_format || ''}
                onChange={(e) => onFormChange('date_format', e.target.value)}
                className="form-select"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Notifications</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.notifications?.email_enabled || false}
                  onChange={(e) => onFormChange('notifications', {
                    ...formData.notifications,
                    email_enabled: e.target.checked
                  })}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">Email notifications</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.notifications?.sms_enabled || false}
                  onChange={(e) => onFormChange('notifications', {
                    ...formData.notifications,
                    sms_enabled: e.target.checked
                  })}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">SMS notifications</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.notifications?.push_enabled || false}
                  onChange={(e) => onFormChange('notifications', {
                    ...formData.notifications,
                    push_enabled: e.target.checked
                  })}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">Push notifications</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
        <button
          onClick={onStartEdit}
          className="btn-secondary text-sm flex items-center"
        >
          <Edit className="w-4 h-4 mr-1" />
          Edit
        </button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
            <p className="text-sm text-gray-900">{data.settings?.currency || 'NPR'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
            <p className="text-sm text-gray-900">{data.settings?.timezone || 'Asia/Kathmandu'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
            <p className="text-sm text-gray-900">{data.settings?.language === 'en' ? 'English' : data.settings?.language}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Format</label>
            <p className="text-sm text-gray-900">{data.settings?.date_format || 'DD/MM/YYYY'}</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Notifications</label>
          <div className="space-y-1">
            <div className="flex items-center">
              <span className={`w-2 h-2 rounded-full mr-2 ${data.settings?.notifications?.email_enabled ? 'bg-green-500' : 'bg-gray-300'}`}></span>
              <span className="text-sm text-gray-700">Email notifications</span>
            </div>
            <div className="flex items-center">
              <span className={`w-2 h-2 rounded-full mr-2 ${data.settings?.notifications?.sms_enabled ? 'bg-green-500' : 'bg-gray-300'}`}></span>
              <span className="text-sm text-gray-700">SMS notifications</span>
            </div>
            <div className="flex items-center">
              <span className={`w-2 h-2 rounded-full mr-2 ${data.settings?.notifications?.push_enabled ? 'bg-green-500' : 'bg-gray-300'}`}></span>
              <span className="text-sm text-gray-700">Push notifications</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Agency Preview Sidebar
const AgencyPreview = ({ data }) => {
  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Agency Preview</h3>
      
      <div className="text-center mb-4">
        <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-3 flex items-center justify-center overflow-hidden">
          {data.logo_url ? (
            <img
              src={data.logo_url}
              alt="Agency Logo"
              className="w-full h-full object-cover"
            />
          ) : (
            <Building2 className="w-6 h-6 text-gray-400" />
          )}
        </div>
        <h4 className="font-semibold text-gray-900">{data.name}</h4>
        <p className="text-sm text-gray-600">{data.address}</p>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center">
          <Phone className="w-4 h-4 text-gray-400 mr-2" />
          <span>{data.phone}</span>
        </div>
        <div className="flex items-center">
          <Mail className="w-4 h-4 text-gray-400 mr-2" />
          <span>{data.email}</span>
        </div>
        <div className="flex items-center">
          <Globe className="w-4 h-4 text-gray-400 mr-2" />
          <span>{data.website}</span>
        </div>
      </div>
    </div>
  )
}

// Quick Stats Sidebar
const QuickStats = ({ data }) => {
  const stats = [
    { label: 'Total Placements', value: data.statistics?.total_placements || 0, icon: Users },
    { label: 'Success Rate', value: `${data.statistics?.success_rate || 0}%`, icon: Target },
    { label: 'Countries Served', value: data.statistics?.countries_served || 0, icon: Globe },
    { label: 'Partner Companies', value: data.statistics?.partner_companies || 0, icon: Briefcase }
  ]

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
      
      <div className="space-y-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center">
                <Icon className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">{stat.label}</span>
              </div>
              <span className="font-semibold text-gray-900">{stat.value}</span>
            </div>
          )
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center text-sm text-gray-600">
          <Clock className="w-4 h-4 mr-2" />
          <span>Active since {new Date(data.statistics?.active_since).getFullYear()}</span>
        </div>
      </div>
    </div>
  )
}