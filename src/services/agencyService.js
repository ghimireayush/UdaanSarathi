// Agency Service - Handles agency settings and profile operations
import agencyData from '../data/agency.json'

// Utility function to simulate API delay
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms))

// Error simulation (5% chance)
const shouldSimulateError = () => Math.random() < 0.05

// Deep clone helper
const deepClone = (obj) => JSON.parse(JSON.stringify(obj))

let agencyCache = deepClone(agencyData)

class AgencyService {
  /**
   * Get agency profile
   * @returns {Promise<Object>} Agency profile data
   */
  async getAgencyProfile() {
    await delay()
    if (shouldSimulateError()) {
      throw new Error('Failed to fetch agency profile')
    }

    return deepClone(agencyCache)
  }

  /**
   * Update agency profile
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated agency profile
   */
  async updateAgencyProfile(updateData) {
    await delay(500)
    if (shouldSimulateError()) {
      throw new Error('Failed to update agency profile')
    }

    agencyCache = {
      ...agencyCache,
      ...updateData,
      updated_at: new Date().toISOString()
    }

    return deepClone(agencyCache)
  }

  /**
   * Get agency basic information
   * @returns {Promise<Object>} Basic agency information
   */
  async getAgencyBasicInfo() {
    await delay(150)
    const profile = await this.getAgencyProfile()
    
    return {
      id: profile.id,
      name: profile.name,
      address: profile.address,
      phone: profile.phone,
      mobile: profile.mobile,
      email: profile.email,
      website: profile.website,
      logo_url: profile.logo_url,
      established_year: profile.established_year
    }
  }

  /**
   * Update basic agency information
   * @param {Object} basicInfo - Basic information to update
   * @returns {Promise<Object>} Updated basic information
   */
  async updateBasicInfo(basicInfo) {
    await delay(400)
    return this.updateAgencyProfile(basicInfo)
  }

  /**
   * Get agency contact information
   * @returns {Promise<Object>} Contact information
   */
  async getContactInfo() {
    await delay(150)
    const profile = await this.getAgencyProfile()
    
    return {
      phone: profile.phone,
      mobile: profile.mobile,
      email: profile.email,
      website: profile.website,
      address: profile.address,
      contact_persons: profile.contact_persons
    }
  }

  /**
   * Update contact information
   * @param {Object} contactInfo - Contact information to update
   * @returns {Promise<Object>} Updated contact information
   */
  async updateContactInfo(contactInfo) {
    await delay(400)
    return this.updateAgencyProfile(contactInfo)
  }

  /**
   * Get agency certifications
   * @returns {Promise<Array>} Array of certifications
   */
  async getCertifications() {
    await delay(150)
    const profile = await this.getAgencyProfile()
    return profile.certifications || []
  }

  /**
   * Add new certification
   * @param {Object} certification - Certification data
   * @returns {Promise<Object>} Updated agency profile
   */
  async addCertification(certification) {
    await delay(300)
    const profile = await this.getAgencyProfile()
    
    const newCertification = {
      ...certification,
      id: `cert_${Date.now()}`,
      added_at: new Date().toISOString()
    }

    const updatedCertifications = [...(profile.certifications || []), newCertification]
    
    return this.updateAgencyProfile({
      certifications: updatedCertifications
    })
  }

  /**
   * Update certification
   * @param {string} certificationId - Certification ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated agency profile
   */
  async updateCertification(certificationId, updateData) {
    await delay(300)
    const profile = await this.getAgencyProfile()
    
    const certifications = profile.certifications?.map(cert => 
      cert.id === certificationId 
        ? { ...cert, ...updateData, updated_at: new Date().toISOString() }
        : cert
    ) || []

    return this.updateAgencyProfile({
      certifications
    })
  }

  /**
   * Remove certification
   * @param {string} certificationId - Certification ID
   * @returns {Promise<Object>} Updated agency profile
   */
  async removeCertification(certificationId) {
    await delay(300)
    const profile = await this.getAgencyProfile()
    
    const certifications = profile.certifications?.filter(cert => 
      cert.id !== certificationId
    ) || []

    return this.updateAgencyProfile({
      certifications
    })
  }

