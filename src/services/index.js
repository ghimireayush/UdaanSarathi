// Service Layer Index - Export all services
export { default as constantsService } from './constantsService.js'
export { default as jobService } from './jobService.js'
export { default as candidateService } from './candidateService.js'
export { default as applicationService } from './applicationService.js'
export { default as interviewService } from './interviewService.js'
export { default as analyticsService } from './analyticsService.js'
export { default as agencyService } from './agencyService.js'
export { default as workflowService } from './workflowService.js'

// Named exports for convenience
export {
  getJobStatuses,
  getApplicationStages,
  getInterviewStatuses,
  getCountries,
  getJobCategories,
  getJobStatusLabel,
  getApplicationStageLabel,
  getInterviewStatusLabel,
  getApplicationStageColor,
  getInterviewStatusColor
} from './constantsService.js'