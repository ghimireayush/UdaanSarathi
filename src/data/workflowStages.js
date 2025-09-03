// Complete 15-step workflow stages with document management
import { 
  FileText, Users, Calendar, CheckCircle, Heart, FileCheck, 
  Plane, Shield, Building, Passport, Ticket, Briefcase, 
  MapPin, Clock, CheckSquare 
} from 'lucide-react'

/**
 * Complete 15-stage workflow for overseas employment processing
 */
export const WORKFLOW_STAGES = [
  {
    id: 'applied',
    label: 'Applied',
    description: 'Initial application received and under review',
    icon: FileText,
    category: 'initial',
    order: 1,
    color: 'blue',
    requiredDocuments: [
      { name: 'Application Form', required: true, type: 'form' },
      { name: 'CV/Resume', required: true, type: 'document' },
      { name: 'Cover Letter', required: false, type: 'document' }
    ],
    actions: ['review', 'shortlist', 'reject'],
    estimatedDuration: '1-2 days',
    nextStages: ['shortlisted', 'rejected']
  },
  {
    id: 'shortlisted',
    label: 'Shortlisted',
    description: 'Candidate selected for interview consideration',
    icon: Users,
    category: 'selection',
    order: 2,
    color: 'green',
    requiredDocuments: [
      { name: 'Shortlist Notification', required: true, type: 'notification' },
      { name: 'Interview Guidelines', required: true, type: 'guide' }
    ],
    actions: ['schedule_interview', 'move_to_interview_pool'],
    estimatedDuration: '2-3 days',
    nextStages: ['interview-scheduled']
  },
  {
    id: 'interview-scheduled',
    label: 'Interview Scheduled',
    description: 'Interview appointment confirmed with candidate',
    icon: Calendar,
    category: 'interview',
    order: 3,
    color: 'yellow',
    requiredDocuments: [
      { name: 'Interview Schedule', required: true, type: 'schedule' },
      { name: 'Interview Checklist', required: true, type: 'checklist' },
      { name: 'Candidate Profile', required: true, type: 'profile' }
    ],
    actions: ['conduct_interview', 'reschedule', 'cancel'],
    estimatedDuration: '3-7 days',
    nextStages: ['interview-completed']
  },
  {
    id: 'interview-completed',
    label: 'Interview Completed',
    description: 'Interview conducted, awaiting evaluation results',
    icon: CheckCircle,
    category: 'interview',
    order: 4,
    color: 'blue',
    requiredDocuments: [
      { name: 'Interview Report', required: true, type: 'report' },
      { name: 'Evaluation Form', required: true, type: 'form' },
      { name: 'Interview Recording', required: false, type: 'media' }
    ],
    actions: ['evaluate', 'pass', 'fail', 'schedule_second_interview'],
    estimatedDuration: '1-2 days',
    nextStages: ['interview-passed', 'interview-failed', 'second-interview']
  },
  {
    id: 'interview-passed',
    label: 'Interview Passed',
    description: 'Successfully passed interview, proceeding to medical',
    icon: CheckSquare,
    category: 'selection',
    order: 5,
    color: 'green',
    requiredDocuments: [
      { name: 'Interview Pass Certificate', required: true, type: 'certificate' },
      { name: 'Medical Appointment Letter', required: true, type: 'appointment' }
    ],
    actions: ['schedule_medical', 'prepare_medical_docs'],
    estimatedDuration: '1-3 days',
    nextStages: ['medical-scheduled']
  },
  {
    id: 'medical-scheduled',
    label: 'Medical Scheduled',
    description: 'Medical examination appointment confirmed',
    icon: Heart,
    category: 'medical',
    order: 6,
    color: 'red',
    requiredDocuments: [
      { name: 'Medical Appointment', required: true, type: 'appointment' },
      { name: 'Medical Form', required: true, type: 'form' },
      { name: 'Health Declaration', required: true, type: 'declaration' }
    ],
    actions: ['conduct_medical', 'reschedule_medical'],
    estimatedDuration: '3-7 days',
    nextStages: ['medical-completed']
  },
  {
    id: 'medical-completed',
    label: 'Medical Completed',
    description: 'Medical examination completed, awaiting results',
    icon: FileCheck,
    category: 'medical',
    order: 7,
    color: 'orange',
    requiredDocuments: [
      { name: 'Medical Report', required: true, type: 'report' },
      { name: 'Health Certificate', required: true, type: 'certificate' },
      { name: 'Lab Results', required: true, type: 'results' }
    ],
    actions: ['review_medical', 'pass_medical', 'fail_medical'],
    estimatedDuration: '3-5 days',
    nextStages: ['medical-passed', 'medical-failed']
  },
  {
    id: 'medical-passed',
    label: 'Medical Passed',
    description: 'Medical examination passed, ready for visa process',
    icon: CheckCircle,
    category: 'medical',
    order: 8,
    color: 'green',
    requiredDocuments: [
      { name: 'Medical Clearance', required: true, type: 'clearance' },
      { name: 'Visa Application Guide', required: true, type: 'guide' }
    ],
    actions: ['start_visa_process', 'prepare_visa_docs'],
    estimatedDuration: '1-2 days',
    nextStages: ['visa-application']
  },
  {
    id: 'visa-application',
    label: 'Visa Application',
    description: 'Visa application submitted and under processing',
    icon: Passport,
    category: 'documentation',
    order: 9,
    color: 'purple',
    requiredDocuments: [
      { name: 'Visa Application Form', required: true, type: 'form' },
      { name: 'Passport Copy', required: true, type: 'document' },
      { name: 'Employment Contract', required: true, type: 'contract' },
      { name: 'Sponsor Letter', required: true, type: 'letter' },
      { name: 'Bank Statement', required: true, type: 'financial' }
    ],
    actions: ['track_visa', 'submit_additional_docs', 'follow_up'],
    estimatedDuration: '15-30 days',
    nextStages: ['visa-approved', 'visa-rejected']
  },
  {
    id: 'visa-approved',
    label: 'Visa Approved',
    description: 'Visa approved, proceeding with documentation',
    icon: CheckCircle,
    category: 'documentation',
    order: 10,
    color: 'green',
    requiredDocuments: [
      { name: 'Visa Approval Letter', required: true, type: 'approval' },
      { name: 'Visa Stamp/Sticker', required: true, type: 'visa' }
    ],
    actions: ['collect_visa', 'start_police_clearance'],
    estimatedDuration: '2-3 days',
    nextStages: ['police-clearance']
  },
  {
    id: 'police-clearance',
    label: 'Police Clearance',
    description: 'Police clearance certificate processing',
    icon: Shield,
    category: 'documentation',
    order: 11,
    color: 'blue',
    requiredDocuments: [
      { name: 'Police Clearance Application', required: true, type: 'application' },
      { name: 'Character Certificate', required: true, type: 'certificate' },
      { name: 'Local Police Verification', required: true, type: 'verification' }
    ],
    actions: ['apply_police_clearance', 'track_application', 'collect_certificate'],
    estimatedDuration: '7-15 days',
    nextStages: ['embassy-attestation']
  },
  {
    id: 'embassy-attestation',
    label: 'Embassy Attestation',
    description: 'Document attestation at embassy/consulate',
    icon: Building,
    category: 'documentation',
    order: 12,
    color: 'indigo',
    requiredDocuments: [
      { name: 'Attestation Application', required: true, type: 'application' },
      { name: 'Original Documents', required: true, type: 'documents' },
      { name: 'Embassy Fee Receipt', required: true, type: 'receipt' }
    ],
    actions: ['submit_for_attestation', 'track_attestation', 'collect_documents'],
    estimatedDuration: '5-10 days',
    nextStages: ['travel-documents']
  },
  {
    id: 'travel-documents',
    label: 'Travel Documents',
    description: 'Travel documents preparation and verification',
    icon: Ticket,
    category: 'travel',
    order: 13,
    color: 'cyan',
    requiredDocuments: [
      { name: 'Travel Insurance', required: true, type: 'insurance' },
      { name: 'Flight Itinerary', required: true, type: 'itinerary' },
      { name: 'Hotel Booking', required: false, type: 'booking' },
      { name: 'Emergency Contacts', required: true, type: 'contacts' }
    ],
    actions: ['book_flight', 'arrange_insurance', 'prepare_travel_kit'],
    estimatedDuration: '3-5 days',
    nextStages: ['pre-departure']
  },
  {
    id: 'pre-departure',
    label: 'Pre-departure',
    description: 'Final preparations and orientation before departure',
    icon: Briefcase,
    category: 'travel',
    order: 14,
    color: 'orange',
    requiredDocuments: [
      { name: 'Pre-departure Checklist', required: true, type: 'checklist' },
      { name: 'Orientation Certificate', required: true, type: 'certificate' },
      { name: 'Emergency Kit', required: true, type: 'kit' },
      { name: 'Contact Directory', required: true, type: 'directory' }
    ],
    actions: ['conduct_orientation', 'final_document_check', 'departure_clearance'],
    estimatedDuration: '2-3 days',
    nextStages: ['departed']
  },
  {
    id: 'departed',
    label: 'Departed',
    description: 'Candidate has successfully departed for employment',
    icon: Plane,
    category: 'completion',
    order: 15,
    color: 'green',
    requiredDocuments: [
      { name: 'Departure Confirmation', required: true, type: 'confirmation' },
      { name: 'Flight Boarding Pass', required: true, type: 'boarding_pass' },
      { name: 'Arrival Notification', required: true, type: 'notification' }
    ],
    actions: ['track_arrival', 'post_arrival_support', 'close_case'],
    estimatedDuration: 'Completed',
    nextStages: []
  }
]

