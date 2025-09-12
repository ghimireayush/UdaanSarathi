// Job Creation Service - Handles the 7-step job creation flow
import jobService from './jobService.js'
import { handleServiceError } from '../utils/errorHandler.js'

// DTOs and Types based on the specification
export const CreateJobPostingDto = {
  // Step 1: Draft Create (minimal fields)
  posting_title: '',
  country: '',
  posting_agency: '',
  employer: '',
  contract: {
    period_years: 0
  },
  positions: [
    {
      title: '',
      salary: {
        monthly_amount: 0,
        currency: 'AED'
      }
    }
  ]
}

export const PostingDetailsDto = {
  city: '',
  lt_number: '',
  chalani_number: '',
  approval_date: null, // ISO string
  posting_date: null,  // ISO string
  announcement_type: 'normal', // normal|urgent|corrigendum|reannouncement
  notes: ''
}

export const ContractDto = {
  period_years: 0,
  renewable: false,
  hours_per_day: 8,
  days_per_week: 6,
  overtime_policy: 'as_per_company_policy', // as_per_company_policy|paid|unpaid|not_applicable
  weekly_off_days: '',
  food: 'free',           // free|paid|not_provided
  accommodation: 'free',  // free|paid|not_provided
  transport: 'free',      // free|paid|not_provided
  annual_leave_days: 30
}

export const PositionDto = {
  title: '',
  vacancies: {
    male: 0,
    female: 0
  },
  salary: {
    monthly_amount: 0,
    currency: 'AED'
  },
  // Optional overrides
  hours_per_day_override: null,
  days_per_week_override: null,
  overtime_policy_override: null,
  weekly_off_days_override: null,
  food_override: null,
  accommodation_override: null,
  transport_override: null,
  position_notes: ''
}

export const TagsDto = {
  skills: [],
  education_requirements: [],
  experience_requirements: {
    min_years: null,
    preferred_years: null,
    domains: []
  },
  canonical_title_ids: [],
  canonical_title_names: []
}

export const ExpenseDto = {
  type: 'Medical', // Medical|Insurance|Travel|Visa/Permit|Training|Welfare/Service
  who_pays: 'company', // company|worker|shared|not_applicable|agency
  is_free: true,
  amount: null,
  currency: null,
  notes: ''
}

export const CutoutDto = {
  file: null,
  cutout_url: '',
  cutout_filename: ''
}

export const InterviewDto = {
  interview_date_ad: null, // ISO string
  interview_date_bs: null, // Nepali date string
  interview_time: null,    // HH:MM format
  location: '',
  contact_person: '',
  required_documents: [],  // Array of document names
  notes: '',
  expenses: []            // Array of ExpenseDto for interview-related costs
}

export const ReviewPublishDto = {
  publish_immediately: false,
  save_as_draft: true,
  status: 'draft' // draft | published
}

class JobCreationService {
  /**
   * Step 1: Create minimal draft job posting
   * @param {Object} draftData - Minimal job posting data
   * @returns {Promise<Object>} Created job with ID
   */
  async createDraft(draftData) {
    return handleServiceError(async () => {
      // Validate minimal required fields
      this.validateDraftData(draftData)
      
      const jobData = {
        posting_title: draftData.posting_title,
        country: draftData.country,
        posting_agency: draftData.posting_agency,
        employer: draftData.employer,
        contract: {
          period_years: Number(draftData.contract.period_years)
        },
        positions: draftData.positions.map(pos => ({
          title: pos.title,
          salary: {
            monthly_amount: Number(pos.salary.monthly_amount),
            currency: pos.salary.currency || 'AED'
          }
        })),
        // Set derived fields for compatibility
        title: draftData.posting_title,
        company: draftData.employer,
        description: '',
        salary_amount: Number(draftData.positions[0]?.salary?.monthly_amount || 0),
        currency: draftData.positions[0]?.salary?.currency || 'AED',
        category: draftData.positions[0]?.title || 'General',
        tags: [],
        requirements: []
      }

      return await jobService.createDraftJob(jobData)
    }, 3, 500)
  }