  /**
   * Get social media links
   * @returns {Promise<Object>} Social media information
   */
  async getSocialMedia() {
    await delay(150)
    const profile = await this.getAgencyProfile()
    return profile.social_media || {}
  }

  /**
   * Update social media links
   * @param {Object} socialMedia - Social media links
   * @returns {Promise<Object>} Updated agency profile
   */
  async updateSocialMedia(socialMedia) {
    await delay(300)
    return this.updateAgencyProfile({
      social_media: socialMedia
    })
  }

  /**
   * Get bank details
   * @returns {Promise<Object>} Bank account information
   */
  async getBankDetails() {
    await delay(150)
    const profile = await this.getAgencyProfile()
    return profile.bank_details || {}
  }

  /**
   * Update bank details
   * @param {Object} bankDetails - Bank account information
   * @returns {Promise<Object>} Updated agency profile
   */
  async updateBankDetails(bankDetails) {
    await delay(300)
    return this.updateAgencyProfile({
      bank_details: bankDetails
    })
  }

  /**
   * Get contact persons
   * @returns {Promise<Array>} Array of contact persons
   */
  async getContactPersons() {
    await delay(150)
    const profile = await this.getAgencyProfile()
    return profile.contact_persons || []
  }

  /**
   * Add contact person
   * @param {Object} contactPerson - Contact person data
   * @returns {Promise<Object>} Updated agency profile
   */
  async addContactPerson(contactPerson) {
    await delay(300)
    const profile = await this.getAgencyProfile()
    
    const newContactPerson = {
      ...contactPerson,
      id: `contact_${Date.now()}`,
      added_at: new Date().toISOString()
    }

    const updatedContactPersons = [...(profile.contact_persons || []), newContactPerson]
    
    return this.updateAgencyProfile({
      contact_persons: updatedContactPersons
    })
  }

  /**
   * Update contact person
   * @param {string} contactId - Contact person ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated agency profile
   */
  async updateContactPerson(contactId, updateData) {
    await delay(300)
    const profile = await this.getAgencyProfile()
    
    const contactPersons = profile.contact_persons?.map(contact => 
      contact.id === contactId 
        ? { ...contact, ...updateData, updated_at: new Date().toISOString() }
        : contact
    ) || []

    return this.updateAgencyProfile({
      contact_persons: contactPersons
    })
  }

  /**
   * Remove contact person
   * @param {string} contactId - Contact person ID
   * @returns {Promise<Object>} Updated agency profile
   */
  async removeContactPerson(contactId) {
    await delay(300)
    const profile = await this.getAgencyProfile()
    
    const contactPersons = profile.contact_persons?.filter(contact => 
      contact.id !== contactId
    ) || []

    return this.updateAgencyProfile({
      contact_persons: contactPersons
    })
  }

  /**
   * Get agency settings
   * @returns {Promise<Object>} Agency settings
   */
  async getSettings() {
    await delay(150)
    const profile = await this.getAgencyProfile()
    return profile.settings || {}
  }

  /**
   * Update agency settings
   * @param {Object} settings - Settings to update
   * @returns {Promise<Object>} Updated agency profile
   */
  async updateSettings(settings) {
    await delay(300)
    const profile = await this.getAgencyProfile()
    
    const updatedSettings = {
      ...profile.settings,
      ...settings
    }

    return this.updateAgencyProfile({
      settings: updatedSettings
    })
  }

  /**
   * Get agency statistics
   * @returns {Promise<Object>} Agency statistics
   */
  async getStatistics() {
    await delay(150)
    const profile = await this.getAgencyProfile()
    return profile.statistics || {}
  }

  /**
   * Update statistics
   * @param {Object} stats - Statistics to update
   * @returns {Promise<Object>} Updated agency profile
   */
  async updateStatistics(stats) {
    await delay(300)
    const profile = await this.getAgencyProfile()
    
    const updatedStats = {
      ...profile.statistics,
      ...stats
    }

    return this.updateAgencyProfile({
      statistics: updatedStats
    })
  }