/**
 * Document types and their properties
 */
export const DOCUMENT_TYPES = {
  form: {
    label: 'Form',
    icon: 'FileText',
    color: 'blue',
    allowedFormats: ['pdf', 'doc', 'docx'],
    maxSize: '5MB'
  },
  document: {
    label: 'Document',
    icon: 'File',
    color: 'gray',
    allowedFormats: ['pdf', 'doc', 'docx', 'jpg', 'png'],
    maxSize: '10MB'
  },
  certificate: {
    label: 'Certificate',
    icon: 'Award',
    color: 'yellow',
    allowedFormats: ['pdf', 'jpg', 'png'],
    maxSize: '5MB'
  },
  report: {
    label: 'Report',
    icon: 'FileText',
    color: 'green',
    allowedFormats: ['pdf', 'doc', 'docx'],
    maxSize: '10MB'
  },
  media: {
    label: 'Media',
    icon: 'Video',
    color: 'red',
    allowedFormats: ['mp4', 'mp3', 'wav', 'avi'],
    maxSize: '100MB'
  },
  financial: {
    label: 'Financial',
    icon: 'DollarSign',
    color: 'green',
    allowedFormats: ['pdf', 'xlsx', 'csv'],
    maxSize: '5MB'
  }
}

/**
 * Stage categories for grouping and filtering
 */
