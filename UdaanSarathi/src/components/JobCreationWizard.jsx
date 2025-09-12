import React, { useState, useEffect } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  FileText,
  Building,
  Clock,
  Users,
  Tag,
  DollarSign,
  Image,
  AlertCircle,
  Upload,
  Trash2,
  Plus,
  Minus,
  Calendar,
  CheckCircle
} from 'lucide-react'
import { jobService, jobCreationService } from '../services/index.js'
import { useNotificationContext } from '../contexts/NotificationContext'

const JobCreationWizard = ({ isOpen, onClose, onJobCreated, editDraft }) => {

  const { success, error: showError } = useNotificationContext()
  const [isInitialized, setIsInitialized] = useState(false)
  const [currentStep, setCurrentStep] = useState(0) // Start with creation mode selection
  const [isLoading, setIsLoading] = useState(false)
  const [jobId, setJobId] = useState(null)
  const [errors, setErrors] = useState({})
  const [creationMode, setCreationMode] = useState('single') // 'single' or 'bulk'
  const [createdJobs, setCreatedJobs] = useState([])

  // Step 1: Draft Create (minimal fields)
  const [draftForm, setDraftForm] = useState({
    posting_title: '',
    country: '',
    posting_agency: '',
    employer: '',
    contract_period_years: '',
    positions: [{ title: '', salary_amount: '', currency: 'AED' }]
  })

  // Step 2: Posting Details
  const [postingForm, setPostingForm] = useState({
    city: '',
    lt_number: '',
    chalani_number: '',
    approval_date: '',
    posting_date: '',
    announcement_type: 'full_ad',
    notes: ''
  })

  // Step 3: Contract
  const [contractForm, setContractForm] = useState({
    period_years: '',
    renewable: false,
    hours_per_day: 8,
    days_per_week: 6,
    overtime_policy: 'as_per_company_policy',
    weekly_off_days: 'Friday',
    food: 'free',
    accommodation: 'free',
    transport: 'free',
    annual_leave_days: 30
  })

  // Step 4: Positions
  const [positionsForm, setPositionsForm] = useState([
    {
      title: '',
      vacancies_male: '',
      vacancies_female: '',
      salary_amount: '',
      currency: 'AED',
      overrides: {
        hours_per_day: '',
        days_per_week: '',
        overtime_policy: '',
        weekly_off_days: '',
        food: '',
        accommodation: '',
        transport: '',
        notes: ''
      }
    }
  ])

  // Step 5: Tags & Canonical Titles
  const [tagsForm, setTagsForm] = useState({
    skills: [''],
    education_requirements: [''],
    experience: {
      min_years: '',
      preferred_years: '',
      domains: ['']
    },
    canonical_title_ids: [],
    canonical_title_names: ['']
  })

  // Step 6: Expenses
  const [expensesForm, setExpensesForm] = useState([
    {
      type: 'Medical',
      who_pays: 'company',
      is_free: true,
      amount: '',
      currency: 'AED',
      notes: ''
    }
  ])

  // Step 7: Cutout
  const [cutoutForm, setCutoutForm] = useState({
    file: null,
    preview: null
  })

  // Step 8: Interview (optional)
  const [interviewForm, setInterviewForm] = useState({
    interview_date_ad: '',
    interview_date_bs: '',
    interview_time: '',
    location: '',
    contact_person: '',
    required_documents: [],
    notes: '',
    expenses: []
  })

  // Step 9: Review & Publish
  const [reviewForm, setReviewForm] = useState({
    publish_immediately: false,
    save_as_draft: true
  })

  // Bulk creation form
  const [bulkForm, setBulkForm] = useState({
    job_type: 'Cook',
    countries: [{ country: 'UAE', job_count: 3 }],
    base_salary: 1800,
    currency: 'AED',
    posting_agency: '',
    contract_period_years: 2
  })

  const steps = [
    { id: 0, title: 'Creation Mode', icon: FileText, description: 'Choose creation type' },
    { id: 1, title: 'Draft Create', icon: FileText, description: 'Basic job information' },
    { id: 2, title: 'Posting Details', icon: Building, description: 'Administrative details' },
    { id: 3, title: 'Contract', icon: Clock, description: 'Employment terms' },
    { id: 4, title: 'Positions', icon: Users, description: 'Job positions & salary' },
    { id: 5, title: 'Tags & Titles', icon: Tag, description: 'Skills & requirements' },
    { id: 6, title: 'Expenses', icon: DollarSign, description: 'Cost breakdown' },
    { id: 7, title: 'Cutout', icon: Image, description: 'Job advertisement image' },
    { id: 8, title: 'Interview', icon: Calendar, description: 'Interview details (optional)' },
    { id: 9, title: 'Review & Publish', icon: CheckCircle, description: 'Final review and publish' }
  ]

  const COUNTRIES = ['UAE', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Oman', 'Bahrain']
  const CURRENCIES = ['AED', 'SAR', 'QAR', 'KWD', 'OMR', 'BHD']
  // Announcement types support both legacy codes and human labels
  const ANNOUNCEMENT_TYPES = [
    { value: 'Newspaper', label: 'Newspaper' },
    { value: 'Online', label: 'Online' },
    { value: 'Agency Board', label: 'Agency Board' },
    // legacy for backward compatibility
    { value: 'full_ad', label: 'Full Ad (legacy)' },
    { value: 'short_ad', label: 'Short Ad (legacy)' },
    { value: 'update', label: 'Update (legacy)' }
  ]
  const OVERTIME_POLICIES = ['as_per_company_policy', 'paid', 'unpaid', 'not_applicable']
  const BENEFIT_OPTIONS = ['free', 'paid', 'not_provided']
  const EXPENSE_TYPES = ['Medical', 'Insurance', 'Travel', 'Visa/Permit', 'Training', 'Welfare/Service']
  const PAYER_OPTIONS = ['company', 'worker', 'shared', 'not_applicable', 'agency']
  const TICKET_TYPES = ['one_way', 'round_trip', 'return_only']
  const JOB_TITLES = ['Cook', 'Driver', 'Cleaner', 'Security Guard', 'Waiter', 'Construction Worker', 'Electrician', 'Plumber', 'Welder', 'Mechanic']
  const REQUIRED_DOCUMENTS = ['Passport', 'CV/Resume', 'Educational Certificates', 'Experience Letters', 'Medical Certificate', 'Police Clearance', 'Photos', 'Skills Certificate']

  useEffect(() => {
    if (!isOpen) { setIsInitialized(false); return }
    if (editDraft) {
      // Load from existing draft for edit mode
      try {
        setCreationMode('single')
        setErrors({})
        setCreatedJobs([])
        setJobId(editDraft.id)

        // Step 1 (Draft Create) equivalent
        setDraftForm({
          posting_title: editDraft.posting_title || editDraft.title || '',
          country: editDraft.country || '',
          posting_agency: editDraft.posting_agency || '',
          employer: editDraft.employer || editDraft.company || '',
          contract_period_years: editDraft.contract?.period_years?.toString() || '',
          positions: (editDraft.positions || []).map(p => ({
            title: p.title || '',
            salary_amount: p.salary?.monthly_amount?.toString() || '',
            currency: p.salary?.currency || editDraft.currency || 'AED'
          }))
        })

        // Step 2 Posting Details
        setPostingForm({
          city: editDraft.city || '',
          lt_number: editDraft.lt_number || '',
          chalani_number: editDraft.chalani_number || '',
          approval_date: editDraft.approval_date ? new Date(editDraft.approval_date).toISOString().slice(0,10) : '',
          approval_date_bs: editDraft.approval_date_bs || '',
          posting_date: editDraft.posting_date ? new Date(editDraft.posting_date).toISOString().slice(0,10) : '',
          posting_date_bs: editDraft.posting_date_bs || '',
          announcement_type: editDraft.announcement_type || 'Newspaper',
          notes: editDraft.administrative_notes || ''
        })

        // Step 3 Contract
        setContractForm({
          period_years: editDraft.contract?.period_years?.toString() || '',
          renewable: !!editDraft.contract?.renewable,
          hours_per_day: editDraft.contract?.hours_per_day || 8,
          days_per_week: editDraft.contract?.days_per_week || 6,
          overtime_policy: editDraft.contract?.overtime_policy || 'as_per_company_policy',
          weekly_off_days: editDraft.contract?.weekly_off_days || 'Friday',
          food: editDraft.contract?.food || editDraft.contract?.benefits?.food || 'free',
          accommodation: editDraft.contract?.accommodation || editDraft.contract?.benefits?.accommodation || 'free',
          transport: editDraft.contract?.transport || editDraft.contract?.benefits?.transport || 'free',
          annual_leave_days: editDraft.contract?.annual_leave_days || 30
        })

        // Step 4 Positions
        setPositionsForm((editDraft.positions || []).map(p => ({
          title: p.title || '',
          vacancies_male: (p.vacancies?.male ?? '').toString(),
          vacancies_female: (p.vacancies?.female ?? '').toString(),
          salary_amount: (p.salary?.monthly_amount ?? '').toString(),
          currency: p.salary?.currency || editDraft.currency || 'AED',
          overrides: {
            hours_per_day: (p.overrides?.hours_per_day ?? '').toString(),
            days_per_week: (p.overrides?.days_per_week ?? '').toString(),
            overtime_policy: p.overrides?.overtime_policy || '',
            weekly_off_days: p.overrides?.weekly_off_days || '',
            food: p.overrides?.benefits?.food || '',
            accommodation: p.overrides?.benefits?.accommodation || '',
            transport: p.overrides?.benefits?.transport || '',
            notes: p.overrides?.notes || ''
          }
        })))

        // Step 5 Tags & Titles
        setTagsForm({
          skills: Array.isArray(editDraft.tags) && editDraft.tags.length ? editDraft.tags : [''],
          education_requirements: Array.isArray(editDraft.education_requirements) && editDraft.education_requirements.length ? editDraft.education_requirements : [''],
          experience: {
            min_years: editDraft.experience?.min_years ?? '',
            preferred_years: editDraft.experience?.preferred_years ?? '',
            domains: Array.isArray(editDraft.experience?.domains) && editDraft.experience.domains.length ? editDraft.experience.domains : ['']
          },
          canonical_title_ids: editDraft.canonical_titles?.ids || [],
          canonical_title_names: editDraft.canonical_titles?.names?.length ? editDraft.canonical_titles.names : ['']
        })

        // Step 6 Expenses
        setExpensesForm(Array.isArray(editDraft.expenses) && editDraft.expenses.length ? editDraft.expenses.map(e => ({
          type: e.type || 'Medical',
          who_pays: e.who_pays || e.payer || 'company',
          is_free: typeof e.is_free === 'boolean' ? e.is_free : true,
          amount: (e.amount ?? '').toString(),
          currency: e.currency || 'AED',
          notes: e.notes || ''
        })) : [{ type: 'Medical', who_pays: 'company', is_free: true, amount: '', currency: 'AED', notes: '' }])

        // Step 7 Cutout
        setCutoutForm({ file: null, preview: editDraft.cutout_url || null })

        // Step 8 Interview
        setInterviewForm({
          interview_date_ad: editDraft.interview?.interview_date_ad ? new Date(editDraft.interview.interview_date_ad).toISOString().slice(0,10) : '',
          interview_date_bs: editDraft.interview?.interview_date_bs || '',
          interview_time: editDraft.interview?.interview_time || '',
          location: editDraft.interview?.location || '',
          contact_person: editDraft.interview?.contact_person || '',
          required_documents: editDraft.interview?.required_documents || [],
          notes: editDraft.interview?.notes || '',
          expenses: editDraft.interview?.expenses || []
        })

        // Start at Posting Details for editing (skip creation mode selection)
        setCurrentStep(2)
        setIsInitialized(true)
      } catch (e) {
        console.error('Failed to load draft into wizard:', e)
        // fallback to reset if something goes wrong
        resetForm()
        setIsInitialized(true)
      }
    } else {
      // New create flow
      resetForm()
      setIsInitialized(true)
    }
  }, [isOpen, editDraft])

  const resetForm = () => {
    setCurrentStep(0)
    setJobId(null)
    setErrors({})
    setCreationMode('single')
    setCreatedJobs([])
    setDraftForm({
      posting_title: '',
      country: '',
      posting_agency: '',
      employer: '',
      contract_period_years: '',
      positions: [{ title: '', salary_amount: '', currency: 'AED' }]
    })
    setBulkForm({
      job_type: 'Cook',
      countries: [{ country: 'UAE', job_count: 3 }],
      base_salary: 1800,
      currency: 'AED',
      posting_agency: '',
      contract_period_years: 2
    })
    // Reset other forms...
  }

  const validateStep = (step) => {
    const stepErrors = {}

    switch (step) {
      case 0: // Creation Mode - no validation needed
        break

      case 1: // Draft Create
        if (creationMode === 'single') {
          if (!draftForm.posting_title.trim()) stepErrors.posting_title = 'Posting title is required'
          if (!draftForm.country) stepErrors.country = 'Country is required'
          if (!draftForm.posting_agency.trim()) stepErrors.posting_agency = 'Posting agency is required'
          if (!draftForm.employer.trim()) stepErrors.employer = 'Employer is required'
          if (!draftForm.contract_period_years || draftForm.contract_period_years <= 0) {
            stepErrors.contract_period_years = 'Contract period must be positive'
          }
          draftForm.positions.forEach((pos, idx) => {
            if (!pos.title.trim()) stepErrors[`position_${idx}_title`] = 'Position title is required'
            if (!pos.salary_amount || pos.salary_amount <= 0) {
              stepErrors[`position_${idx}_salary`] = 'Salary must be positive'
            }
          })
        } else { // bulk mode
          if (!bulkForm.job_type) stepErrors.job_type = 'Job type is required'
          if (!bulkForm.posting_agency.trim()) stepErrors.posting_agency = 'Posting agency is required'
          if (!bulkForm.base_salary || bulkForm.base_salary <= 0) {
            stepErrors.base_salary = 'Base salary must be positive'
          }
          if (!bulkForm.contract_period_years || bulkForm.contract_period_years <= 0) {
            stepErrors.contract_period_years = 'Contract period must be positive'
          }
          bulkForm.countries.forEach((country, idx) => {
            if (!country.country) stepErrors[`country_${idx}`] = 'Country is required'
            if (!country.job_count || country.job_count <= 0) {
              stepErrors[`job_count_${idx}`] = 'Job count must be positive'
            }
          })
        }
        break

      case 2: // Posting Details (Required fields)
        if (!postingForm.city || !postingForm.city.trim()) {
          stepErrors.city = 'City is required'
        }
        if (!postingForm.lt_number || !postingForm.lt_number.trim()) {
          stepErrors.lt_number = 'LT Number is required'
        }
        if (!postingForm.chalani_number || !postingForm.chalani_number.trim()) {
          stepErrors.chalani_number = 'Chalani Number is required'
        }
        // Require either AD or BS date for approval and posting dates
        if ((!postingForm.approval_date || !postingForm.approval_date.trim()) && (!postingForm.approval_date_bs || !postingForm.approval_date_bs.trim())) {
          stepErrors.approval_date = 'Approval date (AD or BS) is required'
        }
        if ((!postingForm.posting_date || !postingForm.posting_date.trim()) && (!postingForm.posting_date_bs || !postingForm.posting_date_bs.trim())) {
          stepErrors.posting_date = 'Posting date (AD or BS) is required'
        }
        if (postingForm.approval_date && isNaN(Date.parse(postingForm.approval_date))) {
          stepErrors.approval_date = 'Invalid approval date (AD)'
        }
        if (postingForm.posting_date && isNaN(Date.parse(postingForm.posting_date))) {
          stepErrors.posting_date = 'Invalid posting date (AD)'
        }
        if (!postingForm.announcement_type || !postingForm.announcement_type.trim()) {
          stepErrors.announcement_type = 'Announcement type is required'
        }
        break

      case 3: // Contract
        if (!contractForm.period_years || Number(contractForm.period_years) <= 0) {
          stepErrors.period_years = 'Contract period must be positive'
        }
        if (!contractForm.hours_per_day || Number(contractForm.hours_per_day) <= 0 || Number(contractForm.hours_per_day) > 24) {
          stepErrors.hours_per_day = 'Hours per day must be between 1-24'
        }
        if (!contractForm.days_per_week || Number(contractForm.days_per_week) <= 0 || Number(contractForm.days_per_week) > 7) {
          stepErrors.days_per_week = 'Days per week must be between 1-7'
        }
        if (!contractForm.overtime_policy || !OVERTIME_POLICIES.includes(contractForm.overtime_policy)) {
          stepErrors.overtime_policy = 'Overtime policy is required'
        }
        if (contractForm.weekly_off_days === '' || Number(contractForm.weekly_off_days) < 0 || Number(contractForm.weekly_off_days) > 7) {
          stepErrors.weekly_off_days = 'Weekly off days must be 0-7'
        }
        if (!contractForm.food || !BENEFIT_OPTIONS.includes(contractForm.food)) {
          stepErrors.food = 'Food benefit is required'
        }
        if (!contractForm.accommodation || !BENEFIT_OPTIONS.includes(contractForm.accommodation)) {
          stepErrors.accommodation = 'Accommodation benefit is required'
        }
        if (!contractForm.transport || !BENEFIT_OPTIONS.includes(contractForm.transport)) {
          stepErrors.transport = 'Transport benefit is required'
        }
        if (contractForm.renewable === undefined || contractForm.renewable === null) {
          stepErrors.renewable = 'Please specify if renewable'
        }
        if (contractForm.annual_leave_days === '' || Number(contractForm.annual_leave_days) < 0) {
          stepErrors.annual_leave_days = 'Annual leave days is required (0 or more)'
        }
        break

      case 4: // Positions
        positionsForm.forEach((pos, idx) => {
          if (!pos.title || !pos.title.trim()) stepErrors[`pos_${idx}_title`] = 'Position title is required'
          if (!pos.salary_amount || Number(pos.salary_amount) <= 0) {
            stepErrors[`pos_${idx}_salary`] = 'Monthly salary must be positive'
          }
          if (!pos.currency || !CURRENCIES.includes(pos.currency)) {
            stepErrors[`pos_${idx}_currency`] = 'Currency is required'
          }
          const m = pos.vacancies_male === '' ? NaN : Number(pos.vacancies_male)
          const f = pos.vacancies_female === '' ? NaN : Number(pos.vacancies_female)
          if (isNaN(m) || m < 0) stepErrors[`pos_${idx}_vac_male`] = 'Vacancies (Male) must be 0 or more'
          if (isNaN(f) || f < 0) stepErrors[`pos_${idx}_vac_female`] = 'Vacancies (Female) must be 0 or more'
        })
        break

      case 5: // Tags & Titles - Required per spec
        // Skills required
        if (!Array.isArray(tagsForm.skills) || tagsForm.skills.filter(s => s && s.trim()).length === 0) {
          stepErrors.skills = 'At least one skill is required'
        }
        // Education required
        if (!Array.isArray(tagsForm.education_requirements) || tagsForm.education_requirements.filter(e => e && e.trim()).length === 0) {
          stepErrors.education_requirements = 'At least one education requirement is required'
        }
        // Experience: min required, preferred optional
        if (tagsForm.experience.min_years === '' || Number(tagsForm.experience.min_years) < 0) {
          stepErrors.min_years = 'Minimum years is required (0 or more)'
        }
        if (tagsForm.experience.preferred_years !== '' && Number(tagsForm.experience.preferred_years) < 0) {
          stepErrors.preferred_years = 'Preferred years cannot be negative'
        }
        // Domains required
        if (!Array.isArray(tagsForm.experience.domains) || tagsForm.experience.domains.filter(d => d && d.trim()).length === 0) {
          stepErrors.domains = 'At least one domain is required'
        }
        // Canonical titles: either IDs or Names required
        const hasCanonicalIds = Array.isArray(tagsForm.canonical_title_ids) && tagsForm.canonical_title_ids.filter(id => id && String(id).trim()).length > 0
        const hasCanonicalNames = Array.isArray(tagsForm.canonical_title_names) && tagsForm.canonical_title_names.filter(n => n && n.trim()).length > 0
        if (!hasCanonicalIds && !hasCanonicalNames) {
          stepErrors.canonical_titles = 'Provide at least one Canonical Title ID or Name'
        }
        break

      case 6: // Expenses
        expensesForm.forEach((exp, idx) => {
          if (!exp.type) stepErrors[`exp_${idx}_type`] = 'Expense type is required'
          if (!exp.who_pays) stepErrors[`exp_${idx}_payer`] = 'Who pays is required'
          if (typeof exp.is_free !== 'boolean') stepErrors[`exp_${idx}_is_free`] = 'Please specify if free'
          const hasAmount = exp.amount !== '' && exp.amount != null
          if (!exp.is_free && (!hasAmount || Number(exp.amount) <= 0)) {
            stepErrors[`exp_${idx}_amount`] = 'Amount required and must be positive when not free'
          }
          if (!exp.is_free && hasAmount && (!exp.currency || !CURRENCIES.includes(exp.currency))) {
            stepErrors[`exp_${idx}_currency`] = 'Currency is required when an amount is provided'
          }
        })
        break

      case 7: // Cutout - Optional
        break

      case 8: // Interview - Optional
        if (interviewForm.interview_date_ad && isNaN(Date.parse(interviewForm.interview_date_ad))) {
          stepErrors.interview_date_ad = 'Invalid interview date'
        }
        if (interviewForm.interview_time && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(interviewForm.interview_time)) {
          stepErrors.interview_time = 'Invalid time format (HH:MM)'
        }
        interviewForm.expenses?.forEach((exp, idx) => {
          if (!exp.is_free && (!exp.amount || exp.amount <= 0)) {
            stepErrors[`interview_exp_${idx}_amount`] = 'Amount required when not free'
          }
        })
        break

      case 9: // Review & Publish - No validation needed
        break
    }

    setErrors(stepErrors)
    return Object.keys(stepErrors).length === 0
  }

  const handleNext = async () => {
    if (currentStep === 0) {
      // Creation mode selection - no validation or save needed
      setCurrentStep(1)
      return
    }

    if (!validateStep(currentStep)) {
      showError('Please fix the validation errors before proceeding')
      return
    }

    setIsLoading(true)
    try {
      await saveCurrentStep()
      
      // For bulk creation, skip to completion after step 1
      if (creationMode === 'bulk' && currentStep === 1) {
        success('Bulk job creation completed successfully!')
        onJobCreated?.(createdJobs.map(job => job.id))
        onClose()
        return
      }
      
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1)
      }
    } catch (err) {
      showError(`Failed to save step ${currentStep}: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const saveCurrentStep = async () => {
    switch (currentStep) {
      case 0: // Creation Mode - no save needed
        break

      case 1: // Create draft(s)
        if (creationMode === 'single') {
          if (!jobId) {
            const draftData = {
              posting_title: draftForm.posting_title,
              country: draftForm.country,
              posting_agency: draftForm.posting_agency,
              employer: draftForm.employer,
              contract: {
                period_years: Number(draftForm.contract_period_years)
              },
              positions: draftForm.positions.map(pos => ({
                title: pos.title,
                salary: {
                  monthly_amount: Number(pos.salary_amount),
                  currency: pos.currency
                }
              }))
            }
            const created = await jobCreationService.createDraft(draftData)
            setJobId(created.id)
            setCreatedJobs([created])
            success(`Draft created with ID: ${created.id}`)
          }
        } else { // bulk mode
          if (createdJobs.length === 0) {
            const bulkDrafts = []
            
            for (const countryData of bulkForm.countries) {
              for (let i = 0; i < countryData.job_count; i++) {
                const draftData = {
                  posting_title: `${bulkForm.job_type} - ${countryData.country} #${i + 1}`,
                  country: countryData.country,
                  posting_agency: bulkForm.posting_agency,
                  employer: `Company ${i + 1}`,
                  contract: {
                    period_years: Number(bulkForm.contract_period_years)
                  },
                  positions: [{
                    title: bulkForm.job_type,
                    salary: {
                      monthly_amount: Number(bulkForm.base_salary),
                      currency: bulkForm.currency
                    }
                  }]
                }
                bulkDrafts.push(draftData)
              }
            }

            const createdDrafts = []
            for (const draftData of bulkDrafts) {
              const created = await jobCreationService.createDraft(draftData)
              createdDrafts.push(created)
            }
            
            setCreatedJobs(createdDrafts)
            setJobId(createdDrafts[0]?.id) // Set first job as primary for subsequent steps
            success(`${createdDrafts.length} drafts created successfully!`)
          }
        }
        break

      case 2: // Update posting details
        await jobCreationService.updatePostingDetails(jobId, {
          city: postingForm.city,
          lt_number: postingForm.lt_number,
          chalani_number: postingForm.chalani_number,
          approval_date: postingForm.approval_date || null,
          approval_date_bs: postingForm.approval_date_bs || null,
          posting_date: postingForm.posting_date || null,
          posting_date_bs: postingForm.posting_date_bs || null,
          announcement_type: postingForm.announcement_type,
          notes: postingForm.notes
        })
        break

      case 3: // Update contract
        await jobCreationService.updateContract(jobId, contractForm)
        break

      case 4: // Update positions
        await jobCreationService.updatePositions(jobId, positionsForm)
        break

      case 5: // Update tags
        await jobCreationService.updateTags(jobId, {
          skills: tagsForm.skills,
          education_requirements: tagsForm.education_requirements,
          experience_requirements: tagsForm.experience,
          canonical_title_ids: tagsForm.canonical_title_ids,
          canonical_title_names: tagsForm.canonical_title_names
        })
        break

      case 6: // Update expenses
        await jobCreationService.updateExpenses(jobId, expensesForm)
        break

      case 7: // Update cutout
        if (cutoutForm.file) {
          await jobCreationService.uploadCutout(jobId, {
            cutout_url: cutoutForm.preview,
            cutout_filename: cutoutForm.file.name
          })
        }
        break

      case 8: // Update interview details
        await jobCreationService.updateInterview(jobId, interviewForm)
        break

      case 9: // Review & Publish
        if (reviewForm.publish_immediately) {
          await jobService.publishJob(jobId)
        }
        // Final save is handled in handleFinish
        break
    }
  }

  const handleFinish = async () => {
    if (!validateStep(currentStep)) {
      showError('Please fix the validation errors before finishing')
      return
    }

    setIsLoading(true)
    try {
      await saveCurrentStep()
      success('Job creation completed successfully!')
      
      // Pass appropriate job IDs based on creation mode
      if (creationMode === 'bulk') {
        onJobCreated?.(createdJobs.map(job => job.id))
      } else {
        onJobCreated?.(jobId)
      }
      
      onClose()
    } catch (err) {
      showError(`Failed to complete job creation: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Array manipulation helpers
  const addArrayItem = (form, setForm, field, defaultValue = '') => {
    setForm(prev => ({
      ...prev,
      [field]: [...prev[field], defaultValue]
    }))
  }

  const removeArrayItem = (form, setForm, field, index) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  const updateArrayItem = (form, setForm, field, index, value) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }))
  }

  if (!isOpen || !isInitialized) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="absolute right-0 top-0 h-full bg-white shadow-xl" style={{ width: '92vw', maxWidth: '1440px' }}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Job Creation Wizard</h2>
              <p className="text-sm text-gray-600 mt-1">
                Step {currentStep} of {steps.length}: {steps[currentStep]?.title}
              </p>
              {jobId && (
                <p className="text-xs text-blue-600 mt-1">Job ID: {jobId}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-4 overflow-x-auto py-1">
              {steps
                .filter(step => {
                  // Show all steps for single mode, only first 2 for bulk mode
                  if (creationMode === 'bulk') {
                    return step.id <= 1
                  }
                  return true
                })
                .map((step, index, filteredSteps) => {
                  const isActive = step.id === currentStep
                  const isCompleted = step.id < currentStep
                  const Icon = step.icon

                  return (
                    <div key={step.id} className="flex items-center flex-shrink-0">
                      <div className={`
                        flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all
                        ${isActive ? 'border-blue-500 bg-blue-500 text-white' : 
                          isCompleted ? 'border-green-500 bg-green-500 text-white' : 
                          'border-gray-300 bg-white text-gray-400'}
                      `}>
                        {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                      </div>
                      <div className="ml-3 block">
                        <p className={`text-sm font-medium ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'}`}>
                          {step.title}
                        </p>
                        <p className="text-xs text-gray-400">{step.description}</p>
                      </div>
                      {index < filteredSteps.length - 1 && (
                        <div className={`w-10 h-0.5 mx-4 ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      )}
                    </div>
                  )
                })}
            </div>
            
            {/* Mode indicator */}
            {currentStep > 0 && (
              <div className="mt-3 flex items-center justify-center">
                <span className={`text-xs px-3 py-1 rounded-full ${
                  creationMode === 'single' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-green-100 text-green-700'
                }`}>
                  {creationMode === 'single' ? '📝 Single Job Mode' : '📋 Bulk Creation Mode'}
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {currentStep === 0 && (
              <CreationModeStep 
                mode={creationMode}
                setMode={setCreationMode}
              />
            )}
            {currentStep === 1 && (
              creationMode === 'single' ? (
                <DraftCreateStep 
                  form={draftForm} 
                  setForm={setDraftForm} 
                  errors={errors}
                  countries={COUNTRIES}
                  currencies={CURRENCIES}
                />
              ) : (
                <BulkCreateStep 
                  form={bulkForm} 
                  setForm={setBulkForm} 
                  errors={errors}
                  countries={COUNTRIES}
                  currencies={CURRENCIES}
                  jobTitles={JOB_TITLES}
                />
              )
            )}
            {currentStep === 2 && creationMode === 'single' && (
              <PostingDetailsStep 
                form={postingForm} 
                setForm={setPostingForm} 
                errors={errors}
                announcementTypes={ANNOUNCEMENT_TYPES}
                country={draftForm.country}
              />
            )}
            {currentStep === 3 && creationMode === 'single' && (
              <ContractStep 
                form={contractForm} 
                setForm={setContractForm} 
                errors={errors}
                overtimePolicies={OVERTIME_POLICIES}
                benefitOptions={BENEFIT_OPTIONS}
              />
            )}
            {currentStep === 4 && creationMode === 'single' && (
              <PositionsStep 
                form={positionsForm} 
                setForm={setPositionsForm} 
                errors={errors}
                currencies={CURRENCIES}
                overtimePolicies={OVERTIME_POLICIES}
                benefitOptions={BENEFIT_OPTIONS}
              />
            )}
            {currentStep === 5 && creationMode === 'single' && (
              <TagsStep 
                form={tagsForm} 
                setForm={setTagsForm} 
                errors={errors}
                addArrayItem={addArrayItem}
                removeArrayItem={removeArrayItem}
                updateArrayItem={updateArrayItem}
              />
            )}
            {currentStep === 6 && creationMode === 'single' && (
              <ExpensesStep 
                form={expensesForm} 
                setForm={setExpensesForm} 
                errors={errors}
                expenseTypes={EXPENSE_TYPES}
                payerOptions={PAYER_OPTIONS}
                currencies={CURRENCIES}
              />
            )}
            {currentStep === 7 && creationMode === 'single' && (
              <CutoutStep 
                form={cutoutForm} 
                setForm={setCutoutForm} 
                errors={errors}
                jobId={jobId}
              />
            )}
            {currentStep === 8 && creationMode === 'single' && (
              <InterviewStep 
                form={interviewForm} 
                setForm={setInterviewForm} 
                errors={errors}
                requiredDocuments={REQUIRED_DOCUMENTS}
                expenseTypes={EXPENSE_TYPES}
                payerOptions={PAYER_OPTIONS}
                currencies={CURRENCIES}
              />
            )}
            {currentStep === 9 && creationMode === 'single' && (
              <ReviewPublishStep 
                form={reviewForm} 
                setForm={setReviewForm} 
                errors={errors}
                jobData={{
                  draft: draftForm,
                  posting: postingForm,
                  contract: contractForm,
                  positions: positionsForm,
                  tags: tagsForm,
                  expenses: expensesForm,
                  cutout: cutoutForm,
                  interview: interviewForm
                }}
                jobId={jobId}
              />
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </button>

            <div className="flex items-center space-x-3">
              {currentStep === 0 || (creationMode === 'bulk' && currentStep === 1) || (creationMode === 'single' && currentStep < steps.length - 1) ? (
                <button
                  onClick={handleNext}
                  disabled={isLoading}
                  className="flex items-center px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Processing...' : 
                   currentStep === 0 ? 'Continue' :
                   creationMode === 'bulk' && currentStep === 1 ? 'Create All Drafts' : 'Next'}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </button>
              ) : (
                <button
                  onClick={handleFinish}
                  disabled={isLoading}
                  className="flex items-center px-6 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Finishing...' : 
                   reviewForm.publish_immediately ? 'Publish Job' : 'Save Draft'}
                  <Check className="w-4 h-4 ml-2" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
)
}

const DraftCreateStep = ({ form, setForm, errors, countries, currencies }) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Job Information</h3>
      <p className="text-sm text-gray-600 mb-6">
        Provide minimal required fields to create a draft posting and obtain a posting ID.
      </p>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <h4 className="font-medium text-blue-900 mb-2">Tips</h4>
        <ul className="space-y-1 list-disc list-inside">
          <li>Use a descriptive posting title including role and location.</li>
          <li>Employer should match the legal entity on the LT/Chalani documents.</li>
          <li>Provide at least one position with a salary and currency.</li>
        </ul>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Posting Title *
        </label>
        <input
          type="text"
          value={form.posting_title}
          onChange={(e) => setForm(prev => ({ ...prev, posting_title: e.target.value }))}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.posting_title ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="e.g., Cook - Al Manara Restaurant Dubai"
        />
        {errors.posting_title && (
          <p className="text-red-500 text-xs mt-1">{errors.posting_title}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Country *
        </label>
        <select
          value={form.country}
          onChange={(e) => setForm(prev => ({ ...prev, country: e.target.value }))}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.country ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="">Select Country</option>
          {countries.map(country => (
            <option key={country} value={country}>{country}</option>
          ))}
        </select>
        {errors.country && (
          <p className="text-red-500 text-xs mt-1">{errors.country}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Posting Agency *
        </label>
        <input
          type="text"
          value={form.posting_agency}
          onChange={(e) => setForm(prev => ({ ...prev, posting_agency: e.target.value }))}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.posting_agency ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="e.g., Inspire Overseas Employment Agency"
        />
        {errors.posting_agency && (
          <p className="text-red-500 text-xs mt-1">{errors.posting_agency}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Employer *
        </label>
        <input
          type="text"
          value={form.employer}
          onChange={(e) => setForm(prev => ({ ...prev, employer: e.target.value }))}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.employer ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="e.g., Al Manara Restaurant LLC"
        />
        {errors.employer && (
          <p className="text-red-500 text-xs mt-1">{errors.employer}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Contract Period (Years) *
        </label>
        <input
          type="number"
          min="1"
          max="10"
          value={form.contract_period_years}
          onChange={(e) => setForm(prev => ({ ...prev, contract_period_years: e.target.value }))}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.contract_period_years ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="2"
        />
        {errors.contract_period_years && (
          <p className="text-red-500 text-xs mt-1">{errors.contract_period_years}</p>
        )}
      </div>
    </div>

    <div>
      <h4 className="text-md font-medium text-gray-900 mb-4">Positions *</h4>
      {form.positions.map((position, index) => (
        <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 border border-gray-200 rounded-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Position Title *
            </label>
            <input
              type="text"
              value={position.title}
              onChange={(e) => {
                const newPositions = [...form.positions]
                newPositions[index].title = e.target.value
                setForm(prev => ({ ...prev, positions: newPositions }))
              }}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors[`position_${index}_title`] ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Cook"
            />
            {errors[`position_${index}_title`] && (
              <p className="text-red-500 text-xs mt-1">{errors[`position_${index}_title`]}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monthly Salary *
            </label>
            <input
              type="number"
              min="0"
              value={position.salary_amount}
              onChange={(e) => {
                const newPositions = [...form.positions]
                newPositions[index].salary_amount = e.target.value
                setForm(prev => ({ ...prev, positions: newPositions }))
              }}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors[`position_${index}_salary`] ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="1800"
            />
            {errors[`position_${index}_salary`] && (
              <p className="text-red-500 text-xs mt-1">{errors[`position_${index}_salary`]}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Currency
            </label>
            <select
              value={position.currency}
              onChange={(e) => {
                const newPositions = [...form.positions]
                newPositions[index].currency = e.target.value
                setForm(prev => ({ ...prev, positions: newPositions }))
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {currencies.map(currency => (
                <option key={currency} value={currency}>{currency}</option>
              ))}
            </select>
          </div>

          {form.positions.length > 1 && (
            <div className="md:col-span-3 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  const newPositions = form.positions.filter((_, i) => i !== index)
                  setForm(prev => ({ ...prev, positions: newPositions }))
                }}
                className="text-red-600 hover:text-red-800 text-sm flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Remove Position
              </button>
            </div>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={() => {
          setForm(prev => ({
            ...prev,
            positions: [...prev.positions, { title: '', salary_amount: '', currency: 'AED' }]
          }))
        }}
        className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
      >
        <Plus className="w-4 h-4 mr-1" />
        Add Position
      </button>
    </div>
  </div>
)

// City suggestions by country for Posting Details
const countryCities = {
  UAE: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain'],
  Qatar: ['Doha', 'Al Rayyan', 'Al Wakrah'],
  Kuwait: ['Kuwait City', 'Hawalli'],
  Oman: ['Muscat', 'Seeb', 'Salalah'],
  Bahrain: ['Manama', 'Riffa'],
  'Saudi Arabia': ['Riyadh', 'Jeddah', 'Dammam']
}

const PostingDetailsStep = ({ form, setForm, errors, announcementTypes, country }) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Administrative Details</h3>
      <p className="text-sm text-gray-600 mb-6">
        Enrich the draft posting with administrative details. These fields are required for publishing.
      </p>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <h4 className="font-medium text-blue-900 mb-2">Tips</h4>
        <ul className="space-y-1 list-disc list-inside">
          <li>City should be consistent with the work location mentioned in the contract.</li>
          <li>Enter either AD or BS dates (both if available) for approval and posting.</li>
          <li>Use the announcement type that matches where the ad will be published.</li>
        </ul>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
        <input
          list="cityOptions"
          type="text"
          value={form.city}
          onChange={(e) => setForm(prev => ({ ...prev, city: e.target.value }))}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.city ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="e.g., Dubai"
        />
        <datalist id="cityOptions">
          {(countryCities[country] || []).map(c => (<option key={c} value={c} />))}
        </datalist>
        {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">LT Number *</label>
        <input
          type="text"
          value={form.lt_number}
          onChange={(e) => setForm(prev => ({ ...prev, lt_number: e.target.value }))}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.lt_number ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="e.g., LT123456"
        />
        {errors.lt_number && <p className="text-red-500 text-xs mt-1">{errors.lt_number}</p>}
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Chalani Number *</label>
        <input
          type="text"
          value={form.chalani_number}
          onChange={(e) => setForm(prev => ({ ...prev, chalani_number: e.target.value }))}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.chalani_number ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="e.g., CH789012"
        />
        {errors.chalani_number && <p className="text-red-500 text-xs mt-1">{errors.chalani_number}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Announcement Type *</label>
        <select
          value={form.announcement_type}
          onChange={(e) => setForm(prev => ({ ...prev, announcement_type: e.target.value }))}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.announcement_type ? 'border-red-500' : 'border-gray-300'}`}
        >
          <option value="">Select announcement type</option>
          {announcementTypes.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {errors.announcement_type && <p className="text-red-500 text-xs mt-1">{errors.announcement_type}</p>}
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Approval Date (AD) *</label>
        <input
          type="date"
          value={form.approval_date}
          onChange={(e) => setForm(prev => ({ ...prev, approval_date: e.target.value }))}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.approval_date ? 'border-red-500' : 'border-gray-300'}`}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Approval Date (BS) *</label>
        <input
          type="text"
          value={form.approval_date_bs || ''}
          onChange={(e) => setForm(prev => ({ ...prev, approval_date_bs: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., 2082-05-28"
        />
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Posting Date (AD) *</label>
        <input
          type="date"
          value={form.posting_date}
          onChange={(e) => setForm(prev => ({ ...prev, posting_date: e.target.value }))}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.posting_date ? 'border-red-500' : 'border-gray-300'}`}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Posting Date (BS) *</label>
        <input
          type="text"
          value={form.posting_date_bs || ''}
          onChange={(e) => setForm(prev => ({ ...prev, posting_date_bs: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., 2082-05-28"
        />
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
      <textarea
        rows={3}
        value={form.notes || ''}
        onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Additional administrative remarks"
      />
    </div>
  </div>
)

const ContractStep = ({ form, setForm, errors, overtimePolicies, benefitOptions }) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Employment Contract Terms</h3>
      <p className="text-sm text-gray-600 mb-6">
        Define the employment terms for this job. These values can be overridden per-position later.
      </p>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <h4 className="font-medium text-blue-900 mb-2">Tips</h4>
        <ul className="space-y-1 list-disc list-inside">
          <li>Match hours/day and days/week with local labor regulations.</li>
          <li>Choose an overtime policy that reflects the employer’s practice.</li>
          <li>Benefits (food, accommodation, transport) should be explicit to avoid ambiguity.</li>
        </ul>
      </div>
    </div>

    {/* Top row: Period, Renewable, Overtime Policy */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Period Years *</label>
        <input
          type="number"
          min="1"
          value={form.period_years}
          onChange={(e) => setForm(prev => ({ ...prev, period_years: e.target.value }))}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.period_years ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="2"
        />
        {errors.period_years && <p className="text-red-500 text-xs mt-1">{errors.period_years}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Renewable *</label>
        <div className="flex items-center gap-4 mt-2">
          <label className="inline-flex items-center gap-2">
            <input type="radio" name="renewable" checked={!!form.renewable} onChange={() => setForm(prev => ({ ...prev, renewable: true }))} />
            <span>Yes</span>
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="radio" name="renewable" checked={!form.renewable} onChange={() => setForm(prev => ({ ...prev, renewable: false }))} />
            <span>No</span>
          </label>
        </div>
        {errors.renewable && <p className="text-red-500 text-xs mt-1">{errors.renewable}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Overtime Policy *</label>
        <select
          value={form.overtime_policy}
          onChange={(e) => setForm(prev => ({ ...prev, overtime_policy: e.target.value }))}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.overtime_policy ? 'border-red-500' : 'border-gray-300'}`}
        >
          {overtimePolicies.map(op => (
            <option key={op} value={op}>{op.replaceAll('_',' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
          ))}
        </select>
        {errors.overtime_policy && <p className="text-red-500 text-xs mt-1">{errors.overtime_policy}</p>}
      </div>
    </div>

    {/* Working hours and weekly off */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Hours Per Day *</label>
        <input
          type="number" min="1" max="24"
          value={form.hours_per_day}
          onChange={(e) => setForm(prev => ({ ...prev, hours_per_day: e.target.value }))}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.hours_per_day ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="8"
        />
        {errors.hours_per_day && <p className="text-red-500 text-xs mt-1">{errors.hours_per_day}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Days Per Week *</label>
        <input
          type="number" min="1" max="7"
          value={form.days_per_week}
          onChange={(e) => setForm(prev => ({ ...prev, days_per_week: e.target.value }))}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.days_per_week ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="6"
        />
        {errors.days_per_week && <p className="text-red-500 text-xs mt-1">{errors.days_per_week}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Weekly Off Days *</label>
        <input
          type="number" min="0" max="7"
          value={form.weekly_off_days}
          onChange={(e) => setForm(prev => ({ ...prev, weekly_off_days: e.target.value }))}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.weekly_off_days ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="1"
        />
        {errors.weekly_off_days && <p className="text-red-500 text-xs mt-1">{errors.weekly_off_days}</p>}
      </div>
    </div>

    {/* Benefits */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Food *</label>
        <select
          value={form.food}
          onChange={(e) => setForm(prev => ({ ...prev, food: e.target.value }))}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.food ? 'border-red-500' : 'border-gray-300'}`}
        >
          {benefitOptions.map(b => (<option key={b} value={b}>{b.replaceAll('_',' ').replace(/\b\w/g, c => c.toUpperCase())}</option>))}
        </select>
        {errors.food && <p className="text-red-500 text-xs mt-1">{errors.food}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Accommodation *</label>
        <select
          value={form.accommodation}
          onChange={(e) => setForm(prev => ({ ...prev, accommodation: e.target.value }))}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.accommodation ? 'border-red-500' : 'border-gray-300'}`}
        >
          {benefitOptions.map(b => (<option key={b} value={b}>{b.replaceAll('_',' ').replace(/\b\w/g, c => c.toUpperCase())}</option>))}
        </select>
        {errors.accommodation && <p className="text-red-500 text-xs mt-1">{errors.accommodation}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Transport *</label>
        <select
          value={form.transport}
          onChange={(e) => setForm(prev => ({ ...prev, transport: e.target.value }))}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.transport ? 'border-red-500' : 'border-gray-300'}`}
        >
          {benefitOptions.map(b => (<option key={b} value={b}>{b.replaceAll('_',' ').replace(/\b\w/g, c => c.toUpperCase())}</option>))}
        </select>
        {errors.transport && <p className="text-red-500 text-xs mt-1">{errors.transport}</p>}
      </div>
    </div>

    {/* Annual Leave */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Annual Leave Days *</label>
        <input
          type="number" min="0"
          value={form.annual_leave_days}
          onChange={(e) => setForm(prev => ({ ...prev, annual_leave_days: e.target.value }))}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.annual_leave_days ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="21"
        />
        {errors.annual_leave_days && <p className="text-red-500 text-xs mt-1">{errors.annual_leave_days}</p>}
      </div>
    </div>
  </div>
)

const PositionsStep = ({ form, setForm, errors, currencies, overtimePolicies, benefitOptions }) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Job Positions</h3>
      <p className="text-sm text-gray-600 mb-6">
        Define one or more positions. You can override contract terms for each position if needed.
      </p>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <h4 className="font-medium text-blue-900 mb-2">Tips</h4>
        <ul className="space-y-1 list-disc list-inside">
          <li>Set vacancies realistically by gender requirements if applicable.</li>
          <li>Use overrides only when a position deviates from contract defaults.</li>
          <li>Add clear notes for any shift allowances or special requirements.</li>
        </ul>
      </div>
    </div>

    {form.map((pos, idx) => (
      <div key={idx} className="border rounded-lg p-4 space-y-4">
        <div className="flex items-start justify-between">
          <h4 className="font-medium text-gray-900">Position #{idx + 1}</h4>
          {form.length > 1 && (
            <button
              type="button"
              onClick={() => setForm(prev => prev.filter((_, i) => i !== idx))}
              className="text-red-600 hover:text-red-800 text-sm"
            >Remove</button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Position Title *</label>
            <input
              type="text"
              value={pos.title}
              onChange={(e) => setForm(prev => prev.map((p, i) => i === idx ? { ...p, title: e.target.value } : p))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors[`pos_${idx}_title`] ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="e.g., Cook"
            />
            {errors[`pos_${idx}_title`] && <p className="text-red-500 text-xs mt-1">{errors[`pos_${idx}_title`]}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vacancies (Male) *</label>
            <input
              type="number"
              min="0"
              value={pos.vacancies_male}
              onChange={(e) => setForm(prev => prev.map((p, i) => i === idx ? { ...p, vacancies_male: e.target.value } : p))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors[`pos_${idx}_vac_male`] ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="0"
            />
            {errors[`pos_${idx}_vac_male`] && <p className="text-red-500 text-xs mt-1">{errors[`pos_${idx}_vac_male`]}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vacancies (Female) *</label>
            <input
              type="number"
              min="0"
              value={pos.vacancies_female}
              onChange={(e) => setForm(prev => prev.map((p, i) => i === idx ? { ...p, vacancies_female: e.target.value } : p))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors[`pos_${idx}_vac_female`] ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="0"
            />
            {errors[`pos_${idx}_vac_female`] && <p className="text-red-500 text-xs mt-1">{errors[`pos_${idx}_vac_female`]}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Salary *</label>
            <input
              type="number"
              min="0"
              value={pos.salary_amount}
              onChange={(e) => setForm(prev => prev.map((p, i) => i === idx ? { ...p, salary_amount: e.target.value } : p))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors[`pos_${idx}_salary`] ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="1800"
            />
            {errors[`pos_${idx}_salary`] && <p className="text-red-500 text-xs mt-1">{errors[`pos_${idx}_salary`]}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Currency *</label>
            <select
              value={pos.currency}
              onChange={(e) => setForm(prev => prev.map((p, i) => i === idx ? { ...p, currency: e.target.value } : p))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors[`pos_${idx}_currency`] ? 'border-red-500' : 'border-gray-300'}`}
            >
              {currencies.map(c => (<option key={c} value={c}>{c}</option>))}
            </select>
            {errors[`pos_${idx}_currency`] && <p className="text-red-500 text-xs mt-1">{errors[`pos_${idx}_currency`]}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hours/Day (Override)</label>
            <input
              type="number" min="1" max="24"
              value={pos.overrides.hours_per_day}
              onChange={(e) => setForm(prev => prev.map((p, i) => i === idx ? { ...p, overrides: { ...p.overrides, hours_per_day: e.target.value } } : p))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="9"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Days/Week (Override)</label>
            <input
              type="number" min="1" max="7"
              value={pos.overrides.days_per_week}
              onChange={(e) => setForm(prev => prev.map((p, i) => i === idx ? { ...p, overrides: { ...p.overrides, days_per_week: e.target.value } } : p))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Overtime Policy (Override)</label>
            <select
              value={pos.overrides.overtime_policy}
              onChange={(e) => setForm(prev => prev.map((p, i) => i === idx ? { ...p, overrides: { ...p.overrides, overtime_policy: e.target.value } } : p))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Use contract default</option>
              {overtimePolicies.map(op => (
                <option key={op} value={op}>{op.replaceAll('_',' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Weekly Off Days (Override)</label>
            <input
              type="number" min="0" max="7"
              value={pos.overrides.weekly_off_days}
              onChange={(e) => setForm(prev => prev.map((p, i) => i === idx ? { ...p, overrides: { ...p.overrides, weekly_off_days: e.target.value } } : p))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <input
              type="text"
              value={pos.overrides.notes}
              onChange={(e) => setForm(prev => prev.map((p, i) => i === idx ? { ...p, overrides: { ...p.overrides, notes: e.target.value } } : p))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Position specific notes"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Food (Override)</label>
            <select
              value={pos.overrides.food}
              onChange={(e) => setForm(prev => prev.map((p, i) => i === idx ? { ...p, overrides: { ...p.overrides, food: e.target.value } } : p))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Use contract default</option>
              {benefitOptions.map(b => (<option key={b} value={b}>{b.replaceAll('_',' ').replace(/\b\w/g, c => c.toUpperCase())}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Accommodation (Override)</label>
            <select
              value={pos.overrides.accommodation}
              onChange={(e) => setForm(prev => prev.map((p, i) => i === idx ? { ...p, overrides: { ...p.overrides, accommodation: e.target.value } } : p))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Use contract default</option>
              {benefitOptions.map(b => (<option key={b} value={b}>{b.replaceAll('_',' ').replace(/\b\w/g, c => c.toUpperCase())}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Transport (Override)</label>
            <select
              value={pos.overrides.transport}
              onChange={(e) => setForm(prev => prev.map((p, i) => i === idx ? { ...p, overrides: { ...p.overrides, transport: e.target.value } } : p))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Use contract default</option>
              {benefitOptions.map(b => (<option key={b} value={b}>{b.replaceAll('_',' ').replace(/\b\w/g, c => c.toUpperCase())}</option>))}
            </select>
          </div>
        </div>
      </div>
    ))}

    <button
      type="button"
      onClick={() => setForm(prev => ([...prev, {
        title: '', vacancies_male: '', vacancies_female: '', salary_amount: '', currency: currencies[0] || 'AED',
        overrides: { hours_per_day: '', days_per_week: '', overtime_policy: '', weekly_off_days: '', food: '', accommodation: '', transport: '', notes: '' }
      }]))}
      className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
    >
      <Plus className="w-4 h-4 mr-1" /> Add Position
    </button>
  </div>
)

// Suggestions used by TagsStep (must be defined before usage)
const SUGGESTED_SKILLS = ['Cooking', 'Hospitality', 'Customer Service', 'Warehouse', 'Barista', 'Driving']
const SUGGESTED_DOMAINS = ['Hospitality', 'Culinary', 'Logistics', 'Retail', 'Household']

const TagsStep = ({ form, setForm, errors, addArrayItem, removeArrayItem, updateArrayItem }) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Skills & Requirements</h3>
      <p className="text-sm text-gray-600 mb-6">
        Add skills, education, experience requirements, and canonical job titles.
      </p>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <h4 className="font-medium text-blue-900 mb-2">Tips</h4>
        <ul className="space-y-1 list-disc list-inside">
          <li>Include practical skills candidates can demonstrate (e.g., latte art, forklift).</li>
          <li>Use domains to guide matching (e.g., Hospitality, Logistics).</li>
          <li>Pick at least one canonical title ID or name to standardize the role.</li>
        </ul>
      </div>
    </div>

    {/* Skills */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Skills *</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {form.skills.filter(Boolean).map((skill, idx) => (
          <span key={`skill-${idx}`} className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 border">
            {skill}
            <button className="ml-2 text-blue-600 hover:text-blue-800" onClick={() => removeArrayItem(form, setForm, 'skills', idx)}>×</button>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          list="skillsList"
          type="text"
          value={form.skills[form.skills.length - 1] || ''}
          onChange={(e) => updateArrayItem(form, setForm, 'skills', form.skills.length - 1, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.currentTarget.value.trim()) {
              addArrayItem(form, setForm, 'skills', '')
            }
          }}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.skills ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="e.g., Cooking"
        />
        <button type="button" className="btn-secondary text-sm" onClick={() => addArrayItem(form, setForm, 'skills', '')}>Add</button>
      </div>
      <datalist id="skillsList">
        {SUGGESTED_SKILLS.map(s => (<option key={s} value={s} />))}
      </datalist>
      {errors.skills && <p className="text-red-500 text-xs mt-1">{errors.skills}</p>}
    </div>

    {/* Education Requirements */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Education Requirements *</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {form.education_requirements.filter(Boolean).map((edu, idx) => (
          <span key={`edu-${idx}`} className="inline-flex items-center px-3 py-1 rounded-full bg-purple-50 text-purple-700 border">
            {edu}
            <button className="ml-2 text-purple-600 hover:text-purple-800" onClick={() => removeArrayItem(form, setForm, 'education_requirements', idx)}>×</button>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={form.education_requirements[form.education_requirements.length - 1] || ''}
          onChange={(e) => updateArrayItem(form, setForm, 'education_requirements', form.education_requirements.length - 1, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.currentTarget.value.trim()) {
              addArrayItem(form, setForm, 'education_requirements', '')
            }
          }}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.education_requirements ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="e.g., High School"
        />
        <button type="button" className="btn-secondary text-sm" onClick={() => addArrayItem(form, setForm, 'education_requirements', '')}>Add</button>
      </div>
      {errors.education_requirements && <p className="text-red-500 text-xs mt-1">{errors.education_requirements}</p>}
    </div>

    {/* Experience Requirements */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Experience Requirements *</label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Minimum Years *</label>
          <input
            type="number"
            min="0"
            value={form.experience.min_years}
            onChange={(e) => setForm(prev => ({ ...prev, experience: { ...prev.experience, min_years: e.target.value } }))}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.min_years ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="2"
          />
          {errors.min_years && <p className="text-red-500 text-xs mt-1">{errors.min_years}</p>}
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Preferred Years</label>
          <input
            type="number"
            min="0"
            value={form.experience.preferred_years}
            onChange={(e) => setForm(prev => ({ ...prev, experience: { ...prev.experience, preferred_years: e.target.value } }))}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.preferred_years ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="5"
          />
          {errors.preferred_years && <p className="text-red-500 text-xs mt-1">{errors.preferred_years}</p>}
        </div>
        <div className="md:col-span-1">
          <label className="block text-xs text-gray-600 mb-1">Domains *</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {form.experience.domains.filter(Boolean).map((d, idx) => (
              <span key={`dom-${idx}`} className="inline-flex items-center px-3 py-1 rounded-full bg-amber-50 text-amber-700 border">
                {d}
                <button className="ml-2 text-amber-600 hover:text-amber-800" onClick={() => removeArrayItem(form.experience, (next) => setForm(prev => ({ ...prev, experience: next })), 'domains', idx)}>×</button>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              list="domainList"
              type="text"
              value={form.experience.domains[form.experience.domains.length - 1] || ''}
              onChange={(e) => {
                const next = { ...form.experience }
                next.domains = next.domains.map((v, i, arr) => i === arr.length - 1 ? e.target.value : v)
                setForm(prev => ({ ...prev, experience: next }))
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  const next = { ...form.experience }
                  next.domains = [...next.domains, '']
                  setForm(prev => ({ ...prev, experience: next }))
                }
              }}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.domains ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="e.g., Hospitality"
            />
            <button type="button" className="btn-secondary text-sm" onClick={() => {
              const next = { ...form.experience }
              next.domains = [...next.domains, '']
              setForm(prev => ({ ...prev, experience: next }))
            }}>Add</button>
          </div>
          <datalist id="domainList">
            {SUGGESTED_DOMAINS.map(d => (<option key={d} value={d} />))}
          </datalist>
          {errors.domains && <p className="text-red-500 text-xs mt-1">{errors.domains}</p>}
        </div>
      </div>
    </div>

    {/* Canonical Titles */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Canonical Titles (IDs or Names) *</label>
      <p className="text-xs text-gray-500 mb-2">Provide at least one ID or one Name</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-600 mb-1">IDs</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {(form.canonical_title_ids || []).filter(Boolean).map((id, idx) => (
              <span key={`ctid-${idx}`} className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-800 border">
                {id}
                <button className="ml-2 text-gray-600 hover:text-gray-800" onClick={() => removeArrayItem(form, setForm, 'canonical_title_ids', idx)}>×</button>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={(form.canonical_title_ids || [])[Math.max((form.canonical_title_ids || []).length - 1, 0)] || ''}
              onChange={(e) => updateArrayItem(form, setForm, 'canonical_title_ids', Math.max((form.canonical_title_ids || []).length - 1, 0), e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && e.currentTarget.value.trim()) { addArrayItem(form, setForm, 'canonical_title_ids', '') }}}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.canonical_titles ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="e.g., 123"
            />
            <button type="button" className="btn-secondary text-sm" onClick={() => addArrayItem(form, setForm, 'canonical_title_ids', '')}>Add</button>
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Names</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {(form.canonical_title_names || []).filter(Boolean).map((n, idx) => (
              <span key={`ctn-${idx}`} className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 text-indigo-800 border">
                {n}
                <button className="ml-2 text-indigo-600 hover:text-indigo-800" onClick={() => removeArrayItem(form, setForm, 'canonical_title_names', idx)}>×</button>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={(form.canonical_title_names || [])[Math.max((form.canonical_title_names || []).length - 1, 0)] || ''}
              onChange={(e) => updateArrayItem(form, setForm, 'canonical_title_names', Math.max((form.canonical_title_names || []).length - 1, 0), e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && e.currentTarget.value.trim()) { addArrayItem(form, setForm, 'canonical_title_names', '') }}}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.canonical_titles ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="e.g., Professional Cook"
            />
            <button type="button" className="btn-secondary text-sm" onClick={() => addArrayItem(form, setForm, 'canonical_title_names', '')}>Add</button>
          </div>
        </div>
      </div>
      {errors.canonical_titles && <p className="text-red-500 text-xs mt-1">{errors.canonical_titles}</p>}
    </div>
  </div>
)

const ExpensesStep = ({ form, setForm, errors, expenseTypes, payerOptions, currencies }) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Cost Breakdown</h3>
      <p className="text-sm text-gray-600 mb-6">
        Attach cost-related details (medical, insurance, travel, visa/permit, training, welfare/service).
      </p>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <h4 className="font-medium text-blue-900 mb-2">Tips</h4>
        <ul className="space-y-1 list-disc list-inside">
          <li>Mark an expense as Free when the company fully covers it.</li>
          <li>If not free, enter both amount and currency for clarity.</li>
          <li>Use notes to specify coverage (e.g., one-time, annual, shared).</li>
        </ul>
      </div>
    </div>

    {form.map((exp, idx) => (
      <div key={idx} className="border rounded-lg p-4 space-y-4">
        <div className="flex items-start justify-between">
          <h4 className="font-medium text-gray-900">Expense #{idx + 1}</h4>
          {form.length > 1 && (
            <button
              type="button"
              onClick={() => setForm(prev => prev.filter((_, i) => i !== idx))}
              className="text-red-600 hover:text-red-800 text-sm"
            >Remove</button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expense Type *</label>
            <select
              value={exp.type}
              onChange={(e) => setForm(prev => prev.map((x, i) => i === idx ? { ...x, type: e.target.value } : x))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors[`exp_${idx}_type`] ? 'border-red-500' : 'border-gray-300'}`}
            >
              {expenseTypes.map(t => (<option key={t} value={t}>{t}</option>))}
            </select>
            {errors[`exp_${idx}_type`] && <p className="text-red-500 text-xs mt-1">{errors[`exp_${idx}_type`]}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Who Pays *</label>
            <select
              value={exp.who_pays}
              onChange={(e) => setForm(prev => prev.map((x, i) => i === idx ? { ...x, who_pays: e.target.value } : x))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors[`exp_${idx}_payer`] ? 'border-red-500' : 'border-gray-300'}`}
            >
              {payerOptions.map(p => (<option key={p} value={p}>{p.replaceAll('_',' ').replace(/\b\w/g, c => c.toUpperCase())}</option>))}
            </select>
            {errors[`exp_${idx}_payer`] && <p className="text-red-500 text-xs mt-1">{errors[`exp_${idx}_payer`]}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Is Free *</label>
            <div className="flex items-center gap-4 mt-2">
              <label className="inline-flex items-center gap-2">
                <input type="radio" name={`exp_free_${idx}`} checked={exp.is_free === true} onChange={() => setForm(prev => prev.map((x, i) => i === idx ? { ...x, is_free: true, amount: '' } : x))} />
                <span>Yes</span>
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="radio" name={`exp_free_${idx}`} checked={exp.is_free === false} onChange={() => setForm(prev => prev.map((x, i) => i === idx ? { ...x, is_free: false } : x))} />
                <span>No</span>
              </label>
            </div>
            {errors[`exp_${idx}_is_free`] && <p className="text-red-500 text-xs mt-1">{errors[`exp_${idx}_is_free`]}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <input
              type="number" min="0"
              value={exp.amount}
              onChange={(e) => setForm(prev => prev.map((x, i) => i === idx ? { ...x, amount: e.target.value } : x))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors[`exp_${idx}_amount`] ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="500"
            />
            {errors[`exp_${idx}_amount`] && <p className="text-red-500 text-xs mt-1">{errors[`exp_${idx}_amount`]}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
            <select
              value={exp.currency}
              onChange={(e) => setForm(prev => prev.map((x, i) => i === idx ? { ...x, currency: e.target.value } : x))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors[`exp_${idx}_currency`] ? 'border-red-500' : 'border-gray-300'}`}
            >
              <option value="">Select</option>
              {currencies.map(c => (<option key={c} value={c}>{c}</option>))}
            </select>
            {errors[`exp_${idx}_currency`] && <p className="text-red-500 text-xs mt-1">{errors[`exp_${idx}_currency`]}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <input
              type="text"
              value={exp.notes || ''}
              onChange={(e) => setForm(prev => prev.map((x, i) => i === idx ? { ...x, notes: e.target.value } : x))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Covers annual medical checkup"
            />
          </div>
        </div>
      </div>
    ))}

    <button
      type="button"
      onClick={() => setForm(prev => ([...prev, { type: expenseTypes[0], who_pays: payerOptions[0], is_free: true, amount: '', currency: currencies[0], notes: '' }]))}
      className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
    >
      <Plus className="w-4 h-4 mr-1" /> Add Expense
    </button>
  </div>
)

const CutoutStep = ({ form, setForm, errors, jobId }) => {
  const onFileChange = (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPG, PNG, etc).')
      return
    }
    const previewUrl = URL.createObjectURL(file)
    setForm({ file, preview: previewUrl })
  }

  const removeCutout = async (hard = false) => {
    if (!jobId) return
    const confirmText = hard ? 'This will remove the cutout and delete the file from disk. Continue?' : 'This will remove the cutout reference (file kept on disk). Continue?'
    if (!window.confirm(confirmText)) return
    try {
      await jobCreationService.removeCutout(jobId, hard)
      setForm({ file: null, preview: null })
      alert(hard ? 'Cutout removed and file deleted.' : 'Cutout reference removed.')
    } catch (err) {
      alert('Failed to remove cutout: ' + err.message)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Job Advertisement Image</h3>
        <p className="text-sm text-gray-600 mb-6">
          Upload and manage the advertisement cutout (e.g., newspaper scan). Supported formats: JPG, PNG.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <h4 className="font-medium text-blue-900 mb-2">Tips</h4>
          <ul className="space-y-1 list-disc list-inside">
            <li>Prefer clear, high-resolution scans or images.</li>
            <li>Ensure the ad clearly shows the employer and position details.</li>
            <li>Use Remove Cutout to reset if you uploaded the wrong file.</li>
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Upload File *</label>
          <input
            type="file"
            accept="image/*"
            onChange={onFileChange}
            className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <p className="text-xs text-gray-500 mt-1">File will be uploaded on Next when you proceed past this step.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
          {form.preview ? (
            <img src={form.preview} alt="Cutout Preview" className="max-h-64 rounded-lg border" />
          ) : (
            <div className="h-64 rounded-lg border border-dashed flex items-center justify-center text-gray-400">
              <span>No image selected</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => removeCutout(false)}
          disabled={!jobId}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50"
        >
          Remove Cutout
        </button>
      </div>

      
    </div>
  )
}

const CreationModeStep = ({ mode, setMode }) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Choose Creation Mode</h3>
      <p className="text-sm text-gray-600 mb-6">
        Select how you want to create job drafts.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div
        onClick={() => setMode('single')}
        className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
          mode === 'single' 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <div className="flex items-center mb-4">
          <FileText className={`w-8 h-8 mr-3 ${mode === 'single' ? 'text-blue-600' : 'text-gray-400'}`} />
          <h4 className={`text-lg font-medium ${mode === 'single' ? 'text-blue-900' : 'text-gray-900'}`}>
            Single Job Draft
          </h4>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Create a detailed job posting with full 7-step workflow including posting details, 
          contract terms, positions, tags, expenses, and cutout image.
        </p>
        <ul className="text-xs text-gray-500 space-y-1">
          <li>• Complete job specification</li>
          <li>• Administrative details</li>
          <li>• Contract and position details</li>
          <li>• Skills and requirements</li>
          <li>• Expense breakdown</li>
          <li>• Advertisement image</li>
        </ul>
      </div>

      <div
        onClick={() => setMode('bulk')}
        className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
          mode === 'bulk' 
            ? 'border-green-500 bg-green-50' 
            : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <div className="flex items-center mb-4">
          <Users className={`w-8 h-8 mr-3 ${mode === 'bulk' ? 'text-green-600' : 'text-gray-400'}`} />
          <h4 className={`text-lg font-medium ${mode === 'bulk' ? 'text-green-900' : 'text-gray-900'}`}>
            Bulk Job Creation
          </h4>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Quickly create multiple job drafts for the same position across different countries. 
          Perfect for agencies posting similar jobs in multiple locations.
        </p>
        <ul className="text-xs text-gray-500 space-y-1">
          <li>• Multiple countries at once</li>
          <li>• Same job type and salary</li>
          <li>• Quick draft creation</li>
          <li>• Bulk processing</li>
          <li>• Time-efficient</li>
        </ul>
      </div>
    </div>
  </div>
)

const InterviewStep = ({ form, setForm, errors, requiredDocuments, expenseTypes, payerOptions, currencies }) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Interview Details (Optional)</h3>
      <p className="text-sm text-gray-600 mb-6">
        Configure interview requirements and logistics. This step is optional but helps candidates prepare.
      </p>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <h4 className="font-medium text-blue-900 mb-2">Tips</h4>
        <ul className="space-y-1 list-disc list-inside">
          <li>Provide both AD and BS dates if possible.</li>
          <li>List required documents so candidates arrive prepared.</li>
          <li>Add location landmarks or contact details for easy navigation.</li>
        </ul>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Interview Date (AD)
        </label>
        <input
          type="date"
          value={form.interview_date_ad}
          onChange={(e) => setForm(prev => ({ ...prev, interview_date_ad: e.target.value }))}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.interview_date_ad ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.interview_date_ad && (
          <p className="text-red-500 text-xs mt-1">{errors.interview_date_ad}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Interview Date (BS)
        </label>
        <input
          type="text"
          value={form.interview_date_bs}
          onChange={(e) => setForm(prev => ({ ...prev, interview_date_bs: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., 2081/08/15"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Interview Time
        </label>
        <input
          type="time"
          value={form.interview_time}
          onChange={(e) => setForm(prev => ({ ...prev, interview_time: e.target.value }))}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.interview_time ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.interview_time && (
          <p className="text-red-500 text-xs mt-1">{errors.interview_time}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Location
        </label>
        <input
          type="text"
          value={form.location}
          onChange={(e) => setForm(prev => ({ ...prev, location: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Agency Office, Kathmandu"
        />
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Contact Person
        </label>
        <input
          type="text"
          value={form.contact_person}
          onChange={(e) => setForm(prev => ({ ...prev, contact_person: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Mr. John Doe, HR Manager"
        />
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Required Documents
      </label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {requiredDocuments.map(doc => (
          <label key={doc} className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={form.required_documents.includes(doc)}
              onChange={(e) => {
                if (e.target.checked) {
                  setForm(prev => ({ ...prev, required_documents: [...prev.required_documents, doc] }))
                } else {
                  setForm(prev => ({ ...prev, required_documents: prev.required_documents.filter(d => d !== doc) }))
                }
              }}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">{doc}</span>
          </label>
        ))}
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Interview Notes
      </label>
      <textarea
        value={form.notes}
        onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
        rows={4}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Additional instructions for candidates..."
      />
    </div>

    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <h5 className="font-medium text-yellow-900 mb-2">Interview Tips</h5>
      <ul className="text-sm text-yellow-700 space-y-1">
        <li>• Specify clear date and time to avoid confusion</li>
        <li>• Include both AD and BS dates for Nepali candidates</li>
        <li>• List all required documents to help candidates prepare</li>
        <li>• Provide contact information for questions</li>
      </ul>
    </div>
  </div>
)

const ReviewPublishStep = ({ form, setForm, errors, jobData, jobId }) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Review & Publish</h3>
      <p className="text-sm text-gray-600 mb-6">
        Review all job details and choose to save as draft or publish immediately.
      </p>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <h4 className="font-medium text-blue-900 mb-2">Tips</h4>
        <ul className="space-y-1 list-disc list-inside">
          <li>Verify salary, benefits, and vacancies match the employer’s offer.</li>
          <li>Ensure LT/Chalani numbers and dates are correct before publishing.</li>
          <li>Use Publish Immediately only when all sections are complete.</li>
        </ul>
      </div>
    </div>

    {/* Job Summary */}
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
      <h4 className="text-md font-semibold text-gray-900 mb-4">Job Summary</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <span className="font-medium text-gray-700">Title:</span>
          <span className="ml-2 text-gray-900">{jobData.draft.posting_title}</span>
        </div>
        <div>
          <span className="font-medium text-gray-700">Country:</span>
          <span className="ml-2 text-gray-900">{jobData.draft.country}</span>
        </div>
        <div>
          <span className="font-medium text-gray-700">Employer:</span>
          <span className="ml-2 text-gray-900">{jobData.draft.employer}</span>
        </div>
        <div>
          <span className="font-medium text-gray-700">Agency:</span>
          <span className="ml-2 text-gray-900">{jobData.draft.posting_agency}</span>
        </div>
        <div>
          <span className="font-medium text-gray-700">Contract Period:</span>
          <span className="ml-2 text-gray-900">{jobData.draft.contract_period_years} years</span>
        </div>
        <div>
          <span className="font-medium text-gray-700">Positions:</span>
          <span className="ml-2 text-gray-900">{jobData.draft.positions.length} position(s)</span>
        </div>
      </div>

      {jobData.draft.positions.length > 0 && (
        <div className="mt-4">
          <h5 className="font-medium text-gray-700 mb-2">Positions & Salaries:</h5>
          <div className="space-y-1">
            {jobData.draft.positions.map((pos, idx) => (
              <div key={idx} className="text-sm text-gray-600">
                • {pos.title}: {pos.salary_amount} {pos.currency}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>

    {/* Completion Status */}
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <h4 className="text-md font-semibold text-blue-900 mb-4">Completion Status</h4>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { name: 'Basic Info', completed: !!jobData.draft.posting_title },
          { name: 'Posting Details', completed: !!jobData.posting.city },
          { name: 'Contract', completed: !!jobData.contract.period_years },
          { name: 'Positions', completed: jobData.positions.length > 0 },
          { name: 'Tags', completed: jobData.tags.skills.length > 0 },
          { name: 'Expenses', completed: jobData.expenses.length > 0 },
          { name: 'Cutout', completed: !!jobData.cutout.file },
          { name: 'Interview', completed: !!jobData.interview.interview_date_ad }
        ].map((section, idx) => (
          <div key={idx} className="flex items-center space-x-2">
            {section.completed ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-gray-400" />
            )}
            <span className={`text-sm ${section.completed ? 'text-green-700' : 'text-gray-500'}`}>
              {section.name}
            </span>
          </div>
        ))}
      </div>
    </div>

    {/* Publish Options */}
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h4 className="text-md font-semibold text-gray-900 mb-4">Publishing Options</h4>
      
      <div className="space-y-4">
        <label className="flex items-center space-x-3">
          <input
            type="radio"
            name="publish_option"
            checked={form.save_as_draft}
            onChange={() => setForm(prev => ({ ...prev, save_as_draft: true, publish_immediately: false }))}
            className="text-blue-600 focus:ring-blue-500"
          />
          <div>
            <span className="font-medium text-gray-900">Save as Draft</span>
            <p className="text-sm text-gray-600">Keep as draft for further editing before publishing</p>
          </div>
        </label>

        <label className="flex items-center space-x-3">
          <input
            type="radio"
            name="publish_option"
            checked={form.publish_immediately}
            onChange={() => setForm(prev => ({ ...prev, save_as_draft: false, publish_immediately: true }))}
            className="text-blue-600 focus:ring-blue-500"
          />
          <div>
            <span className="font-medium text-gray-900">Publish Immediately</span>
            <p className="text-sm text-gray-600">Make the job posting live and visible to candidates</p>
          </div>
        </label>
      </div>
    </div>

    {jobId && (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h5 className="font-medium text-green-900 mb-2">✅ Job Created Successfully</h5>
        <p className="text-sm text-green-700">
          Job ID: <span className="font-mono font-medium">{jobId}</span>
        </p>
        <p className="text-sm text-green-700 mt-1">
          You can continue editing or publish when ready.
        </p>
      </div>
    )}
  </div>
)

const BulkCreateStep = ({ form, setForm, errors, countries, currencies, jobTitles }) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Bulk Job Creation</h3>
      <p className="text-sm text-gray-600 mb-6">
        Create multiple job drafts quickly by specifying the job type and target countries.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Job Type *
        </label>
        <select
          value={form.job_type}
          onChange={(e) => setForm(prev => ({ ...prev, job_type: e.target.value }))}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.job_type ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          {jobTitles.map(title => (
            <option key={title} value={title}>{title}</option>
          ))}
        </select>
        {errors.job_type && (
          <p className="text-red-500 text-xs mt-1">{errors.job_type}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Posting Agency *
        </label>
        <input
          type="text"
          value={form.posting_agency}
          onChange={(e) => setForm(prev => ({ ...prev, posting_agency: e.target.value }))}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.posting_agency ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="e.g., Inspire Overseas Employment Agency"
        />
        {errors.posting_agency && (
          <p className="text-red-500 text-xs mt-1">{errors.posting_agency}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Base Salary *
        </label>
        <div className="flex space-x-2">
          <input
            type="number"
            min="0"
            value={form.base_salary}
            onChange={(e) => setForm(prev => ({ ...prev, base_salary: e.target.value }))}
            className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.base_salary ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="1800"
          />
          <select
            value={form.currency}
            onChange={(e) => setForm(prev => ({ ...prev, currency: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {currencies.map(currency => (
              <option key={currency} value={currency}>{currency}</option>
            ))}
          </select>
        </div>
        {errors.base_salary && (
          <p className="text-red-500 text-xs mt-1">{errors.base_salary}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Contract Period (Years) *
        </label>
        <input
          type="number"
          min="1"
          max="10"
          value={form.contract_period_years}
          onChange={(e) => setForm(prev => ({ ...prev, contract_period_years: e.target.value }))}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.contract_period_years ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="2"
        />
        {errors.contract_period_years && (
          <p className="text-red-500 text-xs mt-1">{errors.contract_period_years}</p>
        )}
      </div>
    </div>

    <div>
      <h4 className="text-md font-medium text-gray-900 mb-4">Target Countries & Job Counts</h4>
      {form.countries.map((country, index) => (
        <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 border border-gray-200 rounded-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country *
            </label>
            <select
              value={country.country}
              onChange={(e) => {
                const newCountries = [...form.countries]
                newCountries[index].country = e.target.value
                setForm(prev => ({ ...prev, countries: newCountries }))
              }}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors[`country_${index}`] ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select Country</option>
              {countries.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {errors[`country_${index}`] && (
              <p className="text-red-500 text-xs mt-1">{errors[`country_${index}`]}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Jobs *
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={country.job_count}
              onChange={(e) => {
                const newCountries = [...form.countries]
                newCountries[index].job_count = e.target.value
                setForm(prev => ({ ...prev, countries: newCountries }))
              }}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors[`job_count_${index}`] ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="3"
            />
            {errors[`job_count_${index}`] && (
              <p className="text-red-500 text-xs mt-1">{errors[`job_count_${index}`]}</p>
            )}
          </div>

          <div className="flex items-end">
            {form.countries.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  const newCountries = form.countries.filter((_, i) => i !== index)
                  setForm(prev => ({ ...prev, countries: newCountries }))
                }}
                className="text-red-600 hover:text-red-800 text-sm flex items-center px-3 py-2"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Remove
              </button>
            )}
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => {
          setForm(prev => ({
            ...prev,
            countries: [...prev.countries, { country: '', job_count: 1 }]
          }))
        }}
        className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
      >
        <Plus className="w-4 h-4 mr-1" />
        Add Country
      </button>
    </div>

    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h5 className="font-medium text-blue-900 mb-2">Bulk Creation Summary</h5>
      <p className="text-sm text-blue-700">
        This will create <strong>{form.countries.reduce((sum, c) => sum + Number(c.job_count || 0), 0)} job drafts</strong> for 
        <strong> {form.job_type}</strong> positions across <strong>{form.countries.length} countries</strong>.
      </p>
      <p className="text-xs text-blue-600 mt-2">
        Each draft will be created with basic information and can be individually edited later for detailed specifications.
      </p>
    </div>
  </div>
)

export default JobCreationWizard