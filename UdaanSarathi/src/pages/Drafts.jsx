import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { 
  Plus, 
  Search, 
  Grid3X3, 
  List, 
  Copy, 
  Check, 
  Trash2, 
  MapPin, 
  DollarSign, 
  Calendar, 
  Eye, 
  Edit, 
  X, 
  FileText,
  AlertCircle,
  Clock,
  User,
  Phone,
  Mail,
  Upload,
  Link,
  Volume2,
  Tag,
  Settings,
  Image,
  Globe,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square,
  Wand2
} from 'lucide-react'
import { format } from 'date-fns'
import { jobService } from '../services/index.js'
import DraftListManagement from '../components/DraftListManagement'
import JobCreationWizard from '../components/JobCreationWizard'
import { InteractiveFilter, InteractiveButton, InteractiveCard, InteractivePagination, PaginationInfo } from '../components/InteractiveUI'

const Drafts = () => {
  // Refs for managing component state
  const refreshDraftsRef = useRef(null)
  
  // All useState hooks grouped together at the top
  const [viewMode, setViewMode] = useState('list')
  const [filters, setFilters] = useState({
    search: '',
    country: '',
    company: '',
    category: ''
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20, // 20 items per page for list view
    total: 0,
    totalPages: 0
  })
  const [selectedDrafts, setSelectedDrafts] = useState(new Set())
  const [showJobWizard, setShowJobWizard] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showBulkCreateModal, setShowBulkCreateModal] = useState(false)
  const [drafts, setDrafts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [publishingDrafts, setPublishingDrafts] = useState(new Set()) // Track individual publishing states
  const [deletingDrafts, setDeletingDrafts] = useState(new Set()) // Track individual deleting states
  const [editingDraft, setEditingDraft] = useState(null) // Track draft being edited
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('success') // 'success', 'error', 'info'
  const [draftMode, setDraftMode] = useState('manual') // 'manual', 'newspaper'
  // Tags modal state
  const [showTagsModal, setShowTagsModal] = useState(false)
  const [tagsDraftId, setTagsDraftId] = useState(null)
  const [tagsForm, setTagsForm] = useState({
    skills: [''],
    education_requirements: [''],
    experience: {
      min_years: '',
      preferred_years: '',
      domains: ['']
    },
    canonical_titles: {
      ids: [],
      names: []
    }
  })
  // Cutout modal state
  const [showCutoutModal, setShowCutoutModal] = useState(false)
  const [cutoutDraftId, setCutoutDraftId] = useState(null)
  const [cutoutForm, setCutoutForm] = useState({
    file: null,
    previewUrl: '',
    existingUrl: ''
  })
  // Posting Details modal state
  const [showPostingDetailsModal, setShowPostingDetailsModal] = useState(false)
  const [postingDetailsDraftId, setPostingDetailsDraftId] = useState(null)
  const [postingDetailsForm, setPostingDetailsForm] = useState({
    city: '',
    lt_number: '',
    chalani_number: '',
    approval_date: '',
    posting_date: '',
    announcement_type: 'normal',
    administrative_notes: ''
  })
  // Contract Details modal state
  const [showContractModal, setShowContractModal] = useState(false)
  const [contractDraftId, setContractDraftId] = useState(null)
  const [contractForm, setContractForm] = useState({
    period_years: '',
    renewable: false,
    hours_per_day: '',
    days_per_week: '',
    overtime_policy: 'as_per_law',
    weekly_off_days: '',
    food: 'provided',
    accommodation: 'provided',
    transport: 'provided',
    annual_leave_days: ''
  })
  // Positions modal state
  const [showPositionsModal, setShowPositionsModal] = useState(false)
  const [positionsDraftId, setPositionsDraftId] = useState(null)
  const [positionsForm, setPositionsForm] = useState([
    {
      title: '',
      vacancies_male: '',
      vacancies_female: '',
      salary_amount: '',
      salary_currency: 'AED',
      overrides: {
        hours_per_day: '',
        days_per_week: '',
        overtime_policy: 'as_per_law',
        weekly_off_days: '',
        benefits: { food: 'provided', accommodation: 'provided', transport: 'provided' },
        notes: ''
      }
    }
  ])
  // Expenses modal state
  const [showExpensesModal, setShowExpensesModal] = useState(false)
  const [expensesDraftId, setExpensesDraftId] = useState(null)
  const [expensesForm, setExpensesForm] = useState([
    {
      type: 'Medical',
      payer: 'employer',
      is_free: true,
      amount: '',
      currency: 'AED',
      notes: ''
    }
  ])
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    companyAddress: '',
    country: '',
    city: '',
    salary: '',
    currency: 'AED',
    description: '',
    requirements: '',
    tags: [],
    employment_type: 'Full-time',
    working_hours: '8 hours/day',
    accommodation: 'Provided',
    food: 'Provided',
    visa_status: 'Company will provide',
    contract_duration: '2 years',
    contact_person: '',
    contact_phone: '',
    contact_email: '',
    expenses: [],
    notes: '',
    ocrText: '',
    imageUrl: '',
    newspaperUrl: '',
    phoneNumberChunks: ['', '', '', ''],
    jobTitleTag: '',
    expenseConfig: {
      employerPays: [],
      candidatePays: []
    },
    attachments: []
  })
  // Legacy state - can be removed after wizard integration is complete
  const [lastCreatedPostingId, setLastCreatedPostingId] = useState('')
  // Additional state for enhanced features
  const [selectedJobTitle, setSelectedJobTitle] = useState('')
  const [companyAutocomplete, setCompanyAutocomplete] = useState([])
  const [notesTemplates, setNotesTemplates] = useState([
    'Standard overseas employment terms and conditions apply.',
    'Candidate must provide medical clearance and police clearance.',
    'Company provides visa processing and work permit assistance.',
    'Training will be provided for the first month.',
    'Overtime compensation as per local labor laws.'
  ])
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false)
  const [showJobTitleDropdown, setShowJobTitleDropdown] = useState(false)
  const [showNotesDropdown, setShowNotesDropdown] = useState(false)
  const [expenseItems] = useState([
    'Visa Processing Fee',
    'Medical Examination',
    'Police Clearance',
    'Travel Ticket',
    'Insurance',
    'Work Permit',
    'Emirates ID',
    'Accommodation Deposit',
    'Agent Commission'
  ])
  const [companies, setCompanies] = useState([
    { name: 'Al Manara Restaurant', address: 'Sheikh Zayed Road, Dubai, UAE', city: 'Dubai', country: 'UAE' },
    { name: 'Emirates Logistics', address: 'Corniche Road, Abu Dhabi, UAE', city: 'Abu Dhabi', country: 'UAE' },
    { name: 'Clean Pro Services', address: 'West Bay, Doha, Qatar', city: 'Doha', country: 'Qatar' },
    { name: 'SecureMax', address: 'King Fahd Road, Riyadh, Saudi Arabia', city: 'Riyadh', country: 'Saudi Arabia' },
    { name: 'Royal Hotel', address: 'Al Qasba, Sharjah, UAE', city: 'Sharjah', country: 'UAE' },
    { name: 'BuildTech UAE', address: 'Business Bay, Dubai, UAE', city: 'Dubai', country: 'UAE' }
  ])
  const [jobTitleDictionary, setJobTitleDictionary] = useState([
    { title: 'Cook', tags: ['cooking', 'kitchen', 'food preparation', 'culinary'] },
    { title: 'Driver', tags: ['driving', 'transportation', 'vehicle', 'logistics'] },
    { title: 'Cleaner', tags: ['cleaning', 'housekeeping', 'maintenance', 'sanitation'] },
    { title: 'Security Guard', tags: ['security', 'surveillance', 'protection', 'safety'] },
    { title: 'Waiter', tags: ['service', 'hospitality', 'restaurant', 'customer service'] },
    { title: 'Construction Worker', tags: ['construction', 'building', 'manual labor', 'site work'] },
    { title: 'Electrician', tags: ['electrical', 'wiring', 'maintenance', 'technical'] },
    { title: 'Plumber', tags: ['plumbing', 'pipes', 'water systems', 'maintenance'] },
    { title: 'Welder', tags: ['welding', 'metalwork', 'fabrication', 'technical'] },
    { title: 'Mechanic', tags: ['automotive', 'repair', 'maintenance', 'technical'] }
  ])
  const [bulkCreateCountries, setBulkCreateCountries] = useState([{ country: 'UAE', jobCount: 3 }])
  const [bulkCreateJobType, setBulkCreateJobType] = useState('Cook')
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewDraft, setPreviewDraft] = useState(null)

  // Constants section
  const ANNOUNCEMENT_TYPES = ['normal', 'urgent', 'corrigendum', 'reannouncement']
  const OVERTIME_POLICIES = ['none', 'paid', 'compensatory', 'as_per_law']
  const BENEFIT_OPTIONS = ['provided', 'allowance', 'not_provided']
  const EXPENSE_TYPES = ['Medical', 'Insurance', 'Travel', 'Visa/Permit', 'Training', 'Welfare/Service']
  const PAYER_OPTIONS = ['employer', 'candidate', 'shared']
  const CURRENCIES = ['AED','SAR','QAR','KWD','OMR','BHD']

  const getToastDelay = useCallback((type) => type === 'error' ? 5000 : 4000, [])

  const showToast = useCallback((message, type = 'success') => {
    setToastMessage(message)
    setToastType(type)
    setShowSuccessToast(true)
    setTimeout(() => setShowSuccessToast(false), getToastDelay(type))
  }, [getToastDelay])

  // Initial data fetching with filtering and pagination
  useEffect(() => {
    const fetchDrafts = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Get all drafts first (since we don't have paginated API yet)
        const allDrafts = await jobService.getDraftJobs()
        
        // Apply client-side filtering
        let filteredDrafts = allDrafts.filter(draft => {
          const matchesSearch = !filters.search || 
            draft.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
            draft.company?.toLowerCase().includes(filters.search.toLowerCase()) ||
            draft.description?.toLowerCase().includes(filters.search.toLowerCase())
          
          const matchesCountry = !filters.country || draft.country === filters.country
          const matchesCompany = !filters.company || draft.company === filters.company
          const matchesCategory = !filters.category || draft.category === filters.category
          
          return matchesSearch && matchesCountry && matchesCompany && matchesCategory
        })
        
        // Apply pagination
        const total = filteredDrafts.length
        const totalPages = Math.ceil(total / pagination.limit)
        const startIndex = (pagination.page - 1) * pagination.limit
        const endIndex = startIndex + pagination.limit
        const paginatedDrafts = filteredDrafts.slice(startIndex, endIndex)
        
        setDrafts(paginatedDrafts)
        setPagination(prev => ({
          ...prev,
          total,
          totalPages
        }))
        
      } catch (err) {
        console.error('Failed to fetch drafts:', err)
        setError('Failed to load drafts. Please try again.')
        setToastMessage('❌ Failed to load drafts')
        setToastType('error')
        setShowSuccessToast(true)
        setTimeout(() => setShowSuccessToast(false), getToastDelay('error'))
      } finally {
        setIsLoading(false)
      }
    }
    fetchDrafts()
  }, [filters, pagination.page, pagination.limit, getToastDelay])
  // Tags & Canonical Titles helpers
  const openTagsModal = (draft) => {
    setTagsDraftId(draft.id)
    setTagsForm({
      skills: Array.isArray(draft.tags) && draft.tags.length ? draft.tags : [''],
      education_requirements: Array.isArray(draft.education_requirements) && draft.education_requirements.length ? draft.education_requirements : [''],
      experience: {
        min_years: draft.experience?.min_years?.toString() || '',
        preferred_years: draft.experience?.preferred_years?.toString() || '',
        domains: Array.isArray(draft.experience?.domains) && draft.experience.domains.length ? draft.experience.domains : ['']
      },
      canonical_titles: {
        ids: Array.isArray(draft.canonical_titles?.ids) ? draft.canonical_titles.ids : [],
        names: Array.isArray(draft.canonical_titles?.names) ? draft.canonical_titles.names : []
      }
    })
    setShowTagsModal(true)
  }

  const updateArrayField = (arr, index, value) => {
    const next = [...arr]
    next[index] = value
    return next
  }

  const addArrayItem = (arr, defaultValue = '') => [...arr, defaultValue]
  const removeArrayItem = (arr, index) => arr.filter((_, i) => i !== index)

  const validateTagsForm = () => {
    const errs = []
    const min = tagsForm.experience.min_years === '' ? NaN : Number(tagsForm.experience.min_years)
    const pref = tagsForm.experience.preferred_years === '' ? NaN : Number(tagsForm.experience.preferred_years)
    if (!isNaN(min) && min < 0) errs.push('Experience: min_years cannot be negative')
    if (!isNaN(pref) && pref < 0) errs.push('Experience: preferred_years cannot be negative')
    if (!isNaN(min) && !isNaN(pref) && pref < min) errs.push('Experience: preferred_years should be >= min_years')
    return errs
  }

  const saveTags = async () => {
    const errors = validateTagsForm()
    if (errors.length > 0) {
      showToast(`❌ Please fix the following:\n- ${errors.join('\n- ')}`, 'error')
      return
    }
    const cleanArray = (arr) => (arr || []).map(v => (v || '').trim()).filter(v => v)
    const payload = {
      // tags-only PATCH style payload
      tags: cleanArray(tagsForm.skills),
      education_requirements: cleanArray(tagsForm.education_requirements),
      experience: {
        min_years: tagsForm.experience.min_years === '' ? null : Number(tagsForm.experience.min_years),
        preferred_years: tagsForm.experience.preferred_years === '' ? null : Number(tagsForm.experience.preferred_years),
        domains: cleanArray(tagsForm.experience.domains)
      },
      canonical_titles: {
        ids: (tagsForm.canonical_titles.ids || []).filter(Boolean),
        names: cleanArray(tagsForm.canonical_titles.names)
      }
    }
    try {
      await jobService.updateJob(tagsDraftId, payload)
      const updatedDrafts = await jobService.getDraftJobs()
      setDrafts(updatedDrafts)
      showToast('✅ Tags & titles updated.', 'success')
      setShowTagsModal(false)
      setTagsDraftId(null)
    } catch (e) {
      console.error('Failed to update tags:', e)
      showToast('❌ Failed to update tags.', 'error')
    }
  }
 
  // Cutout helpers
  const openCutout = (draft) => {
    setCutoutDraftId(draft.id)
    setCutoutForm({
      file: null,
      previewUrl: '',
      existingUrl: draft.cutout_url || ''
    })
    setShowCutoutModal(true)
  }

  const handleCutoutFile = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      setCutoutForm(prev => ({ ...prev, file, previewUrl: e.target.result }))
    }
    reader.readAsDataURL(file)
  }

  const saveCutout = async () => {
    // In real app, POST /agencies/:license/job-postings/:id/cutout with FormData
    // For now, store data URL + filename to simulate persistence
    if (!cutoutForm.file && !cutoutForm.existingUrl) {
      showToast('❌ Please select an image to upload.', 'error')
      return
    }
    const payload = cutoutForm.file
      ? { cutout_url: cutoutForm.previewUrl, cutout_filename: cutoutForm.file.name }
      : { cutout_url: cutoutForm.existingUrl }
    try {
      await jobService.updateJob(cutoutDraftId, payload)
      const updatedDrafts = await jobService.getDraftJobs()
      setDrafts(updatedDrafts)
      showToast('✅ Cutout saved.', 'success')
      setShowCutoutModal(false)
      setCutoutDraftId(null)
    } catch (e) {
      console.error('Failed to save cutout:', e)
      showToast('❌ Failed to save cutout.', 'error')
    }
  }

  const removeCutout = async (deleteFile = false) => {
    // In real app, DELETE /agencies/:license/job-postings/:id/cutout?deleteFile=true|false
    try {
      await jobService.updateJob(cutoutDraftId, { cutout_url: '', cutout_filename: '' })
      const updatedDrafts = await jobService.getDraftJobs()
      setDrafts(updatedDrafts)
      showToast('✅ Cutout removed.', 'success')
      setShowCutoutModal(false)
      setCutoutDraftId(null)
    } catch (e) {
      console.error('Failed to remove cutout:', e)
      showToast('❌ Failed to remove cutout.', 'error')
    }
  }
  // Expenses helpers
  const openExpenses = (draft) => {
    setExpensesDraftId(draft.id)
    const src = Array.isArray(draft.expenses) && draft.expenses.length > 0 ? draft.expenses : expensesForm
    const normalized = src.map(e => ({
      type: e.type || 'Medical',
      payer: e.payer || 'employer',
      is_free: typeof e.is_free === 'boolean' ? e.is_free : true,
      amount: (e.amount ?? '').toString(),
      currency: e.currency || 'AED',
      notes: e.notes || ''
    }))
    setExpensesForm(normalized)
    setShowExpensesModal(true)
  }

  const handleExpenseChange = (index, field, value) => {
    setExpensesForm(prev => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      // if toggling is_free to true, clear amount/currency
      if (field === 'is_free' && value) {
        next[index].amount = ''
      }
      return next
    })
  }

  const addExpenseRow = () => {
    setExpensesForm(prev => ([...prev, { type: 'Medical', payer: 'employer', is_free: true, amount: '', currency: 'AED', notes: '' }]))
  }

  const removeExpenseRow = (index) => {
    setExpensesForm(prev => prev.filter((_, i) => i !== index))
  }

  const validateExpensesForm = () => {
    const errs = []
    expensesForm.forEach((e, idx) => {
      if (!EXPENSE_TYPES.includes(e.type)) errs.push(`Expense #${idx+1}: invalid type`)
      if (!PAYER_OPTIONS.includes(e.payer)) errs.push(`Expense #${idx+1}: invalid payer`)
      if (!e.is_free) {
        const amount = e.amount === '' ? NaN : Number(e.amount)
        if (isNaN(amount) || amount <= 0) errs.push(`Expense #${idx+1}: amount must be a positive number when not free`)
        if (!CURRENCIES.includes(e.currency)) errs.push(`Expense #${idx+1}: currency is invalid`)
      }
    })
    return errs
  }

  const saveExpenses = async () => {
    const errors = validateExpensesForm()
    if (errors.length > 0) {
      showToast(`❌ Please fix the following:\n- ${errors.join('\n- ')}`, 'error')
      return
    }
    const payload = {
      expenses: expensesForm.map(e => ({
        type: e.type,
        payer: e.payer,
        is_free: !!e.is_free,
        amount: e.is_free ? 0 : Number(e.amount),
        currency: e.is_free ? '' : e.currency,
        notes: e.notes || ''
      }))
    }
    try {
      await jobService.updateJob(expensesDraftId, payload)
      const updatedDrafts = await jobService.getDraftJobs()
      setDrafts(updatedDrafts)
      showToast('✅ Expenses updated.', 'success')
      setShowExpensesModal(false)
      setExpensesDraftId(null)
    } catch (e) {
      console.error('Failed to update expenses:', e)
      showToast('❌ Failed to update expenses.', 'error')
    }
  }
  
  // Mock mutation object for compatibility
  const publishMutation = {
    isLoading: publishingDrafts.size > 0
  }

  // Contract details helpers
  const openContractDetails = (draft) => {
    setContractDraftId(draft.id)
    const c = draft.contract || {}
    setContractForm({
      period_years: (c.period_years ?? '').toString(),
      renewable: !!c.renewable,
      hours_per_day: (c.hours_per_day ?? '').toString(),
      days_per_week: (c.days_per_week ?? '').toString(),
      overtime_policy: c.overtime_policy || 'as_per_law',
      weekly_off_days: c.weekly_off_days || '',
      food: (c.benefits && c.benefits.food) || 'provided',
      accommodation: (c.benefits && c.benefits.accommodation) || 'provided',
      transport: (c.benefits && c.benefits.transport) || 'provided',
      annual_leave_days: (c.annual_leave_days ?? '').toString()
    })
    setShowContractModal(true)
  }

  const handleContractChange = (field, value) => {
    setContractForm(prev => ({ ...prev, [field]: value }))
  }

  const validateContractForm = () => {
    const errs = []
    const num = (v) => (v === '' ? NaN : Number(v))
    const period = num(contractForm.period_years)
    const hours = num(contractForm.hours_per_day)
    const days = num(contractForm.days_per_week)
    const leave = num(contractForm.annual_leave_days)
    if (isNaN(period) || period <= 0) errs.push('Contract period (years) must be a positive number')
    if (isNaN(hours) || hours <= 0 || hours > 24) errs.push('Hours per day must be between 1 and 24')
    if (isNaN(days) || days <= 0 || days > 7) errs.push('Days per week must be between 1 and 7')
    if (!OVERTIME_POLICIES.includes(contractForm.overtime_policy)) errs.push('Overtime policy is invalid')
    if (!BENEFIT_OPTIONS.includes(contractForm.food)) errs.push('Food benefit value is invalid')
    if (!BENEFIT_OPTIONS.includes(contractForm.accommodation)) errs.push('Accommodation benefit value is invalid')
    if (!BENEFIT_OPTIONS.includes(contractForm.transport)) errs.push('Transport benefit value is invalid')
    if (isNaN(leave) || leave < 0 || leave > 90) errs.push('Annual leave days must be between 0 and 90')
    return errs
  }

  const saveContractDetails = async () => {
    const errors = validateContractForm()
    if (errors.length > 0) {
      showToast(`❌ Please fix the following:\n- ${errors.join('\n- ')}`, 'error')
      return
    }
    const payload = {
      contract: {
        period_years: Number(contractForm.period_years),
        renewable: !!contractForm.renewable,
        hours_per_day: Number(contractForm.hours_per_day),
        days_per_week: Number(contractForm.days_per_week),
        overtime_policy: contractForm.overtime_policy,
        weekly_off_days: contractForm.weekly_off_days,
        benefits: {
          food: contractForm.food,
          accommodation: contractForm.accommodation,
          transport: contractForm.transport
        },
        annual_leave_days: Number(contractForm.annual_leave_days)
      }
    }
    try {
      await jobService.updateJob(contractDraftId, payload)
      const updatedDrafts = await jobService.getDraftJobs()
      setDrafts(updatedDrafts)
      showToast('✅ Contract details saved.', 'success')
      setShowContractModal(false)
      setContractDraftId(null)
    } catch (e) {
      console.error('Failed to save contract details:', e)
      showToast('❌ Failed to save contract details.', 'error')
    }
  }

  // Debounced search to reduce API calls
  const debouncedSearch = useMemo(
    () => {
      const debounce = (func, delay) => {
        let timeoutId
        return (...args) => {
          clearTimeout(timeoutId)
          timeoutId = setTimeout(() => func.apply(null, args), delay)
        }
      }
      return debounce((searchTerm) => {
        setFilters(prev => ({ ...prev, search: searchTerm }))
        setPagination(prev => ({ ...prev, page: 1 }))
      }, 300)
    },
    []
  )

  const handleFilterChange = useCallback((key, value) => {
    if (key === 'search') {
      debouncedSearch(value)
    } else {
      setFilters(prev => ({ ...prev, [key]: value }))
      setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page
    }
  }, [debouncedSearch])

  const handlePageChange = useCallback((newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }))
    // Scroll to top for better UX
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // Header checkbox ref to support indeterminate state
  const headerCheckboxRef = useRef(null)
  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = selectedDrafts.size > 0 && selectedDrafts.size < drafts.length
    }
  }, [selectedDrafts, drafts])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Posting details helpers
  const openPostingDetails = (draft) => {
    setPostingDetailsDraftId(draft.id)
    setPostingDetailsForm({
      city: draft.city || '',
      lt_number: draft.lt_number || '',
      chalani_number: draft.chalani_number || '',
      approval_date: draft.approval_date ? draft.approval_date.substring(0, 10) : '',
      posting_date: draft.posting_date ? draft.posting_date.substring(0, 10) : '',
      announcement_type: draft.announcement_type || 'normal',
      administrative_notes: draft.administrative_notes || ''
    })
    setShowPostingDetailsModal(true)
  }

  const handlePostingDetailsChange = (field, value) => {
    setPostingDetailsForm(prev => ({ ...prev, [field]: value }))
  }

  const validatePostingDetails = () => {
    const errs = []
    if (postingDetailsForm.approval_date && isNaN(Date.parse(postingDetailsForm.approval_date))) {
      errs.push('Approval date must be a valid date')
    }
    if (postingDetailsForm.posting_date && isNaN(Date.parse(postingDetailsForm.posting_date))) {
      errs.push('Posting date must be a valid date')
    }
    if (!ANNOUNCEMENT_TYPES.includes(postingDetailsForm.announcement_type)) {
      errs.push('Announcement type is invalid')
    }
    return errs
  }

  const savePostingDetails = async () => {
    const errors = validatePostingDetails()
    if (errors.length > 0) {
      showToast(`❌ Please fix the following:\n- ${errors.join('\n- ')}`, 'error')
      return
    }
    // Convert dates to ISO (at midnight) for consistency
    const toIso = (d) => (d ? new Date(`${d}T00:00:00.000Z`).toISOString() : '')
    const payload = {
      city: postingDetailsForm.city,
      lt_number: postingDetailsForm.lt_number,
      chalani_number: postingDetailsForm.chalani_number,
      approval_date: postingDetailsForm.approval_date ? toIso(postingDetailsForm.approval_date) : '',
      posting_date: postingDetailsForm.posting_date ? toIso(postingDetailsForm.posting_date) : '',
      announcement_type: postingDetailsForm.announcement_type,
      administrative_notes: postingDetailsForm.administrative_notes
    }
    try {
      await jobService.updateJob(postingDetailsDraftId, payload)
      const updatedDrafts = await jobService.getDraftJobs()
      setDrafts(updatedDrafts)
      showToast('✅ Posting details saved.', 'success')
      setShowPostingDetailsModal(false)
      setPostingDetailsDraftId(null)
    } catch (e) {
      console.error('Failed to save posting details:', e)
      showToast('❌ Failed to save posting details.', 'error')
    }
  }

  // Legacy functions removed - now handled by JobCreationWizard

  // Enhanced handlers for new features
  const handleCompanySelect = (company) => {
    setFormData(prev => ({
      ...prev,
      company: company.name,
      companyAddress: company.address,
      city: company.city,
      country: company.country
    }))
    setShowCompanyDropdown(false)
  }

  const handleJobTitleSelect = (jobTitle) => {
    setSelectedJobTitle(jobTitle.title)
    setFormData(prev => ({
      ...prev,
      title: jobTitle.title,
      tags: jobTitle.tags,
      jobTitleTag: jobTitle.title
    }))
    setShowJobTitleDropdown(false)
  }

  const handleNotesTemplateSelect = (template) => {
    setFormData(prev => ({
      ...prev,
      notes: prev.notes ? `${prev.notes}\n${template}` : template
    }))
    setShowNotesDropdown(false)
  }

  const handlePhoneChunkChange = (index, value) => {
    const newChunks = [...formData.phoneNumberChunks]
    newChunks[index] = value
    setFormData(prev => ({
      ...prev,
      phoneNumberChunks: newChunks,
      contact_phone: newChunks.join('')
    }))
  }

  const speakPhoneNumber = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(
        formData.phoneNumberChunks.filter(chunk => chunk).join(' ')
      )
      utterance.rate = 0.7
      speechSynthesis.speak(utterance)
    }
  }

  const handleExpenseToggle = (item, payer) => {
    setFormData(prev => {
      const newConfig = { ...prev.expenseConfig }
      const oppositeKey = payer === 'employerPays' ? 'candidatePays' : 'employerPays'
      
      // Remove from opposite array if it exists
      newConfig[oppositeKey] = newConfig[oppositeKey].filter(exp => exp !== item)
      
      // Toggle in current array
      if (newConfig[payer].includes(item)) {
        newConfig[payer] = newConfig[payer].filter(exp => exp !== item)
      } else {
        newConfig[payer] = [...newConfig[payer], item]
      }
      
      return {
        ...prev,
        expenseConfig: newConfig
      }
    })
  }

  const handleImageUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setFormData(prev => ({
          ...prev,
          imageUrl: e.target.result,
          attachments: [...prev.attachments, {
            type: 'image',
            name: file.name,
            url: e.target.result,
            file: file
          }]
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUrlSubmit = () => {
    if (formData.newspaperUrl) {
      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, {
          type: 'url',
          name: 'Newspaper URL',
          url: formData.newspaperUrl
        }]
      }))
    }
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setShowCompanyDropdown(false)
        setShowJobTitleDropdown(false)
        setShowNotesDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const filteredCompanies = companies.filter(company => 
    company.name.toLowerCase().includes(formData.company.toLowerCase())
  )

  const filteredJobTitles = jobTitleDictionary.filter(job => 
    job.title.toLowerCase().includes(formData.title.toLowerCase())
  )

  const handleBulkCreate = async () => {
    try {
      const bulkDrafts = []
      
      for (const countryData of bulkCreateCountries) {
        for (let i = 0; i < countryData.jobCount; i++) {
          const newDraft = {
            title: bulkCreateJobType,
            company: `Company ${i + 1}`,
            country: countryData.country,
            city: '',
            published_at: null,
            salary: '',
            currency: 'AED',
            salary_amount: 0,
            requirements: [],
            description: `${bulkCreateJobType} position in ${countryData.country}`,
            tags: jobTitleDictionary.find(job => job.title === bulkCreateJobType)?.tags || [],
            category: bulkCreateJobType,
            employment_type: 'Full-time',
            working_hours: '8 hours/day',
            accommodation: 'Provided',
            food: 'Provided',
            visa_status: 'Company will provide',
            contract_duration: '2 years',
            contact_person: '',
            contact_phone: '',
            contact_email: '',
            expenses: [],
            notes: `Bulk created draft for ${countryData.country}`,
            created_at: new Date().toISOString()
          }
          bulkDrafts.push(newDraft)
        }
      }

      // Create all drafts
      for (const draft of bulkDrafts) {
        await jobService.createDraftJob(draft)
      }
      
      // Show success toast
      showToast(`✅ Successfully created ${bulkDrafts.length} bulk drafts!`, 'success')
      
      // Refresh drafts data
      const updatedDrafts = await jobService.getDraftJobs()
      setDrafts(updatedDrafts)
      setShowBulkCreateModal(false)
      
      // Reset bulk create form
      setBulkCreateCountries([{ country: 'UAE', jobCount: 3 }])
      setBulkCreateJobType('Cook')
    } catch (error) {
      console.error('Failed to create bulk drafts:', error)
      showToast('❌ Failed to create bulk drafts. Please try again.', 'error')
    }
  }

  const addBulkCountry = () => {
    setBulkCreateCountries(prev => [...prev, { country: 'UAE', jobCount: 1 }])
  }

  const updateBulkCountry = (index, field, value) => {
    setBulkCreateCountries(prev => {
      const updated = [...prev]
      updated[index][field] = value
      return updated
    })
  }

  const removeBulkCountry = (index) => {
    setBulkCreateCountries(prev => prev.filter((_, i) => i !== index))
  }

  const handleCreateDraft = async () => {
    try {
      const newDraft = {
        title: formData.title,
        company: formData.company,
        companyAddress: formData.companyAddress,
        country: formData.country,
        city: formData.city,
        published_at: null,
        salary: `${formData.salary} ${formData.currency}`,
        currency: formData.currency,
        salary_amount: parseInt(formData.salary) || 0,
        requirements: formData.requirements.split('\n').filter(req => req.trim()),
        description: formData.description,
        tags: formData.tags,
        category: formData.title,
        employment_type: formData.employment_type,
        working_hours: formData.working_hours,
        accommodation: formData.accommodation,
        food: formData.food,
        visa_status: formData.visa_status,
        contract_duration: formData.contract_duration,
        contact_person: formData.contact_person,
        contact_phone: formData.phoneNumberChunks.join('') || formData.contact_phone,
        contact_email: formData.contact_email,
        expenses: formData.expenses,
        expenseConfig: formData.expenseConfig,
        notes: formData.notes,
        attachments: formData.attachments,
        created_at: editingDraft ? editingDraft.created_at : new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      if (editingDraft) {
        // Update existing draft
        await jobService.updateJob(editingDraft.id, newDraft)
        showToast('✅ Draft updated successfully!', 'success')
      } else {
        // Create new draft
        await jobService.createDraftJob(newDraft)
        showToast('✅ Draft created successfully!', 'success')
      }
      
      // Refresh drafts data
      const updatedDrafts = await jobService.getDraftJobs()
      setDrafts(updatedDrafts)
      setShowCreateModal(false)
      setEditingDraft(null)
      
      // Reset form
      resetForm()
    } catch (error) {
      console.error('Failed to save draft:', error)
      showToast(`❌ Failed to ${editingDraft ? 'update' : 'create'} draft. Please try again.`, 'error')
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      company: '',
      companyAddress: '',
      country: '',
      city: '',
      salary: '',
      currency: 'AED',
      description: '',
      requirements: '',
      tags: [],
      employment_type: 'Full-time',
      working_hours: '8 hours/day',
      accommodation: 'Provided',
      food: 'Provided',
      visa_status: 'Company will provide',
      contract_duration: '2 years',
      contact_person: '',
      contact_phone: '',
      contact_email: '',
      expenses: [],
      notes: '',
      ocrText: '',
      imageUrl: '',
      newspaperUrl: '',
      phoneNumberChunks: ['', '', '', ''],
      jobTitleTag: '',
      expenseConfig: {
        employerPays: [],
        candidatePays: []
      },
      attachments: []
    })
  }


  const handleDraftSelect = (draftId) => {
    const newSelected = new Set(selectedDrafts)
    if (newSelected.has(draftId)) {
      newSelected.delete(draftId)
    } else {
      newSelected.add(draftId)
    }
    setSelectedDrafts(newSelected)
  }

  const handleDraftPublish = async (draftId) => {
    try {
      setPublishingDrafts(prev => new Set([...prev, draftId]))
      await jobService.publishJob(draftId)
      
      // Show success toast
      showToast('✅ Draft published successfully! Job is now live.', 'success')
      
      // Refresh drafts data
      const updatedDrafts = await jobService.getDraftJobs()
      setDrafts(updatedDrafts)
      
      // Reset pagination if needed
      setPagination(prev => ({
        ...prev,
        total: updatedDrafts.length
      }))
    } catch (error) {
      console.error('Failed to publish draft:', error)
      showToast('❌ Failed to publish draft. Please try again.', 'error')
    } finally {
      setPublishingDrafts(prev => {
        const newSet = new Set(prev)
        newSet.delete(draftId)
        return newSet
      })
    }
  }

  const handleDraftDelete = async (draftId) => {
    if (!confirm('Are you sure you want to delete this draft? This action cannot be undone.')) {
      return
    }
    
    try {
      setDeletingDrafts(prev => new Set([...prev, draftId]))
      await jobService.deleteJob(draftId)
      
      // Show success toast
      showToast('✅ Draft deleted successfully!', 'success')
      
      // Refresh data
      const updatedDrafts = await jobService.getDraftJobs()
      setDrafts(updatedDrafts)
      
      // Reset pagination if needed
      setPagination(prev => ({
        ...prev,
        total: updatedDrafts.length
      }))
      
      // Remove from selected if it was selected
      setSelectedDrafts(prev => {
        const newSet = new Set(prev)
        newSet.delete(draftId)
        return newSet
      })
    } catch (error) {
      console.error('Failed to delete draft:', error)
      showToast('❌ Failed to delete draft. Please try again.', 'error')
    } finally {
      setDeletingDrafts(prev => {
        const newSet = new Set(prev)
        newSet.delete(draftId)
        return newSet
      })
    }
  }

  const handleDraftEdit = (draft) => {
    // Set the draft for editing and open modal
    setEditingDraft(draft)
    setFormData({
      title: draft.title || '',
      company: draft.company || '',
      companyAddress: draft.companyAddress || '',
      country: draft.country || '',
      city: draft.city || '',
      salary: draft.salary_amount?.toString() || '',
      currency: draft.currency || 'AED',
      description: draft.description || '',
      requirements: Array.isArray(draft.requirements) ? draft.requirements.join('\n') : (draft.requirements || ''),
      tags: draft.tags || [],
      employment_type: draft.employment_type || 'Full-time',
      working_hours: draft.working_hours || '8 hours/day',
      accommodation: draft.accommodation || 'Provided',
      food: draft.food || 'Provided',
      visa_status: draft.visa_status || 'Company will provide',
      contract_duration: draft.contract_duration || '2 years',
      contact_person: draft.contact_person || '',
      contact_phone: draft.contact_phone || '',
      contact_email: draft.contact_email || '',
      expenses: draft.expenses || [],
      notes: draft.notes || '',
      ocrText: '',
      imageUrl: '',
      newspaperUrl: '',
      phoneNumberChunks: draft.contact_phone ? 
        [draft.contact_phone.slice(0,4), draft.contact_phone.slice(4,8), draft.contact_phone.slice(8,12), draft.contact_phone.slice(12,16)] : 
        ['', '', '', ''],
      jobTitleTag: draft.title || '',
      expenseConfig: draft.expenseConfig || {
        employerPays: [],
        candidatePays: []
      },
      attachments: draft.attachments || []
    })
    setShowCreateModal(true)
  }

  // Get unique values for filter options
  const countries = [...new Set(drafts.map(draft => draft.country).filter(Boolean))]
  const companyOptions = [...new Set(drafts.map(draft => draft.company).filter(Boolean))]
  const categories = [...new Set(drafts.map(draft => draft.category || draft.title).filter(Boolean))]

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          {/* Header Skeleton */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-64"></div>
            </div>
            <div className="flex space-x-3">
              <div className="h-10 bg-gray-200 rounded w-28"></div>
              <div className="h-10 bg-gray-200 rounded w-32"></div>
            </div>
          </div>

          {/* Search and Controls Skeleton */}
          <div className="flex justify-between items-center mb-6">
            <div className="h-10 bg-gray-200 rounded w-80"></div>
            <div className="flex space-x-2">
              <div className="h-10 w-10 bg-gray-200 rounded"></div>
              <div className="h-10 w-10 bg-gray-200 rounded"></div>
            </div>
          </div>

          {/* Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Status bar */}
                <div className="h-1 bg-gray-200"></div>
                
                <div className="p-6 pt-12">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="flex items-center mb-2">
                        <div className="w-8 h-8 bg-gray-200 rounded-lg mr-3"></div>
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                      </div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-gray-200 rounded mr-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-gray-200 rounded mr-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-gray-200 rounded mr-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-28"></div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex space-x-2 mb-4">
                    <div className="h-6 bg-gray-200 rounded-md w-16"></div>
                    <div className="h-6 bg-gray-200 rounded-md w-20"></div>
                    <div className="h-6 bg-gray-200 rounded-md w-12"></div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2 mb-4">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                    <div className="flex space-x-2">
                      <div className="h-7 bg-gray-200 rounded w-16"></div>
                      <div className="h-7 bg-gray-200 rounded w-12"></div>
                    </div>
                    <div className="h-8 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-16">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">Failed to load drafts</h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              We encountered an issue while loading your drafts. Please try again or contact support if the problem persists.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button 
                onClick={() => window.location.reload()} 
                className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
              >
                Try Again
              </button>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-6 py-3 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Draft
              </button>
            </div>
            {error.message && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700 font-mono">{error.message}</p>
              </div>
            )}

      {/* Cutout Modal */}
      {showCutoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Job Advert Cutout</h2>
              <button onClick={() => setShowCutoutModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {cutoutForm.existingUrl && !cutoutForm.previewUrl && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Existing Cutout</label>
                  <img src={cutoutForm.existingUrl} alt="Cutout" className="w-full max-h-64 object-contain rounded-md border" />
                </div>
              )}
              {cutoutForm.previewUrl && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
                  <img src={cutoutForm.previewUrl} alt="Preview" className="w-full max-h-64 object-contain rounded-md border" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Image</label>
                <input type="file" accept="image/*" onChange={(e) => handleCutoutFile(e.target.files[0])} />
                <p className="text-xs text-gray-500 mt-1">Supported: PNG, JPG. In production, this will POST to /agencies/:license/job-postings/:id/cutout</p>
              </div>
            </div>
            <div className="p-5 border-t border-gray-200 flex items-center justify-between">
              <button onClick={() => removeCutout(true)} className="text-red-600 text-sm">Remove Cutout</button>
              <div className="space-x-2">
                <button onClick={() => setShowCutoutModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
                <button onClick={saveCutout} className="btn-primary text-sm px-4 py-2">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expenses Modal */}
      {showExpensesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Expenses</h2>
              <button onClick={() => setShowExpensesModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">Specify cost-sharing for various expense types.</p>
                <button onClick={addExpenseRow} className="btn-secondary text-sm">Add Expense</button>
              </div>
              {expensesForm.map((e, idx) => (
                <div key={idx} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium text-gray-900">Expense #{idx+1}</h3>
                    {expensesForm.length > 1 && (
                      <button onClick={() => removeExpenseRow(idx)} className="text-red-600 hover:text-red-800 text-sm">Remove</button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Expense Type *</label>
                      <select value={e.type} onChange={(ev) => handleExpenseChange(idx, 'type', ev.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
                        {EXPENSE_TYPES.map(t => (<option key={t} value={t}>{t}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Who Pays *</label>
                      <select value={e.payer} onChange={(ev) => handleExpenseChange(idx, 'payer', ev.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
                        {PAYER_OPTIONS.map(p => (<option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>))}
                      </select>
                    </div>
                    <div className="flex items-center mt-6">
                      <input id={`is_free_${idx}`} type="checkbox" checked={e.is_free} onChange={(ev) => handleExpenseChange(idx, 'is_free', ev.target.checked)} className="mr-2 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                      <label htmlFor={`is_free_${idx}`} className="text-sm text-gray-700">Is Free</label>
                    </div>
                  </div>
                  {!e.is_free && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                        <input type="number" min="0" value={e.amount} onChange={(ev) => handleExpenseChange(idx, 'amount', ev.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="0" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Currency *</label>
                        <select value={e.currency} onChange={(ev) => handleExpenseChange(idx, 'currency', ev.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
                          {CURRENCIES.map(c => (<option key={c} value={c}>{c}</option>))}
                        </select>
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <input type="text" value={e.notes} onChange={(ev) => handleExpenseChange(idx, 'notes', ev.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Any notes..." />
                  </div>
                </div>
              ))}
            </div>
            <div className="p-5 border-t border-gray-200 flex items-center justify-end space-x-2">
              <button onClick={() => setShowExpensesModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
              <button onClick={saveExpenses} className="btn-primary text-sm px-4 py-2">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Tags & Canonical Titles Modal */}
      {showTagsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Tags & Canonical Titles</h2>
              <button onClick={() => setShowTagsModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Skills */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Skills</label>
                  <button onClick={() => setTagsForm(prev => ({ ...prev, skills: addArrayItem(prev.skills) }))} className="text-sm text-primary-600">Add</button>
                </div>
                {tagsForm.skills.map((s, i) => (
                  <div key={i} className="flex items-center mb-2 gap-2">
                    <input type="text" value={s} onChange={(e) => setTagsForm(prev => ({ ...prev, skills: updateArrayField(prev.skills, i, e.target.value) }))} className="flex-1 px-3 py-2 border border-gray-300 rounded-md" placeholder="e.g., Cooking" />
                    {tagsForm.skills.length > 1 && (
                      <button onClick={() => setTagsForm(prev => ({ ...prev, skills: removeArrayItem(prev.skills, i) }))} className="text-red-600 text-sm">Remove</button>
                    )}
                  </div>
                ))}
              </div>

              {/* Education Requirements */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Education Requirements</label>
                  <button onClick={() => setTagsForm(prev => ({ ...prev, education_requirements: addArrayItem(prev.education_requirements) }))} className="text-sm text-primary-600">Add</button>
                </div>
                {tagsForm.education_requirements.map((s, i) => (
                  <div key={i} className="flex items-center mb-2 gap-2">
                    <input type="text" value={s} onChange={(e) => setTagsForm(prev => ({ ...prev, education_requirements: updateArrayField(prev.education_requirements, i, e.target.value) }))} className="flex-1 px-3 py-2 border border-gray-300 rounded-md" placeholder="e.g., +2 Passed" />
                    {tagsForm.education_requirements.length > 1 && (
                      <button onClick={() => setTagsForm(prev => ({ ...prev, education_requirements: removeArrayItem(prev.education_requirements, i) }))} className="text-red-600 text-sm">Remove</button>
                    )}
                  </div>
                ))}
              </div>

              {/* Experience */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Experience</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Years</label>
                    <input type="number" min="0" value={tagsForm.experience.min_years} onChange={(e) => setTagsForm(prev => ({ ...prev, experience: { ...prev.experience, min_years: e.target.value } }))} className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Years</label>
                    <input type="number" min="0" value={tagsForm.experience.preferred_years} onChange={(e) => setTagsForm(prev => ({ ...prev, experience: { ...prev.experience, preferred_years: e.target.value } }))} className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Domains</label>
                    {/* Domains comma-separated input */}
                    <input type="text" value={(tagsForm.experience.domains || []).join(', ')} onChange={(e) => setTagsForm(prev => ({ ...prev, experience: { ...prev.experience, domains: e.target.value.split(',').map(v => v.trim()) } }))} className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="e.g., Hospitality, Logistics" />
                  </div>
                </div>
              </div>

              {/* Canonical Titles */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Canonical Titles</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">IDs (comma-separated)</label>
                    <input type="text" value={(tagsForm.canonical_titles.ids || []).join(', ')} onChange={(e) => setTagsForm(prev => ({ ...prev, canonical_titles: { ...prev.canonical_titles, ids: e.target.value.split(',').map(v => v.trim()).filter(Boolean) } }))} className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="e.g., 101, 202" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Names (comma-separated)</label>
                    <input type="text" value={(tagsForm.canonical_titles.names || []).join(', ')} onChange={(e) => setTagsForm(prev => ({ ...prev, canonical_titles: { ...prev.canonical_titles, names: e.target.value.split(',').map(v => v.trim()).filter(Boolean) } }))} className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="e.g., Cook, Driver" />
                  </div>
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-gray-200 flex items-center justify-end space-x-2">
              <button onClick={() => setShowTagsModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
              <button onClick={saveTags} className="btn-primary text-sm px-4 py-2">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Positions Modal */}
      {showPositionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Positions</h2>
              <button onClick={() => setShowPositionsModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">Define one or more positions for this posting.</p>
                <button onClick={addPositionRow} className="btn-secondary text-sm">Add Position</button>
              </div>
              {positionsForm.map((p, idx) => (
                <div key={idx} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium text-gray-900">Position #{idx+1}</h3>
                    {positionsForm.length > 1 && (
                      <button onClick={() => removePositionRow(idx)} className="text-red-600 hover:text-red-800 text-sm">Remove</button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                      <input type="text" value={p.title} onChange={(e) => handlePositionChange(idx, 'title', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="e.g., Cook" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Vacancies (Male)</label>
                      <input type="number" min="0" value={p.vacancies_male} onChange={(e) => handlePositionChange(idx, 'vacancies_male', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="0" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Vacancies (Female)</label>
                      <input type="number" min="0" value={p.vacancies_female} onChange={(e) => handlePositionChange(idx, 'vacancies_female', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="0" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Salary Amount *</label>
                      <input type="number" min="0" value={p.salary_amount} onChange={(e) => handlePositionChange(idx, 'salary_amount', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="1200" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Currency *</label>
                      <select value={p.salary_currency} onChange={(e) => handlePositionChange(idx, 'salary_currency', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
                        {CURRENCIES.map(c => (<option key={c} value={c}>{c}</option>))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Hours/Day</label>
                      <input type="number" min="1" max="24" value={p.overrides.hours_per_day} onChange={(e) => handlePositionChange(idx, 'overrides.hours_per_day', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="8" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Days/Week</label>
                      <input type="number" min="1" max="7" value={p.overrides.days_per_week} onChange={(e) => handlePositionChange(idx, 'overrides.days_per_week', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="6" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Overtime Policy</label>
                      <select value={p.overrides.overtime_policy} onChange={(e) => handlePositionChange(idx, 'overrides.overtime_policy', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
                        {OVERTIME_POLICIES.map(op => (<option key={op} value={op}>{op.replaceAll('_',' ').replace(/\b\w/g, c => c.toUpperCase())}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Weekly Off Days</label>
                      <input type="text" value={p.overrides.weekly_off_days} onChange={(e) => handlePositionChange(idx, 'overrides.weekly_off_days', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="e.g., Friday" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <input type="text" value={p.overrides.notes} onChange={(e) => handlePositionChange(idx, 'overrides.notes', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Position specific notes" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Food</label>
                      <select value={p.overrides.benefits.food} onChange={(e) => handlePositionChange(idx, 'overrides.benefits.food', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
                        {BENEFIT_OPTIONS.map(b => (<option key={b} value={b}>{b.replaceAll('_',' ').replace(/\b\w/g, c => c.toUpperCase())}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Accommodation</label>
                      <select value={p.overrides.benefits.accommodation} onChange={(e) => handlePositionChange(idx, 'overrides.benefits.accommodation', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
                        {BENEFIT_OPTIONS.map(b => (<option key={b} value={b}>{b.replaceAll('_',' ').replace(/\b\w/g, c => c.toUpperCase())}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Transport</label>
                      <select value={p.overrides.benefits.transport} onChange={(e) => handlePositionChange(idx, 'overrides.benefits.transport', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
                        {BENEFIT_OPTIONS.map(b => (<option key={b} value={b}>{b.replaceAll('_',' ').replace(/\b\w/g, c => c.toUpperCase())}</option>))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-5 border-t border-gray-200 flex items-center justify-end space-x-2">
              <button onClick={() => setShowPositionsModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
              <button onClick={savePositions} className="btn-primary text-sm px-4 py-2">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Contract Details Modal */}
      {showContractModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Contract Details</h2>
              <button onClick={() => setShowContractModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contract Period (years) *</label>
                  <input type="number" min="1" value={contractForm.period_years} onChange={(e) => handleContractChange('period_years', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hours/Day *</label>
                  <input type="number" min="1" max="24" value={contractForm.hours_per_day} onChange={(e) => handleContractChange('hours_per_day', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="8" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Days/Week *</label>
                  <input type="number" min="1" max="7" value={contractForm.days_per_week} onChange={(e) => handleContractChange('days_per_week', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="6" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Overtime Policy *</label>
                  <select value={contractForm.overtime_policy} onChange={(e) => handleContractChange('overtime_policy', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
                    {OVERTIME_POLICIES.map(p => (<option key={p} value={p}>{p.replaceAll('_',' ').replace(/\b\w/g, c => c.toUpperCase())}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weekly Off Days</label>
                  <input type="text" value={contractForm.weekly_off_days} onChange={(e) => handleContractChange('weekly_off_days', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="e.g., Friday" />
                </div>
                <div className="flex items-center mt-6">
                  <input id="renewable" type="checkbox" checked={contractForm.renewable} onChange={(e) => handleContractChange('renewable', e.target.checked)} className="mr-2 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                  <label htmlFor="renewable" className="text-sm text-gray-700">Renewable</label>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Food</label>
                  <select value={contractForm.food} onChange={(e) => handleContractChange('food', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
                    {BENEFIT_OPTIONS.map(b => (<option key={b} value={b}>{b.replaceAll('_',' ').replace(/\b\w/g, c => c.toUpperCase())}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Accommodation</label>
                  <select value={contractForm.accommodation} onChange={(e) => handleContractChange('accommodation', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
                    {BENEFIT_OPTIONS.map(b => (<option key={b} value={b}>{b.replaceAll('_',' ').replace(/\b\w/g, c => c.toUpperCase())}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transport</label>
                  <select value={contractForm.transport} onChange={(e) => handleContractChange('transport', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
                    {BENEFIT_OPTIONS.map(b => (<option key={b} value={b}>{b.replaceAll('_',' ').replace(/\b\w/g, c => c.toUpperCase())}</option>))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Annual Leave Days *</label>
                  <input type="number" min="0" max="90" value={contractForm.annual_leave_days} onChange={(e) => handleContractChange('annual_leave_days', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="30" />
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-gray-200 flex items-center justify-end space-x-2">
              <button onClick={() => setShowContractModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
              <button onClick={saveContractDetails} className="btn-primary text-sm px-4 py-2">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Posting Details Modal */}
      {showPostingDetailsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Posting Details</h2>
              <button onClick={() => setShowPostingDetailsModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input type="text" value={postingDetailsForm.city} onChange={(e) => handlePostingDetailsChange('city', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="e.g., Dubai" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">LT Number</label>
                  <input type="text" value={postingDetailsForm.lt_number} onChange={(e) => handlePostingDetailsChange('lt_number', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="e.g., LT-12345" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Chalani Number</label>
                  <input type="text" value={postingDetailsForm.chalani_number} onChange={(e) => handlePostingDetailsChange('chalani_number', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="e.g., CH-9087" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Announcement Type</label>
                  <select value={postingDetailsForm.announcement_type} onChange={(e) => handlePostingDetailsChange('announcement_type', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
                    {ANNOUNCEMENT_TYPES.map(t => (<option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Approval Date</label>
                  <input type="date" value={postingDetailsForm.approval_date} onChange={(e) => handlePostingDetailsChange('approval_date', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Posting Date</label>
                  <input type="date" value={postingDetailsForm.posting_date} onChange={(e) => handlePostingDetailsChange('posting_date', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea rows={3} value={postingDetailsForm.administrative_notes} onChange={(e) => handlePostingDetailsChange('administrative_notes', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Any administrative notes..."></textarea>
              </div>
            </div>
            <div className="p-5 border-t border-gray-200 flex items-center justify-end space-x-2">
              <button onClick={() => setShowPostingDetailsModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
              <button onClick={savePostingDetails} className="btn-primary text-sm px-4 py-2">Save</button>
            </div>
          </div>
        </div>
      )}
          </div>
        </div>
      </div>
    )
  }

  // Handle select all drafts
  const handleSelectAll = () => {
    if (selectedDrafts.size === drafts.length) {
      setSelectedDrafts(new Set())
    } else {
      setSelectedDrafts(new Set(drafts.map(draft => draft.id)))
    }
  }

  // Render grid view
  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-4">
      {drafts.length > 0 ? (
        drafts.map(draft => (
          <InteractiveCard key={draft.id} hoverable clickable className="p-4 border-l-4 border-orange-500 shadow-md">
            <div className="flex items-start justify-between mb-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                <div className="w-2 h-2 bg-orange-400 rounded-full mr-1.5"></div>
                Draft
              </span>
            </div>

            <div className="flex items-start space-x-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white text-lg font-medium">
                  {draft.company?.charAt(0) || draft.title?.charAt(0) || 'D'}
                </span>
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {draft.title || 'Untitled Draft'}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {draft.company || 'No Company'}
                </p>

                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-1.5 text-primary-400" />
                    <span>{draft.city || draft.country || 'Location TBD'}</span>
                  </div>
                  {draft.salary && (
                    <div className="flex items-center text-sm text-gray-600">
                      <DollarSign className="w-4 h-4 mr-1.5 text-primary-400" />
                      <span>{draft.salary} {draft.currency || 'AED'}</span>
                    </div>
                  )}
                  <div className="flex items-center text-base text-gray-600">
                    <Calendar className="w-5 h-5 mr-2 text-primary-400" />
                    <span>Created {draft.created_at ? format(new Date(draft.created_at), 'MMM dd, yyyy') : 'Recently'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags */}
            {draft.tags && draft.tags.length > 0 && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  {draft.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full border border-gray-200">
                      {tag}
                    </span>
                  ))}
                  {draft.tags.length > 3 && (
                    <span className="text-sm text-primary-500 font-medium">+{draft.tags.length - 3} more</span>
                  )}
                </div>
              </div>
            )}

            {/* Description Preview */}
            {draft.description && (
              <div className="mb-4">
                <p className="text-base text-gray-600 line-clamp-2">
                  {draft.description}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between items-start pt-6 mt-4 border-t border-gray-200">
              <div className="flex flex-col space-y-3">
                <InteractiveButton
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setPreviewDraft(draft)
                    setShowPreviewModal(true)
                  }}
                  variant="secondary"
                  size="sm"
                  icon={Eye}
                  className="shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  Preview
                </InteractiveButton>

                <InteractiveButton
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    openPositions(draft)
                  }}
                  variant="secondary"
                  size="sm"
                  icon={User}
                  className="shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  Positions
                </InteractiveButton>
                <InteractiveButton
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleEdit(draft)
                  }}
                  variant="secondary"
                  size="sm"
                  icon={Edit}
                  className="shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  Edit
                </InteractiveButton>
              </div>

              <div className="flex flex-col space-y-3">
                <InteractiveButton
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handlePublish(draft.id)
                  }}
                  variant="primary"
                  size="sm"
                  disabled={publishingDrafts.has(draft.id)}
                  loading={publishingDrafts.has(draft.id)}
                  icon={Check}
                  className="shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  {publishingDrafts.has(draft.id) ? 'Publishing...' : 'Publish'}
                </InteractiveButton>

                <InteractiveButton
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleDelete(draft.id)
                  }}
                  variant="ghost"
                  size="sm"
                  disabled={deletingDrafts.has(draft.id)}
                  loading={deletingDrafts.has(draft.id)}
                  icon={Trash2}
                  className="text-red-600 hover:text-red-800 shadow-sm hover:shadow-md transition-shadow duration-200 border border-red-200 hover:border-red-300"
                >
                  {deletingDrafts.has(draft.id) ? 'Deleting...' : 'Delete'}
                </InteractiveButton>
              </div>
            </div>
          </InteractiveCard>
        ))
      ) : (
        <div className="col-span-3 text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No drafts found</h3>
          <p className="text-gray-600 mb-4">
            {Object.values(filters).some(v => v) ? 'No drafts match your current filters.' : 'Create your first draft to get started.'}
          </p>
          <InteractiveButton
            onClick={() => setShowCreateModal(true)}
            variant="primary"
            icon={Plus}
          >
            Create Draft
          </InteractiveButton>
        </div>
      )}
    </div>
  )

  // Render list view
  const renderListView = () => (
    <div className="bg-white rounded-lg border border-gray-200 overflow-visible">
      <table className="w-full table-fixed divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="w-12 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <input
                ref={headerCheckboxRef}
                type="checkbox"
                onChange={handleSelectAll}
                checked={drafts.length > 0 && selectedDrafts.size === drafts.length}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            </th>
            <th scope="col" className="w-[30%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Job Title
            </th>
            <th scope="col" className="w-[16%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Company
            </th>
            <th scope="col" className="w-[12%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Location
            </th>
            <th scope="col" className="w-[8%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Salary
            </th>
            <th scope="col" className="w-[8%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
            <th scope="col" className="w-[8%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="w-[18%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {drafts.length > 0 ? (
            drafts.map(draft => (
              <tr key={draft.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedDrafts.has(draft.id)}
                    onChange={() => handleDraftSelect(draft.id)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">
                          {draft.title?.charAt(0) || 'D'}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                    
                      <div className="text-sm font-medium text-gray-900">
                        {draft.title || 'Untitled Draft'}
                      </div>
                      {draft.tags && draft.tags.length > 0 && (
                        <div className="text-sm text-gray-500">
                          {draft.tags.slice(0, 2).join(', ')}
                          {draft.tags.length > 2 && ` +${draft.tags.length - 2} more`}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{draft.company || 'No Company'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{draft.city || draft.country || 'Location TBD'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {(() => {
                      const amount = draft.salary_amount ?? draft.salary
                      const curr = draft.currency || 'AED'
                      return amount ? `${amount} ${curr}` : 'Not specified'
                    })()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {draft.created_at ? format(new Date(draft.created_at), 'MMM dd, yyyy') : 'Recently'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    <div className="w-1.5 h-1.5 bg-orange-400 rounded-full mr-1.5"></div>
                    Draft
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setPreviewDraft(draft)
                        setShowPreviewModal(true)
                      }}
                      className="text-primary-600 hover:text-primary-900 disabled:opacity-50"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        openPositions(draft)
                      }}
                      className="text-gray-600 hover:text-gray-900 disabled:opacity-50"
                      title="Positions"
                    >
                      <User className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEdit(draft)
                      }}
                      className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSingleDraftPublish(draft.id)
                      }}
                      className="text-green-600 hover:text-green-900 disabled:opacity-50"
                      disabled={publishingDrafts.has(draft.id)}
                      title={publishingDrafts.has(draft.id) ? 'Publishing...' : 'Publish'}
                    >
                      {publishingDrafts.has(draft.id) ? (
                        <div className="animate-spin w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSingleDraftDelete(draft.id)
                      }}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      disabled={deletingDrafts.has(draft.id)}
                      title={deletingDrafts.has(draft.id) ? 'Deleting...' : 'Delete'}
                    >
                      {deletingDrafts.has(draft.id) ? (
                        <div className="animate-spin w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8" className="px-6 py-12 text-center text-sm text-gray-500">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No drafts found</h3>
                <p className="text-gray-600 mb-4">
                  {Object.values(filters).some(v => v) ? 'No drafts match your current filters.' : 'Create your first draft to get started.'}
                </p>
                <InteractiveButton
                  onClick={() => setShowCreateModal(true)}
                  variant="primary"
                  icon={Plus}
                >
                  Create Draft
                </InteractiveButton>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )

  // Handler for refreshing drafts list
  const refreshDrafts = useCallback(async () => {
    try {
      setIsLoading(true)
      const updatedDrafts = await jobService.getDraftJobs()
      setDrafts(updatedDrafts)
      setIsLoading(false)
    } catch (err) {
      setError('Failed to refresh drafts')
      setIsLoading(false)
    }
  }, [])

  // Assign refresh function to ref for child components
  useEffect(() => {
    refreshDraftsRef.current = refreshDrafts
  }, [refreshDrafts])

  // Handlers for draft actions
  const handleSingleDraftPublish = async (draftId) => {
    try {
      setPublishingDrafts(prev => new Set([...prev, draftId]))
      await jobService.publishJob(draftId)
      await refreshDrafts()
      setPublishingDrafts(prev => {
        const next = new Set(prev)
        next.delete(draftId)
        return next
      })
      setShowSuccessToast(true)
      setToastMessage('Draft published successfully')
      setToastType('success')
    } catch (err) {
      setError('Failed to publish draft')
      setPublishingDrafts(prev => {
        const next = new Set(prev)
        next.delete(draftId)
        return next
      })
    }
  }

  const handleSingleDraftDelete = async (draftId) => {
    try {
      setDeletingDrafts(prev => new Set([...prev, draftId]))
      await jobService.deleteJob(draftId)
      await refreshDrafts()
      setDeletingDrafts(prev => {
        const next = new Set(prev)
        next.delete(draftId)
        return next
      })
      setShowSuccessToast(true)
      setToastMessage('Draft deleted successfully')
      setToastType('success')
    } catch (err) {
      setError('Failed to delete draft')
      setDeletingDrafts(prev => {
        const next = new Set(prev)
        next.delete(draftId)
        return next
      })
    }
  }

  const handleSingleDraftEdit = (draft) => {
    setEditingDraft(draft)
    setShowJobWizard(true)
  }

  const handlePreview = (draft) => {
    // Implement preview functionality
    console.log('Preview draft:', draft)
  }

  // Missing handler functions
  const openPositions = (draft) => {
    setPositionsDraftId(draft.id)
    // Initialize positions form based on draft data or defaults
    if (draft.positions && draft.positions.length > 0) {
      setPositionsForm(draft.positions)
    } else {
      // Set default position based on draft data
      setPositionsForm([{
        title: draft.title || '',
        vacancies_male: '',
        vacancies_female: '',
        salary_amount: draft.salary_amount?.toString() || '',
        salary_currency: draft.currency || 'AED',
        overrides: {
          hours_per_day: '',
          days_per_week: '',
          overtime_policy: 'as_per_law',
          weekly_off_days: '',
          benefits: { food: 'provided', accommodation: 'provided', transport: 'provided' },
          notes: ''
        }
      }])
    }
    setShowPositionsModal(true)
  }

  const handleEdit = (draft) => {
    handleSingleDraftEdit(draft)
  }

  const handlePublish = (draftId) => {
    handleSingleDraftPublish(draftId)
  }

  const handleDelete = (draftId) => {
    handleSingleDraftDelete(draftId)
  }

  // Position management handlers
  const handlePositionChange = (index, field, value) => {
    setPositionsForm(prev => {
      const updated = [...prev]
      if (field.includes('.')) {
        // Handle nested field like 'overrides.hours_per_day'
        const [parent, child] = field.split('.')
        if (parent === 'overrides') {
          if (child.startsWith('benefits.')) {
            const benefitKey = child.replace('benefits.', '')
            updated[index] = {
              ...updated[index],
              overrides: {
                ...updated[index].overrides,
                benefits: {
                  ...updated[index].overrides.benefits,
                  [benefitKey]: value
                }
              }
            }
          } else {
            updated[index] = {
              ...updated[index],
              overrides: {
                ...updated[index].overrides,
                [child]: value
              }
            }
          }
        }
      } else {
        updated[index] = { ...updated[index], [field]: value }
      }
      return updated
    })
  }

  const addPositionRow = () => {
    setPositionsForm(prev => [
      ...prev,
      {
        title: '',
        vacancies_male: '',
        vacancies_female: '',
        salary_amount: '',
        salary_currency: 'AED',
        overrides: {
          hours_per_day: '',
          days_per_week: '',
          overtime_policy: 'as_per_law',
          weekly_off_days: '',
          benefits: { food: 'provided', accommodation: 'provided', transport: 'provided' },
          notes: ''
        }
      }
    ])
  }

  const removePositionRow = (index) => {
    setPositionsForm(prev => prev.filter((_, i) => i !== index))
  }

  const validatePositionsForm = () => {
    const errors = []
    positionsForm.forEach((position, idx) => {
      if (!position.title) errors.push(`Position #${idx + 1}: Title is required`)
      const salaryAmount = Number(position.salary_amount)
      if (isNaN(salaryAmount) || salaryAmount <= 0) {
        errors.push(`Position #${idx + 1}: Salary amount must be a positive number`)
      }
    })
    return errors
  }

  const savePositions = async () => {
    const errors = validatePositionsForm()
    if (errors.length > 0) {
      showToast(`❌ Please fix the following:\n- ${errors.join('\n- ')}`, 'error')
      return
    }
    
    try {
      const payload = {
        positions: positionsForm.map(position => ({
          ...position,
          salary_amount: Number(position.salary_amount),
          vacancies_male: Number(position.vacancies_male) || 0,
          vacancies_female: Number(position.vacancies_female) || 0
        }))
      }
      
      await jobService.updateJob(positionsDraftId, payload)
      const updatedDrafts = await jobService.getDraftJobs()
      setDrafts(updatedDrafts)
      showToast('✅ Positions saved successfully.', 'success')
      setShowPositionsModal(false)
      setPositionsDraftId(null)
    } catch (e) {
      console.error('Failed to save positions:', e)
      showToast('❌ Failed to save positions.', 'error')
    }
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Drafts</h1>
          <p className="mt-1 text-sm text-gray-600">
            Create and manage job draft postings before publishing
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <InteractiveButton
            onClick={(e) => {
              e.preventDefault()
              setShowJobWizard(true)
            }}
            variant="primary"
            icon={Plus}
          >
            Create Job Draft
          </InteractiveButton>
          {selectedDrafts.size > 0 && (
            <>
              <InteractiveButton
                onClick={(e) => {
                  e.preventDefault()
                  selectedDrafts.forEach(draftId => handleSingleDraftPublish(draftId))
                  setSelectedDrafts(new Set())
                }}
                variant="primary"
                size="sm"
                disabled={publishingDrafts.size > 0}
                loading={publishingDrafts.size > 0}
                icon={Check}
              >
                Publish ({selectedDrafts.size})
              </InteractiveButton>
              <InteractiveButton
                onClick={async (e) => {
                  e.preventDefault()
                  try {
                    const deletePromises = Array.from(selectedDrafts).map(draftId => 
                      jobService.deleteJob(draftId)
                    )
                    await Promise.all(deletePromises)
                    
                    // Refresh drafts data
                    const updatedDrafts = await jobService.getDraftJobs()
                    setDrafts(updatedDrafts)
                    setSelectedDrafts(new Set())
                  } catch (error) {
                    console.error('Failed to delete drafts:', error)
                  }
                }}
                variant="danger"
                size="sm"
                icon={Trash2}
              >
                Delete ({selectedDrafts.size})
              </InteractiveButton>
            </>
          )}

          

          {/* View Toggle */}
          <div className="flex rounded-md shadow-sm">
            <InteractiveButton
              onClick={(e) => {
                e.preventDefault()
                setViewMode('grid')
              }}
              variant={viewMode === 'grid' ? 'primary' : 'outline'}
              size="sm"
              icon={Grid3X3}
              className="rounded-r-none border-r-0"
            />
            <InteractiveButton
              onClick={(e) => {
                e.preventDefault()
                setViewMode('list')
              }}
              variant={viewMode === 'list' ? 'primary' : 'outline'}
              size="sm"
              icon={List}
              className="rounded-l-none"
            />
          </div>
        </div>
      </div>

      {/* Job Creation Wizard Modal */}
      {showJobWizard && (
        <JobCreationWizard
          isOpen={showJobWizard}
          onClose={() => {
            setShowJobWizard(false)
            setEditingDraft(null)
            refreshDrafts()
          }}
          editDraft={editingDraft}
        />
      )}

      {/* Minimal Filters (like Jobs page) */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search drafts by title, company..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={filters.country}
              onChange={(e) => handleFilterChange('country', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Countries</option>
              {countries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>

            <select
              value={filters.company}
              onChange={(e) => handleFilterChange('company', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Companies</option>
              {companyOptions.map(company => (
                <option key={company} value={company}>{company}</option>
              ))}
            </select>

            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Info */}
      <div className="mb-4 text-sm text-gray-500 flex items-center justify-between">
        <span>
          Showing {drafts.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
        </span>
      </div>

      {/* Drafts View */}
      <div className="grid grid-cols-1 gap-6">
        {viewMode === 'grid' ? renderGridView() : renderListView()}
      </div>

      {/* Interactive Pagination */}
      {drafts.length > 0 && pagination.totalPages > 1 && (
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 bg-white p-4 rounded-lg border border-gray-200">
          <PaginationInfo
            currentPage={pagination.page}
            totalPages={Math.max(1, pagination.totalPages)}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
          />

          <InteractivePagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
            size="md"
          />
        </div>
      )}


      {/* Enhanced Create Draft Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingDraft ? 'Edit Job Draft' : 'Create Single Job Draft'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {editingDraft ? 'Update your job draft details' : 'Create a new job draft from newspaper or manual entry'}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setEditingDraft(null)
                  resetForm()
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              {/* Mode Selection */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Input Method</h3>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setDraftMode('newspaper')}
                    className={`flex items-center px-4 py-2 rounded-lg border-2 transition-colors ${
                      draftMode === 'newspaper'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <Image className="w-5 h-5 mr-2" />
                    From Newspaper
                  </button>
                  <button
                    onClick={() => setDraftMode('manual')}
                    className={`flex items-center px-4 py-2 rounded-lg border-2 transition-colors ${
                      draftMode === 'manual'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <Edit className="w-5 h-5 mr-2" />
                    Manual Entry
                  </button>
                </div>
              </div>
              {/* Newspaper Upload Section */}
              {draftMode === 'newspaper' && (
                <div className="bg-blue-50 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Newspaper Image or URL</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Upload Image</label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="image-upload" />
                        <label htmlFor="image-upload" className="cursor-pointer">
                          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">Click to upload newspaper image</p>
                        </label>
                      </div>
                      {formData.imageUrl && <img src={formData.imageUrl} alt="Uploaded" className="mt-3 w-full h-32 object-cover rounded-lg" />}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Or Enter URL</label>
                      <div className="flex">
                        <input type="url" className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="https://example.com/job-ad" value={formData.newspaperUrl} onChange={(e) => handleInputChange('newspaperUrl', e.target.value)} />
                        <button onClick={handleUrlSubmit} className="px-4 py-2 bg-primary-600 text-white rounded-r-md hover:bg-primary-700"><Link className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Company Information with Auto-suggest */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative dropdown-container">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
                    <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Enter company name" value={formData.company} onChange={(e) => { handleInputChange('company', e.target.value); setShowCompanyDropdown(true); }} onFocus={() => setShowCompanyDropdown(true)} />
                    {showCompanyDropdown && filteredCompanies.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {filteredCompanies.map((company, index) => (
                          <button key={index} onClick={() => handleCompanySelect(company)} className="w-full px-3 py-2 text-left hover:bg-gray-50">
                            <div className="font-medium">{company.name}</div>
                            <div className="text-sm text-gray-600">{company.address}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Address</label>
                    <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Auto-filled from company selection" value={formData.companyAddress} onChange={(e) => handleInputChange('companyAddress', e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Job Title with Dictionary */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative dropdown-container">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Job Title * (Select from dictionary)</label>
                    <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Enter job title" value={formData.title} onChange={(e) => { handleInputChange('title', e.target.value); setShowJobTitleDropdown(true); }} onFocus={() => setShowJobTitleDropdown(true)} />
                    {showJobTitleDropdown && filteredJobTitles.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {filteredJobTitles.map((job, index) => (
                          <button key={index} onClick={() => handleJobTitleSelect(job)} className="w-full px-3 py-2 text-left hover:bg-gray-50">
                            <div className="font-medium">{job.title}</div>
                            <div className="text-sm text-gray-600">Tags: {job.tags.join(', ')}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Selected Tags</label>
                    <div className="min-h-[42px] px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                      {formData.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {formData.tags.map((tag, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                              <Tag className="w-3 h-3 mr-1" />{tag}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm">Tags will appear when you select a job title</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Expense Configuration */}
              <div className="bg-yellow-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4"><Settings className="w-5 h-5 inline mr-2" />Configure Expense Responsibility</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-green-700 mb-3">Employer Pays</h4>
                    <div className="space-y-2">
                      {expenseItems.map((item) => (
                        <label key={item} className="flex items-center">
                          <input type="checkbox" checked={formData.expenseConfig.employerPays.includes(item)} onChange={() => handleExpenseToggle(item, 'employerPays')} className="rounded border-gray-300 text-green-600 focus:ring-green-500 mr-3" />
                          <span className="text-sm text-gray-700">{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-red-700 mb-3">Candidate Pays</h4>
                    <div className="space-y-2">
                      {expenseItems.map((item) => (
                        <label key={item} className="flex items-center">
                          <input type="checkbox" checked={formData.expenseConfig.candidatePays.includes(item)} onChange={() => handleExpenseToggle(item, 'candidatePays')} className="rounded border-gray-300 text-red-600 focus:ring-red-500 mr-3" />
                          <span className="text-sm text-gray-700">{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Phone Number with Speech */}
              <div className="bg-blue-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4"><Phone className="w-5 h-5 inline mr-2" />Contact Phone Number</h3>
                <p className="text-sm text-gray-600 mb-4">Enter in chunks of 4 digits</p>
                <div className="flex items-center space-x-2 mb-3">
                  {formData.phoneNumberChunks.map((chunk, index) => (
                    <input key={index} type="text" maxLength="4" className="w-16 px-2 py-2 text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="0000" value={chunk} onChange={(e) => handlePhoneChunkChange(index, e.target.value.replace(/\D/g, ''))} />
                  ))}
                  <button onClick={speakPhoneNumber} className="px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700" title="Speak phone number"><Volume2 className="w-4 h-4" /></button>
                </div>
              </div>

              {/* Notes with Templates */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Additional Notes</h3>
                  <div className="relative dropdown-container">
                    <button onClick={() => setShowNotesDropdown(!showNotesDropdown)} className="text-sm text-primary-600 hover:text-primary-800 flex items-center">
                      <FileText className="w-4 h-4 mr-1" />Select from Templates
                    </button>
                    {showNotesDropdown && (
                      <div className="absolute right-0 z-10 mt-1 w-80 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {notesTemplates.map((template, index) => (
                          <button key={index} onClick={() => handleNotesTemplateSelect(template)} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 border-b border-gray-100">{template}</button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <textarea rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Enter additional notes..." value={formData.notes} onChange={(e) => handleInputChange('notes', e.target.value)} />
              </div>

              {/* Basic Information */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Country *</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" value={formData.country} onChange={(e) => handleInputChange('country', e.target.value)}>
                      <option value="">Select country</option>
                      <option value="UAE">UAE</option>
                      <option value="Saudi Arabia">Saudi Arabia</option>
                      <option value="Qatar">Qatar</option>
                      <option value="Kuwait">Kuwait</option>
                      <option value="Oman">Oman</option>
                      <option value="Bahrain">Bahrain</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Enter city" value={formData.city} onChange={(e) => handleInputChange('city', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Salary</label>
                    <div className="flex">
                      <input type="number" className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Amount" value={formData.salary} onChange={(e) => handleInputChange('salary', e.target.value)} />
                      <select className="border-t border-b border-r border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-primary-500" value={formData.currency} onChange={(e) => handleInputChange('currency', e.target.value)}>
                        <option value="AED">AED</option>
                        <option value="SAR">SAR</option>
                        <option value="QAR">QAR</option>
                        <option value="KWD">KWD</option>
                        <option value="OMR">OMR</option>
                        <option value="BHD">BHD</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Person</label>
                    <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="HR Contact Name" value={formData.contact_person} onChange={(e) => handleInputChange('contact_person', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
                    <input type="email" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="hr@company.com" value={formData.contact_email} onChange={(e) => handleInputChange('contact_email', e.target.value)} />
                  </div>
                </div>
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Description</label>
                  <textarea rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Enter detailed job description..." value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} />
                </div>
              </div>

              {/* Attachments Display */}
              {formData.attachments.length > 0 && (
                <div className="bg-green-50 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Attached Files/URLs</h3>
                  <div className="space-y-2">
                    {formData.attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white rounded-md border">
                        <div className="flex items-center">
                          {attachment.type === 'image' ? <Image className="w-4 h-4 mr-2" /> : <Globe className="w-4 h-4 mr-2" />}
                          <span className="text-sm font-medium">{attachment.name}</span>
                        </div>
                        <button onClick={() => { setFormData(prev => ({ ...prev, attachments: prev.attachments.filter((_, i) => i !== index) })) }} className="text-red-600 hover:text-red-800">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Modal Actions */}
            <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
              <button 
                onClick={() => {
                  setShowCreateModal(false)
                  setEditingDraft(null)
                  resetForm()
                }} 
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                Cancel
              </button>
              <div className="flex space-x-3">
                <button 
                  onClick={handleCreateDraft} 
                  className="px-6 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {editingDraft ? 'Update Draft' : 'Save as Draft'}
                </button>
                {!editingDraft && (
                  <button 
                    onClick={async () => {
                      try {
                        await handleCreateDraft()
                        // Auto-publish after saving
                        const drafts = await jobService.getDraftJobs()
                        const latestDraft = drafts[drafts.length - 1]
                        if (latestDraft) {
                          await handlePublish(latestDraft.id)
                          showToast('🚀 Draft created and published successfully! Candidates have been notified.', 'success')
                        }
                      } catch (error) {
                        showToast('❌ Failed to publish draft. Please try again.', 'error')
                      }
                    }} 
                    className="px-6 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    Publish and Notify
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Create Modal */}
      {showBulkCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Bulk Create Drafts</h2>
              <button
                onClick={() => setShowBulkCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={bulkCreateJobType}
                  onChange={(e) => setBulkCreateJobType(e.target.value)}
                >
                  <option value="Cook">Cook</option>
                  <option value="Driver">Driver</option>
                  <option value="Cleaner">Cleaner</option>
                  <option value="Security Guard">Security Guard</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Countries</label>
                {bulkCreateCountries.map((countryData, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <select
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={countryData.country}
                      onChange={(e) => updateBulkCountry(index, 'country', e.target.value)}
                    >
                      <option value="UAE">UAE</option>
                      <option value="Saudi Arabia">Saudi Arabia</option>
                      <option value="Qatar">Qatar</option>
                    </select>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={countryData.jobCount}
                      onChange={(e) => updateBulkCountry(index, 'jobCount', parseInt(e.target.value))}
                    />
                    {bulkCreateCountries.length > 1 && (
                      <button
                        onClick={() => removeBulkCountry(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addBulkCountry}
                  className="text-sm text-primary-600 hover:text-primary-800"
                >
                  + Add Country
                </button>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowBulkCreateModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkCreate}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700"
              >
                Create Drafts
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && previewDraft && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Job Preview</h2>
                <p className="text-sm text-gray-600 mt-1">Preview how this job will appear when published</p>
              </div>
              <button
                onClick={() => {
                  setShowPreviewModal(false)
                  setPreviewDraft(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-xl p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{previewDraft.title}</h1>
                <div className="flex items-center text-lg text-gray-700 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-white font-semibold">
                      {previewDraft.company?.charAt(0) || 'C'}
                    </span>
                  </div>
                  <span className="font-medium">{previewDraft.company}</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-primary-500" />
                    <span>{previewDraft.city || previewDraft.country}</span>
                  </div>
                  {previewDraft.salary && (
                    <div className="flex items-center">
                      <DollarSign className="w-5 h-5 mr-2 text-primary-500" />
                      <span>{previewDraft.salary} {previewDraft.currency}</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-primary-500" />
                    <span>Full-time</span>
                  </div>
                </div>
                
                {previewDraft.description && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-700 leading-relaxed">{previewDraft.description}</p>
                  </div>
                )}
                
                {previewDraft.tags && previewDraft.tags.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {previewDraft.tags.map(tag => (
                        <span key={tag} className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowPreviewModal(false)
                  setPreviewDraft(null)
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={async () => {
                  try {
                    await handlePublish(previewDraft.id)
                    setShowPreviewModal(false)
                    setPreviewDraft(null)
                    showToast('🚀 Job published successfully from preview!', 'success')
                  } catch (error) {
                    showToast('❌ Failed to publish job. Please try again.', 'error')
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700"
                disabled={publishingDrafts.has(previewDraft.id)}
              >
                {publishingDrafts.has(previewDraft.id) ? 'Publishing...' : 'Publish Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast Notification */}
      {showSuccessToast && (
        <div className="fixed top-4 right-4 z-50 transform transition-all duration-300 ease-in-out animate-in slide-in-from-right-full">
          <div className={`flex items-center p-4 rounded-lg shadow-xl border-l-4 min-w-[300px] max-w-[500px] ${
            toastType === 'success' 
              ? 'bg-green-50 border-green-500 text-green-800' 
              : toastType === 'error'
              ? 'bg-red-50 border-red-500 text-red-800'
              : 'bg-blue-50 border-blue-500 text-blue-800'
          }`}>
            <div className="flex items-center">
              {toastType === 'success' && (
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-3">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
              {toastType === 'error' && (
                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center mr-3">
                  <X className="w-3 h-3 text-white" />
                </div>
              )}
              {toastType === 'info' && (
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                  <AlertCircle className="w-3 h-3 text-white" />
                </div>
              )}
              <span className="font-medium text-sm">{toastMessage}</span>
            </div>
            <button
              onClick={() => setShowSuccessToast(false)}
              className={`ml-3 p-1 rounded-full hover:bg-opacity-20 ${
                toastType === 'success' 
                  ? 'hover:bg-green-600' 
                  : toastType === 'error'
                  ? 'hover:bg-red-600'
                  : 'hover:bg-blue-600'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      {/* Job Creation Wizard */}
      <JobCreationWizard
        isOpen={showJobWizard}
        onClose={() => setShowJobWizard(false)}
        onJobCreated={(jobIds) => {
          // Refresh drafts after job creation
          const fetchDrafts = async () => {
            try {
              const updatedDrafts = await jobService.getDraftJobs()
              setDrafts(updatedDrafts)
              
              if (Array.isArray(jobIds)) {
                showToast(`✅ ${jobIds.length} jobs created successfully!`, 'success')
              } else {
                showToast(`✅ Job created successfully! ID: ${jobIds}`, 'success')
              }
            } catch (error) {
              console.error('Failed to refresh drafts:', error)
            }
          }
          fetchDrafts()
        }}
      />
    </div>
  )
}

export default Drafts