  /**
   * Step 2: Update posting details
   * @param {string} jobId - Job ID
   * @param {Object} postingDetails - Posting details data
   * @returns {Promise<Object>} Updated job
   */
  async updatePostingDetails(jobId, postingDetails) {
    return handleServiceError(async () => {
      const updateData = {
        city: postingDetails.city,
        lt_number: postingDetails.lt_number,
        chalani_number: postingDetails.chalani_number,
        approval_date: postingDetails.approval_date ? 
          new Date(postingDetails.approval_date).toISOString() : null,
        posting_date: postingDetails.posting_date ? 
          new Date(postingDetails.posting_date).toISOString() : null,
        announcement_type: postingDetails.announcement_type || 'normal',
        administrative_notes: postingDetails.notes || ''
      }

      return await jobService.updateJob(jobId, updateData)
    }, 3, 500)
  }

  /**
   * Step 3: Update contract details
   * @param {string} jobId - Job ID
   * @param {Object} contractData - Contract data
   * @returns {Promise<Object>} Updated job
   */
  async updateContract(jobId, contractData) {
    return handleServiceError(async () => {
      const updateData = {
        contract: {
          period_years: Number(contractData.period_years),
          renewable: Boolean(contractData.renewable),
          hours_per_day: Number(contractData.hours_per_day),
          days_per_week: Number(contractData.days_per_week),
          overtime_policy: contractData.overtime_policy,
          weekly_off_days: contractData.weekly_off_days,
          benefits: {
            food: contractData.food,
            accommodation: contractData.accommodation,
            transport: contractData.transport
          },
          annual_leave_days: Number(contractData.annual_leave_days)
        }
      }

      return await jobService.updateJob(jobId, updateData)
    }, 3, 500)
  }

  /**
   * Step 4: Update positions
   * @param {string} jobId - Job ID
   * @param {Array} positionsData - Array of position data
   * @returns {Promise<Object>} Updated job
   */
  async updatePositions(jobId, positionsData) {
    return handleServiceError(async () => {
      const updateData = {
        positions: positionsData.map(pos => {
          const currency =
            pos.salary?.currency || pos.currency || 'AED'
          const monthlyAmount =
            pos.salary?.monthly_amount ?? pos.salary_amount ?? 0
          const maleVacancies =
            pos.vacancies?.male ?? pos.vacancies_male ?? 0
          const femaleVacancies =
            pos.vacancies?.female ?? pos.vacancies_female ?? 0
          return {
            title: pos.title,
            vacancies: {
              male: Number(maleVacancies),
              female: Number(femaleVacancies)
            },
            salary: {
              monthly_amount: Number(monthlyAmount),
              currency
            },
            // Position-specific overrides (support both nested overrides{} and _override fields)
            overrides: {
              hours_per_day: pos.overrides?.hours_per_day
                ? Number(pos.overrides.hours_per_day)
                : pos.hours_per_day_override
                ? Number(pos.hours_per_day_override)
                : null,
              days_per_week: pos.overrides?.days_per_week
                ? Number(pos.overrides.days_per_week)
                : pos.days_per_week_override
                ? Number(pos.days_per_week_override)
                : null,
              overtime_policy:
                pos.overrides?.overtime_policy ??
                pos.overtime_policy_override ??
                null,
              weekly_off_days:
                pos.overrides?.weekly_off_days ??
                pos.weekly_off_days_override ??
                null,
              benefits: {
                food:
                  pos.overrides?.food ??
                  pos.food_override ??
                  null,
                accommodation:
                  pos.overrides?.accommodation ??
                  pos.accommodation_override ??
                  null,
                transport:
                  pos.overrides?.transport ??
                  pos.transport_override ??
                  null
              },
              notes: pos.overrides?.notes ?? pos.position_notes ?? ''
            }
          }
        })
      }

      return await jobService.updateJob(jobId, updateData)
    }, 3, 500)
  }