export const STAGE_CATEGORIES = {
  initial: {
    label: 'Initial Processing',
    description: 'Application and initial screening',
    color: 'blue',
    stages: ['applied', 'shortlisted']
  },
  selection: {
    label: 'Selection Process',
    description: 'Interview and selection activities',
    color: 'green',
    stages: ['shortlisted', 'interview-scheduled', 'interview-completed', 'interview-passed']
  },
  interview: {
    label: 'Interview Process',
    description: 'Interview scheduling and evaluation',
    color: 'yellow',
    stages: ['interview-scheduled', 'interview-completed', 'interview-passed']
  },
  medical: {
    label: 'Medical Process',
    description: 'Health examination and clearance',
    color: 'red',
    stages: ['medical-scheduled', 'medical-completed', 'medical-passed']
  },
  documentation: {
    label: 'Documentation',
    description: 'Visa and legal document processing',
    color: 'purple',
    stages: ['visa-application', 'visa-approved', 'police-clearance', 'embassy-attestation']
  },
  travel: {
    label: 'Travel Preparation',
    description: 'Travel arrangements and final preparations',
    color: 'cyan',
    stages: ['travel-documents', 'pre-departure']
  },
  completion: {
    label: 'Completion',
    description: 'Successful deployment completion',
    color: 'green',
    stages: ['departed']
  }
}

/**
 * Stage transitions and business rules
 */
export const STAGE_TRANSITIONS = {
  applied: {
    canMoveTo: ['shortlisted', 'rejected'],
    requiredFields: ['application_date', 'candidate_id'],
    autoTransitions: []
  },
  shortlisted: {
    canMoveTo: ['interview-scheduled', 'rejected'],
    requiredFields: ['shortlist_date', 'shortlist_reason'],
    autoTransitions: []
  },
  'interview-scheduled': {
    canMoveTo: ['interview-completed', 'cancelled'],
    requiredFields: ['interview_date', 'interview_time', 'interviewer'],
    autoTransitions: [
      {
        condition: 'interview_date_passed',
        targetStage: 'interview-completed',
        delay: '1 day'
      }
    ]
  },
  'interview-completed': {
    canMoveTo: ['interview-passed', 'interview-failed', 'second-interview'],
    requiredFields: ['interview_result', 'evaluation_score'],
    autoTransitions: []
  },
  'interview-passed': {
    canMoveTo: ['medical-scheduled'],
    requiredFields: ['pass_date', 'medical_requirements'],
    autoTransitions: [
      {
        condition: 'auto_schedule_medical',
        targetStage: 'medical-scheduled',
        delay: '2 days'
      }
    ]
  },
  'medical-scheduled': {
    canMoveTo: ['medical-completed'],
    requiredFields: ['medical_date', 'medical_center'],
    autoTransitions: []
  },
  'medical-completed': {
    canMoveTo: ['medical-passed', 'medical-failed'],
    requiredFields: ['medical_result', 'medical_report'],
    autoTransitions: []
  },
  'medical-passed': {
    canMoveTo: ['visa-application'],
    requiredFields: ['medical_clearance_date'],
    autoTransitions: []
  },
  'visa-application': {
    canMoveTo: ['visa-approved', 'visa-rejected'],
    requiredFields: ['application_date', 'visa_type', 'embassy'],
    autoTransitions: []
  },
  'visa-approved': {
    canMoveTo: ['police-clearance'],
    requiredFields: ['visa_approval_date', 'visa_number'],
    autoTransitions: []
  },
  'police-clearance': {
    canMoveTo: ['embassy-attestation'],
    requiredFields: ['clearance_application_date'],
    autoTransitions: []
  },
  'embassy-attestation': {
    canMoveTo: ['travel-documents'],
    requiredFields: ['attestation_date', 'embassy_reference'],
    autoTransitions: []
  },
  'travel-documents': {
    canMoveTo: ['pre-departure'],
    requiredFields: ['travel_insurance', 'flight_booking'],
    autoTransitions: []
  },
  'pre-departure': {
    canMoveTo: ['departed'],
    requiredFields: ['orientation_date', 'departure_date'],
    autoTransitions: []
  },
  departed: {
    canMoveTo: [],
    requiredFields: ['departure_confirmation', 'arrival_notification'],
    autoTransitions: []
  }
}