  /**
   * Upload agency logo
   * @param {File} logoFile - Logo file
   * @returns {Promise<Object>} Updated agency profile with new logo URL
   */
  async uploadLogo(logoFile) {
    await delay(800)
    if (shouldSimulateError()) {
      throw new Error('Failed to upload logo')
    }

    // Simulate file upload
    const logoUrl = `/images/agency_logo_${Date.now()}.${logoFile.name.split('.').pop()}`
    
    return this.updateAgencyProfile({
      logo_url: logoUrl
    })
  }

  /**
   * Upload agency banner
   * @param {File} bannerFile - Banner file
   * @returns {Promise<Object>} Updated agency profile with new banner URL
   */
  async uploadBanner(bannerFile) {
    await delay(800)
    if (shouldSimulateError()) {
      throw new Error('Failed to upload banner')
    }

    // Simulate file upload
    const bannerUrl = `/images/agency_banner_${Date.now()}.${bannerFile.name.split('.').pop()}`
    
    return this.updateAgencyProfile({
      banner_url: bannerUrl
    })
  }

  /**
   * Get agency specializations
   * @returns {Promise<Array>} Array of specializations
   */
  async getSpecializations() {
    await delay(150)
    const profile = await this.getAgencyProfile()
    return profile.specializations || []
  }

  /**
   * Update specializations
   * @param {Array} specializations - Array of specialization names
   * @returns {Promise<Object>} Updated agency profile
   */
  async updateSpecializations(specializations) {
    await delay(300)
    return this.updateAgencyProfile({
      specializations
    })
  }

  /**
   * Get target countries
   * @returns {Promise<Array>} Array of target countries
   */
  async getTargetCountries() {
    await delay(150)
    const profile = await this.getAgencyProfile()
    return profile.target_countries || []
  }

  /**
   * Update target countries
   * @param {Array} countries - Array of country names
   * @returns {Promise<Object>} Updated agency profile
   */
  async updateTargetCountries(countries) {
    await delay(300)
    return this.updateAgencyProfile({
      target_countries: countries
    })
  }

  /**
   * Get agency services
   * @returns {Promise<Array>} Array of services offered
   */
  async getServices() {
    await delay(150)
    const profile = await this.getAgencyProfile()
    return profile.services || []
  }

  /**
   * Update services
   * @param {Array} services - Array of service names
   * @returns {Promise<Object>} Updated agency profile
   */
  async updateServices(services) {
    await delay(300)
    return this.updateAgencyProfile({
      services
    })
  }

  /**
   * Get operating hours
   * @returns {Promise<Object>} Operating hours information
   */
  async getOperatingHours() {
    await delay(150)
    const profile = await this.getAgencyProfile()
    return profile.operating_hours || {}
  }

  /**
   * Update operating hours
   * @param {Object} operatingHours - Operating hours data
   * @returns {Promise<Object>} Updated agency profile
   */
  async updateOperatingHours(operatingHours) {
    await delay(300)
    return this.updateAgencyProfile({
      operating_hours: operatingHours
    })
  }

  /**
   * Validate agency data
   * @param {Object} agencyData - Agency data to validate
   * @returns {Promise<Object>} Validation result
   */
  async validateAgencyData(agencyData) {
    await delay(200)
    
    const errors = []
    const warnings = []

    // Required fields validation
    if (!agencyData.name) errors.push('Agency name is required')
    if (!agencyData.email) errors.push('Email is required')
    if (!agencyData.phone) errors.push('Phone number is required')
    if (!agencyData.address) errors.push('Address is required')
    if (!agencyData.license_number) errors.push('License number is required')

    // Email validation
    if (agencyData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(agencyData.email)) {
      errors.push('Invalid email format')
    }

    // Phone validation
    if (agencyData.phone && !/^\+?[\d\s-()]+$/.test(agencyData.phone)) {
      warnings.push('Phone number format should be validated')
    }

    // Certification expiry warnings
    if (agencyData.certifications) {
      agencyData.certifications.forEach(cert => {
        if (cert.expiry_date) {
          const expiryDate = new Date(cert.expiry_date)
          const warningDate = new Date()
          warningDate.setDate(warningDate.getDate() + 30) // 30 days warning

          if (expiryDate < warningDate) {
            warnings.push(`Certification "${cert.name}" expires soon`)
          }
        }
      })
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }
}

// Create and export singleton instance
const agencyService = new AgencyService()
export default agencyService