  /**
   * Step 5: Update tags and canonical titles
   * @param {string} jobId - Job ID
   * @param {Object} tagsData - Tags and titles data
   * @returns {Promise<Object>} Updated job
   */
  async updateTags(jobId, tagsData) {
    return handleServiceError(async () => {
      const updateData = {
        skills: tagsData.skills?.filter(s => s && s.trim()) || [],
        education_requirements: tagsData.education_requirements?.filter(e => e && e.trim()) || [],
        experience_requirements: {
          min_years: tagsData.experience_requirements?.min_years ? 
            Number(tagsData.experience_requirements.min_years) : null,
          preferred_years: tagsData.experience_requirements?.preferred_years ? 
            Number(tagsData.experience_requirements.preferred_years) : null,
          domains: tagsData.experience_requirements?.domains?.filter(d => d && d.trim()) || []
        },
        canonical_title_ids: tagsData.canonical_title_ids || [],
        canonical_title_names: tagsData.canonical_title_names?.filter(n => n && n.trim()) || [],
        // Update legacy tags field for compatibility
        tags: tagsData.skills?.filter(s => s && s.trim()) || []
      }

      return await jobService.updateJob(jobId, updateData)
    }, 3, 500)
  }

  /**
   * Step 6: Update expenses
   * @param {string} jobId - Job ID
   * @param {Array} expensesData - Array of expense data
   * @returns {Promise<Object>} Updated job
   */
  async updateExpenses(jobId, expensesData) {
    return handleServiceError(async () => {
      const updateData = {
        expenses: expensesData.map(exp => ({
          type: exp.type,
          who_pays: exp.who_pays,
          is_free: Boolean(exp.is_free),
          amount: exp.is_free ? null : (exp.amount ? Number(exp.amount) : null),
          currency: exp.is_free ? null : (exp.currency || 'AED'),
          notes: exp.notes || ''
        }))
      }

      return await jobService.updateJob(jobId, updateData)
    }, 3, 500)
  }

  /**
   * Step 7: Upload cutout image
   * @param {string} jobId - Job ID
   * @param {Object} cutoutData - Cutout data with file
   * @returns {Promise<Object>} Updated job
   */
  async uploadCutout(jobId, cutoutData) {
    return handleServiceError(async () => {
      // In a real implementation, this would:
      // 1. Upload file to storage (e.g., /public/{license}/{jobId}/cutout.{ext})
      // 2. Update job with cutout_url and cutout_filename
      
      const updateData = {
        cutout_url: cutoutData.cutout_url || null,
        cutout_filename: cutoutData.cutout_filename || null
      }

      return await jobService.updateJob(jobId, updateData)
    }, 3, 500)
  }

  /**
   * Step 8: Update interview details (optional)
   * @param {string} jobId - Job ID
   * @param {Object} interviewData - Interview data
   * @returns {Promise<Object>} Updated job
   */
  async updateInterview(jobId, interviewData) {
    return handleServiceError(async () => {
      const updateData = {
        interview: {
          interview_date_ad: interviewData.interview_date_ad ? 
            new Date(interviewData.interview_date_ad).toISOString() : null,
          interview_date_bs: interviewData.interview_date_bs || null,
          interview_time: interviewData.interview_time || null,
          location: interviewData.location || null,
          contact_person: interviewData.contact_person || null,
          required_documents: interviewData.required_documents || [],
          notes: interviewData.notes || null,
          expenses: interviewData.expenses?.map(exp => ({
            type: exp.type,
            who_pays: exp.who_pays,
            is_free: Boolean(exp.is_free),
            amount: exp.is_free ? null : (exp.amount ? Number(exp.amount) : null),
            currency: exp.is_free ? null : (exp.currency || 'AED'),
            notes: exp.notes || ''
          })) || []
        }
      }

      return await jobService.updateJob(jobId, updateData)
    }, 3, 500)
  }