/**
 * Get stage by ID
 * @param {string} stageId - Stage identifier
 * @returns {Object|null} Stage object
 */
export const getStageById = (stageId) => {
  return WORKFLOW_STAGES.find(stage => stage.id === stageId) || null
}

/**
 * Get next possible stages for a given stage
 * @param {string} currentStageId - Current stage ID
 * @returns {Array} Array of possible next stages
 */
export const getNextStages = (currentStageId) => {
  const transitions = STAGE_TRANSITIONS[currentStageId]
  if (!transitions) return []
  
  return transitions.canMoveTo.map(stageId => getStageById(stageId)).filter(Boolean)
}

/**
 * Get stages by category
 * @param {string} category - Category name
 * @returns {Array} Array of stages in category
 */
export const getStagesByCategory = (category) => {
  const categoryInfo = STAGE_CATEGORIES[category]
  if (!categoryInfo) return []
  
  return categoryInfo.stages.map(stageId => getStageById(stageId)).filter(Boolean)
}

/**
 * Validate stage transition
 * @param {string} fromStage - Current stage
 * @param {string} toStage - Target stage
 * @param {Object} candidateData - Candidate data for validation
 * @returns {Object} Validation result
 */
export const validateStageTransition = (fromStage, toStage, candidateData = {}) => {
  const transitions = STAGE_TRANSITIONS[fromStage]
  
  if (!transitions) {
    return {
      valid: false,
      reason: 'Invalid current stage'
    }
  }
  
  if (!transitions.canMoveTo.includes(toStage)) {
    return {
      valid: false,
      reason: `Cannot move from ${fromStage} to ${toStage}`
    }
  }
  
  // Check required fields
  const missingFields = transitions.requiredFields.filter(field => 
    !candidateData[field] || candidateData[field] === ''
  )
  
  if (missingFields.length > 0) {
    return {
      valid: false,
      reason: `Missing required fields: ${missingFields.join(', ')}`,
      missingFields
    }
  }
  
  return {
    valid: true,
    reason: 'Transition allowed'
  }
}

/**
 * Get required documents for a stage
 * @param {string} stageId - Stage identifier
 * @returns {Array} Required documents
 */
export const getRequiredDocuments = (stageId) => {
  const stage = getStageById(stageId)
  return stage ? stage.requiredDocuments || [] : []
}

/**
 * Calculate workflow progress
 * @param {string} currentStageId - Current stage
 * @returns {Object} Progress information
 */
export const calculateWorkflowProgress = (currentStageId) => {
  const currentStage = getStageById(currentStageId)
  if (!currentStage) {
    return {
      percentage: 0,
      currentStep: 0,
      totalSteps: WORKFLOW_STAGES.length,
      stagesCompleted: 0,
      stagesRemaining: WORKFLOW_STAGES.length
    }
  }
  
  const currentStep = currentStage.order
  const totalSteps = WORKFLOW_STAGES.length
  const percentage = Math.round((currentStep / totalSteps) * 100)
  
  return {
    percentage,
    currentStep,
    totalSteps,
    stagesCompleted: currentStep - 1,
    stagesRemaining: totalSteps - currentStep,
    currentStage: currentStage.label,
    nextStage: getNextStages(currentStageId)[0]?.label || 'Completed'
  }
}

export default {
  WORKFLOW_STAGES,
  DOCUMENT_TYPES,
  STAGE_CATEGORIES,
  STAGE_TRANSITIONS,
  getStageById,
  getNextStages,
  getStagesByCategory,
  validateStageTransition,
  getRequiredDocuments,
  calculateWorkflowProgress
}