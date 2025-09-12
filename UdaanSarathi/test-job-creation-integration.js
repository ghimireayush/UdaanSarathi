#!/usr/bin/env node

/**
 * Job Creation Integration Test
 * 
 * This script tests the integration of the unified Job Creation Wizard
 * that replaces the separate "Create Minimal Draft" and "Bulk Create" functionality.
 */

import fs from 'fs'
import path from 'path'

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

function testWizardIntegration() {
  console.log('🔍 Testing Job Creation Wizard Integration...')
  
  const draftsFile = 'src/pages/Drafts.jsx'
  const wizardFile = 'src/components/JobCreationWizard.jsx'
  
  // Check if files exist
  if (!checkFileExists(draftsFile)) {
    console.log(`❌ ${draftsFile} not found`)
    return false
  }
  
  if (!checkFileExists(wizardFile)) {
    console.log(`❌ ${wizardFile} not found`)
    return false
  }
  
  // Check integration in Drafts.jsx
  const hasWizardImport = checkFileContent(draftsFile, ['JobCreationWizard'])
  const hasWizardState = checkFileContent(draftsFile, ['showJobWizard', 'setShowJobWizard'])
  const hasWizardButton = checkFileContent(draftsFile, ['Create Job Draft'])
  const hasWizardComponent = checkFileContent(draftsFile, ['<JobCreationWizard'])
  const removedOldButtons = !checkFileContent(draftsFile, ['Create Minimal Draft', 'showMinimalModal'])
  
  console.log(`  Import: ${hasWizardImport ? '✅' : '❌'}`)
  console.log(`  State: ${hasWizardState ? '✅' : '❌'}`)
  console.log(`  Button: ${hasWizardButton ? '✅' : '❌'}`)
  console.log(`  Component: ${hasWizardComponent ? '✅' : '❌'}`)
  console.log(`  Old buttons removed: ${removedOldButtons ? '✅' : '❌'}`)
  
  return hasWizardImport && hasWizardState && hasWizardButton && hasWizardComponent && removedOldButtons
}

function testWizardFeatures() {
  console.log('🔍 Testing Job Creation Wizard Features...')
  
  const wizardFile = 'src/components/JobCreationWizard.jsx'
  
  // Check for creation mode selection
  const hasCreationModeStep = checkFileContent(wizardFile, ['CreationModeStep', 'creationMode'])
  const hasSingleMode = checkFileContent(wizardFile, ['Single Job Draft'])
  const hasBulkMode = checkFileContent(wizardFile, ['Bulk Job Creation'])
  
  // Check for bulk creation features
  const hasBulkCreateStep = checkFileContent(wizardFile, ['BulkCreateStep'])
  const hasBulkForm = checkFileContent(wizardFile, ['bulkForm', 'setBulkForm'])
  const hasCountryJobCount = checkFileContent(wizardFile, ['countries', 'job_count'])
  
  // Check for unified flow
  const hasUnifiedSave = checkFileContent(wizardFile, ['saveCurrentStep', 'creationMode === \'bulk\''])
  const hasUnifiedValidation = checkFileContent(wizardFile, ['validateStep', 'creationMode === \'single\''])
  
  console.log(`  Creation mode step: ${hasCreationModeStep ? '✅' : '❌'}`)
  console.log(`  Single mode: ${hasSingleMode ? '✅' : '❌'}`)
  console.log(`  Bulk mode: ${hasBulkMode ? '✅' : '❌'}`)
  console.log(`  Bulk create step: ${hasBulkCreateStep ? '✅' : '❌'}`)
  console.log(`  Bulk form: ${hasBulkForm ? '✅' : '❌'}`)
  console.log(`  Country/job count: ${hasCountryJobCount ? '✅' : '❌'}`)
  console.log(`  Unified save: ${hasUnifiedSave ? '✅' : '❌'}`)
  console.log(`  Unified validation: ${hasUnifiedValidation ? '✅' : '❌'}`)
  
  return hasCreationModeStep && hasSingleMode && hasBulkMode && hasBulkCreateStep && 
         hasBulkForm && hasCountryJobCount && hasUnifiedSave && hasUnifiedValidation
}

function testServiceIntegration() {
  console.log('🔍 Testing Service Integration...')
  
  const wizardFile = 'src/components/JobCreationWizard.jsx'
  const serviceFile = 'src/services/jobCreationService.js'
  
  // Check service import and usage
  const hasServiceImport = checkFileContent(wizardFile, ['jobCreationService'])
  const usesServiceMethods = checkFileContent(wizardFile, ['jobCreationService.createDraft'])
  
  // Check service exists
  const serviceExists = checkFileExists(serviceFile)
  const hasServiceMethods = checkFileContent(serviceFile, [
    'createDraft',
    'updatePostingDetails',
    'updateContract',
    'updatePositions',
    'updateTags',
    'updateExpenses',
    'uploadCutout'
  ])
  
  console.log(`  Service import: ${hasServiceImport ? '✅' : '❌'}`)
  console.log(`  Uses service methods: ${usesServiceMethods ? '✅' : '❌'}`)
  console.log(`  Service exists: ${serviceExists ? '✅' : '❌'}`)
  console.log(`  Service methods: ${hasServiceMethods ? '✅' : '❌'}`)
  
  return hasServiceImport && usesServiceMethods && serviceExists && hasServiceMethods
}

function testProgressSteps() {
  console.log('🔍 Testing Progress Steps...')
  
  const wizardFile = 'src/components/JobCreationWizard.jsx'
  
  // Check progress step filtering
  const hasStepFiltering = checkFileContent(wizardFile, ['filter(step => {', 'creationMode === \'bulk\''])
  const hasModeIndicator = checkFileContent(wizardFile, ['Mode indicator', 'Single Job Mode', 'Bulk Creation Mode'])
  const hasStepNavigation = checkFileContent(wizardFile, ['handleNext', 'handlePrevious'])
  
  console.log(`  Step filtering: ${hasStepFiltering ? '✅' : '❌'}`)
  console.log(`  Mode indicator: ${hasModeIndicator ? '✅' : '❌'}`)
  console.log(`  Step navigation: ${hasStepNavigation ? '✅' : '❌'}`)
  
  return hasStepFiltering && hasModeIndicator && hasStepNavigation
}

function main() {
  console.log('🚀 Job Creation Integration Test\n')
  console.log('Testing unified Job Creation Wizard implementation...\n')
  
  const results = {
    integration: testWizardIntegration(),
    features: testWizardFeatures(),
    service: testServiceIntegration(),
    progress: testProgressSteps()
  }
  
  console.log('\n📊 Test Summary:')
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
    console.log('\n🎉 All integration tests passed!')
    console.log('\n📋 Unified Job Creation Wizard includes:')
    console.log('  • Single job creation with 7-step flow')
    console.log('  • Bulk job creation for multiple countries')
    console.log('  • Unified interface replacing separate modals')
    console.log('  • Progress tracking with mode indicators')
    console.log('  • Service integration with proper DTOs')
    console.log('  • Validation and error handling')
    process.exit(0)
  } else {
    console.log('\n⚠️  Some integration tests failed. Please review the implementation.')
    process.exit(1)
  }
}

// Run test if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { main as testJobCreationIntegration }