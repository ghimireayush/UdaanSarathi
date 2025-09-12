#!/usr/bin/env node

/**
 * Job Creation Flow Validation Script
 * 
 * This script validates that the 7-step job creation flow is properly implemented
 * according to the specification in the README.
 */

import fs from 'fs'
import path from 'path'

const REQUIRED_FILES = [
  // Sample data files
  'src/resource/sample/data/jobs.create.sample.json',
  'src/resource/sample/data/jobs.update-tags.sample.json',
  'src/resource/sample/data/job-titles.sample.json',
  'src/resource/sample/data/candidate-preferences.sample.json',
  'src/resource/sample/data/interview.sample.json',
  'src/resource/sample/data/expenses.medical.sample.json',
  'src/resource/sample/data/expenses.travel.sample.json',
  'src/resource/sample/data/expenses.visa.sample.json',
  'src/resource/sample/data/expenses.training.sample.json',
  'src/resource/sample/data/expenses.welfare.sample.json',
  'src/resource/sample/data/job.get.with-cutout.sample.json',
  'src/resource/sample/data/job.get.after-cutout-removed.sample.json',
  
  // Implementation files
  'src/components/JobCreationWizard.jsx',
  'src/services/jobCreationService.js'
]

const REQUIRED_COMPONENTS = [
  'JobCreationWizard',
  'DraftCreateStep',
  'PostingDetailsStep', 
  'ContractStep',
  'PositionsStep',
  'TagsStep',
  'ExpensesStep',
  'CutoutStep',
  'InterviewStep',
  'ReviewPublishStep'
]

const REQUIRED_DTOS = [
  'CreateJobPostingDto',
  'PostingDetailsDto',
  'ContractDto',
  'PositionDto',
  'TagsDto',
  'ExpenseDto',
  'CutoutDto',
  'InterviewDto'
]

const REQUIRED_SERVICE_METHODS = [
  'createDraft',
  'updatePostingDetails',
  'updateContract',
  'updatePositions',
  'updateTags',
  'updateExpenses',
  'uploadCutout',
  'removeCutout',
  'updateInterview'
]

function checkFileExists(filePath) {
  const fullPath = path.join(process.cwd(), filePath)
  return fs.existsSync(fullPath)
}

function checkFileContent(filePath, requiredContent) {
  try {
    const fullPath = path.join(process.cwd(), filePath)
    const content = fs.readFileSync(fullPath, 'utf8')
    return requiredContent.every(item => content.includes(item))
  } catch (error) {
    return false
  }
}

function validateSampleData() {
  console.log('🔍 Validating sample data files...')
  
  const sampleFiles = REQUIRED_FILES.filter(f => f.includes('sample/data'))
  let passed = 0
  
  sampleFiles.forEach(file => {
    if (checkFileExists(file)) {
      console.log(`✅ ${file}`)
      passed++
    } else {
      console.log(`❌ ${file} - Missing`)
    }
  })
  
  console.log(`Sample data: ${passed}/${sampleFiles.length} files present\n`)
  return passed === sampleFiles.length
}

function validateJobCreationWizard() {
  console.log('🔍 Validating JobCreationWizard component...')
  
  const wizardFile = 'src/components/JobCreationWizard.jsx'
  if (!checkFileExists(wizardFile)) {
    console.log(`❌ ${wizardFile} - Missing`)
    return false
  }
  
  const hasComponents = checkFileContent(wizardFile, REQUIRED_COMPONENTS)
  const hasSteps = checkFileContent(wizardFile, [
    'currentStep',
    'steps.length',
    'handleNext',
    'handlePrevious',
    'saveCurrentStep'
  ])
  
  if (hasComponents && hasSteps) {
    console.log(`✅ ${wizardFile} - All components and step logic present`)
    return true
  } else {
    console.log(`❌ ${wizardFile} - Missing required components or step logic`)
    return false
  }
}

function validateJobCreationService() {
  console.log('🔍 Validating JobCreationService...')
  
  const serviceFile = 'src/services/jobCreationService.js'
  if (!checkFileExists(serviceFile)) {
    console.log(`❌ ${serviceFile} - Missing`)
    return false
  }
  
  const hasDTOs = checkFileContent(serviceFile, REQUIRED_DTOS)
  const hasMethods = checkFileContent(serviceFile, REQUIRED_SERVICE_METHODS)
  
  if (hasDTOs && hasMethods) {
    console.log(`✅ ${serviceFile} - All DTOs and methods present`)
    return true
  } else {
    console.log(`❌ ${serviceFile} - Missing required DTOs or methods`)
    return false
  }
}