  /**
   * Remove cutout image
   * @param {string} jobId - Job ID
   * @param {boolean} deleteFile - Whether to delete the actual file
   * @returns {Promise<Object>} Updated job
   */
  async removeCutout(jobId, deleteFile = false) {
    return handleServiceError(async () => {
      // In a real implementation, this would:
      // 1. If deleteFile=true, delete the actual file from storage
      // 2. Clear the cutout_url and cutout_filename from database
      
      const updateData = {
        cutout_url: null,
        cutout_filename: null
      }

      return await jobService.updateJob(jobId, updateData)
    }, 3, 500)
  }

  /**
   * Get job creation progress
   * @param {string} jobId - Job ID
   * @returns {Promise<Object>} Job creation progress
   */
  async getJobCreationProgress(jobId) {
    return handleServiceError(async () => {
      const job = await jobService.getJobById(jobId)
      if (!job) {
        throw new Error('Job not found')
      }

      const progress = {
        jobId: job.id,
        currentStep: this.determineCurrentStep(job),
        completedSteps: this.getCompletedSteps(job),
        totalSteps: 7,
        isComplete: this.isJobCreationComplete(job),
        canPublish: this.canPublishJob(job)
      }

      return progress
    }, 3, 500)
  }

  /**
   * Validate draft data
   * @private
   */
  validateDraftData(draftData) {
    const errors = []

    if (!draftData.posting_title?.trim()) {
      errors.push('Posting title is required')
    }
    if (!draftData.country?.trim()) {
      errors.push('Country is required')
    }
    if (!draftData.posting_agency?.trim()) {
      errors.push('Posting agency is required')
    }
    if (!draftData.employer?.trim()) {
      errors.push('Employer is required')
    }
    if (!draftData.contract?.period_years || draftData.contract.period_years <= 0) {
      errors.push('Contract period must be a positive number')
    }
    if (!draftData.positions || draftData.positions.length === 0) {
      errors.push('At least one position is required')
    }

    draftData.positions?.forEach((pos, index) => {
      if (!pos.title?.trim()) {
        errors.push(`Position ${index + 1}: title is required`)
      }
      if (!pos.salary?.monthly_amount || pos.salary.monthly_amount <= 0) {
        errors.push(`Position ${index + 1}: salary must be a positive number`)
      }
    })

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`)
    }
  }

  /**
   * Determine current step based on job data
   * @private
   */
  determineCurrentStep(job) {
    if (!job.city && !job.lt_number) return 2 // Posting Details
    if (!job.contract?.hours_per_day) return 3 // Contract
    if (!job.positions || job.positions.length === 0) return 4 // Positions
    if (!job.skills || job.skills.length === 0) return 5 // Tags
    if (!job.expenses || job.expenses.length === 0) return 6 // Expenses
    if (!job.cutout_url) return 7 // Cutout
    if (!job.interview) return 8 // Interview (optional)
    return 9 // Review & Publish
  }

  /**
   * Get completed steps
   * @private
   */
  getCompletedSteps(job) {
    const completed = [1] // Draft always completed if job exists

    if (job.city || job.lt_number) completed.push(2)
    if (job.contract?.hours_per_day) completed.push(3)
    if (job.positions && job.positions.length > 0) completed.push(4)
    if (job.skills && job.skills.length > 0) completed.push(5)
    if (job.expenses && job.expenses.length > 0) completed.push(6)
    if (job.cutout_url) completed.push(7)
    if (job.interview) completed.push(8)
    // Step 9 (Review & Publish) is always available once step 1 is complete

    return completed
  }

  /**
   * Check if job creation is complete
   * @private
   */
  isJobCreationComplete(job) {
    return this.getCompletedSteps(job).length >= 6 // Minimum required steps (1-6)
  }

  /**
   * Check if job can be published
   * @private
   */
  canPublishJob(job) {
    // Minimum requirements for publishing
    return !!(
      job.posting_title &&
      job.country &&
      job.employer &&
      job.contract?.period_years &&
      job.positions && job.positions.length > 0
    )
  }
}

// Create and export singleton instance
const jobCreationService = new JobCreationService()
export default jobCreationService