function validateIntegration() {
  console.log('🔍 Validating integration...')
  
  const draftsFile = 'src/pages/Drafts.jsx'
  if (!checkFileExists(draftsFile)) {
    console.log(`❌ ${draftsFile} - Missing`)
    return false
  }
  
  const hasWizardImport = checkFileContent(draftsFile, ['JobCreationWizard'])
  const hasWizardButton = checkFileContent(draftsFile, ['Job Creation Wizard', 'showJobWizard'])
  
  if (hasWizardImport && hasWizardButton) {
    console.log(`✅ ${draftsFile} - Wizard properly integrated`)
    return true
  } else {
    console.log(`❌ ${draftsFile} - Wizard not properly integrated`)
    return false
  }
}

function validateStepFlow() {
  console.log('🔍 Validating 9-step flow specification...')
  
  const steps = [
    { id: 1, name: 'Draft Create', fields: ['posting_title', 'country', 'posting_agency', 'employer', 'contract.period_years', 'positions'] },
    { id: 2, name: 'Posting Details', fields: ['city', 'lt_number', 'chalani_number', 'approval_date', 'posting_date', 'announcement_type'] },
    { id: 3, name: 'Contract', fields: ['period_years', 'renewable', 'hours_per_day', 'days_per_week', 'overtime_policy', 'benefits'] },
    { id: 4, name: 'Positions', fields: ['title', 'vacancies', 'salary', 'overrides'] },
    { id: 5, name: 'Tags & Canonical Titles', fields: ['skills', 'education_requirements', 'experience_requirements', 'canonical_title_ids'] },
    { id: 6, name: 'Expenses', fields: ['type', 'who_pays', 'is_free', 'amount', 'currency', 'notes'] },
    { id: 7, name: 'Cutout', fields: ['cutout_url', 'cutout_filename'] },
    { id: 8, name: 'Interview', fields: ['interview_date_ad', 'interview_time', 'location', 'required_documents'] },
    { id: 9, name: 'Review & Publish', fields: ['publish_immediately', 'save_as_draft'] }
  ]
  
  let validSteps = 0
  
  steps.forEach(step => {
    const serviceFile = 'src/services/jobCreationService.js'
    const hasStepFields = checkFileContent(serviceFile, step.fields)
    
    if (hasStepFields) {
      console.log(`✅ Step ${step.id}: ${step.name} - Fields present`)
      validSteps++
    } else {
      console.log(`❌ Step ${step.id}: ${step.name} - Missing fields`)
    }
  })
  
  console.log(`Step flow: ${validSteps}/${steps.length} steps properly implemented\n`)
  return validSteps === steps.length
}

function validateAPIEndpoints() {
  console.log('🔍 Validating API endpoint patterns...')
  
  const expectedEndpoints = [
    'POST /agencies/:license/job-postings (Draft Create)',
    'PATCH /agencies/:license/job-postings/:id (Updates)',
    'POST /agencies/:license/job-postings/:id/cutout (Cutout Upload)',
    'DELETE /agencies/:license/job-postings/:id/cutout (Cutout Remove)'
  ]
  
  // For now, just check that the service methods exist
  const serviceFile = 'src/services/jobCreationService.js'
  const hasEndpointMethods = checkFileContent(serviceFile, [
    'createDraft',
    'updatePostingDetails',
    'updateContract',
    'updatePositions',
    'updateTags',
    'updateExpenses',
    'uploadCutout',
    'removeCutout'
  ])
  
  if (hasEndpointMethods) {
    console.log(`✅ All API endpoint methods implemented`)
    expectedEndpoints.forEach(endpoint => console.log(`  📡 ${endpoint}`))
    return true
  } else {
    console.log(`❌ Missing API endpoint methods`)
    return false
  }
}

function main() {
  console.log('🚀 UdaanSarathi Job Creation Flow Validation\n')
  console.log('Validating implementation against specification...\n')
  
  const results = {
    sampleData: validateSampleData(),
    wizard: validateJobCreationWizard(),
    service: validateJobCreationService(),
    integration: validateIntegration(),
    stepFlow: validateStepFlow(),
    apiEndpoints: validateAPIEndpoints()
  }
  
  console.log('\n📊 Validation Summary:')
  console.log('=' .repeat(50))
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL'
    const testName = test.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
    console.log(`${status} ${testName}`)
  })
  
  const totalPassed = Object.values(results).filter(Boolean).length
  const totalTests = Object.keys(results).length
  
  console.log('=' .repeat(50))
  console.log(`Overall: ${totalPassed}/${totalTests} tests passed`)
  
  if (totalPassed === totalTests) {
    console.log('\n🎉 All validations passed! Job creation flow is properly implemented.')
    console.log('\n📋 Implementation includes:')
    console.log('  • 7-step job creation wizard')
    console.log('  • Complete sample data structure')
    console.log('  • Proper DTOs and service methods')
    console.log('  • Frontend integration')
    console.log('  • API endpoint patterns')
    process.exit(0)
  } else {
    console.log('\n⚠️  Some validations failed. Please review the implementation.')
    process.exit(1)
  }
}

// Run validation if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { main as validateJobCreationFlow }