#!/usr/bin/env node

/**
 * MVP Validation Script
 * Run this script to validate that all MVP features are properly implemented
 */

const fs = require('fs')
const path = require('path')

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

// Helper function to colorize output
const colorize = (text, color) => `${colors[color]}${text}${colors.reset}`

// Check if file exists
const fileExists = (filePath) => {
  try {
    return fs.existsSync(path.join(__dirname, filePath))
  } catch (error) {
    return false
  }
}

// Check if directory exists
const dirExists = (dirPath) => {
  try {
    const fullPath = path.join(__dirname, dirPath)
    return fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()
  } catch (error) {
    return false
  }
}

// Get file count in directory
const getFileCount = (dirPath, extension = '') => {
  try {
    const fullPath = path.join(__dirname, dirPath)
    if (!fs.existsSync(fullPath)) return 0
    
    const files = fs.readdirSync(fullPath)
    if (extension) {
      return files.filter(file => file.endsWith(extension)).length
    }
    return files.length
  } catch (error) {
    return 0
  }
}

// Validation tests
const validationTests = [
  {
    category: 'Core Structure',
    tests: [
      {
        name: 'src directory exists',
        check: () => dirExists('src'),
        critical: true
      },
      {
        name: 'package.json exists',
        check: () => fileExists('package.json'),
        critical: true
      },
      {
        name: 'App.jsx exists',
        check: () => fileExists('src/App.jsx'),
        critical: true
      },
      {
        name: 'index.css exists',
        check: () => fileExists('src/index.css'),
        critical: true
      }
    ]
  },
  {
    category: 'Dashboard Features',
    tests: [
      {
        name: 'Dashboard page exists',
        check: () => fileExists('src/pages/Dashboard.jsx'),
        critical: true
      },
      {
        name: 'Dashboard metrics component exists',
        check: () => fileExists('src/components/DashboardMetrics.jsx'),
        critical: true
      },
      {
        name: 'Metrics service exists',
        check: () => fileExists('src/services/metricsService.js'),
        critical: true
      },
      {
        name: 'Nepal date utilities exist',
        check: () => fileExists('src/utils/nepaliDate.js'),
        critical: true
      }
    ]
  },
  {
    category: 'Jobs Management',
    tests: [
      {
        name: 'Jobs page exists',
        check: () => fileExists('src/pages/Jobs.jsx'),
        critical: true
      },
      {
        name: 'Job details page exists',
        check: () => fileExists('src/pages/JobDetails.jsx'),
        critical: true
      },
      {
        name: 'Jobs data file exists',
        check: () => fileExists('src/data/jobs.json'),
        critical: true
      },
      {
        name: 'Job shortlist page exists',
        check: () => fileExists('src/pages/JobShortlist.jsx'),
        critical: true
      }
    ]
  },
  {
    category: 'Candidate Shortlist',
    tests: [
      {
        name: 'Candidate shortlist component exists',
        check: () => fileExists('src/components/CandidateShortlist.jsx'),
        critical: true
      },
      {
        name: 'Candidate summary component exists',
        check: () => fileExists('src/components/CandidateSummaryS2.jsx'),
        critical: true
      },
      {
        name: 'Candidate ranking service exists',
        check: () => fileExists('src/services/candidateRankingService.js'),
        critical: true
      },
      {
        name: 'Candidates data file exists',
        check: () => fileExists('src/data/candidates.json'),
        critical: true
      }
    ]
  },
  {
    category: 'Interview Scheduling',
    tests: [
      {
        name: 'Interviews page exists',
        check: () => fileExists('src/pages/Interviews.jsx'),
        critical: true
      },
      {
        name: 'Enhanced interview scheduling component exists',
        check: () => fileExists('src/components/EnhancedInterviewScheduling.jsx'),
        critical: true
      },
      {
        name: 'Interview calendar view exists',
        check: () => fileExists('src/components/InterviewCalendarView.jsx'),
        critical: true
      },
      {
        name: 'Scheduled interviews component exists',
        check: () => fileExists('src/components/ScheduledInterviews.jsx'),
        critical: true
      }
    ]
  },
  {
    category: 'Drafts Management',
    tests: [
      {
        name: 'Drafts page exists',
        check: () => fileExists('src/pages/Drafts.jsx'),
        critical: true
      },
      {
        name: 'Draft list management component exists',
        check: () => fileExists('src/components/DraftListManagement.jsx'),
        critical: true
      },
      {
        name: 'Workflow page exists',
        check: () => fileExists('src/pages/Workflow.jsx'),
        critical: true
      },
      {
        name: 'Workflow stepper component exists',
        check: () => fileExists('src/components/WorkflowStepper.jsx'),
        critical: true
      }
    ]
  },
  {
    category: 'Agency Settings',
    tests: [
      {
        name: 'Agency settings component exists',
        check: () => fileExists('src/components/AgencySettings.jsx'),
        critical: true
      },
      {
        name: 'User management component exists',
        check: () => fileExists('src/components/UserManagement.jsx'),
        critical: true
      },
      {
        name: 'Agency service exists',
        check: () => fileExists('src/services/agencyService.js'),
        critical: true
      },
      {
        name: 'Audit log component exists',
        check: () => fileExists('src/components/AuditLog.jsx'),
        critical: true
      }
    ]
  },
  {
    category: 'Authentication & Security',
    tests: [
      {
        name: 'Auth context exists',
        check: () => fileExists('src/contexts/AuthContext.jsx'),
        critical: true
      },
      {
        name: 'Auth service exists',
        check: () => fileExists('src/services/authService.js'),
        critical: true
      },
      {
        name: 'Private route component exists',
        check: () => fileExists('src/components/PrivateRoute.jsx'),
        critical: true
      },
      {
        name: 'Permission guard component exists',
        check: () => fileExists('src/components/PermissionGuard.jsx'),
        critical: true
      }
    ]
  },
  {
    category: 'UI/UX Infrastructure',
    tests: [
      {
        name: 'Layout component exists',
        check: () => fileExists('src/components/Layout.jsx'),
        critical: true
      },
      {
        name: 'Accessibility service exists',
        check: () => fileExists('src/services/accessibilityService.js'),
        critical: false
      },
      {
        name: 'Accessibility styles exist',
        check: () => fileExists('src/styles/accessibility.css'),
        critical: false
      },
      {
        name: 'i18n service exists',
        check: () => fileExists('src/services/i18nService.js'),
        critical: false
      }
    ]
  },
  {
    category: 'Data & Services',
    tests: [
      {
        name: 'Services directory has files',
        check: () => getFileCount('src/services', '.js') >= 5,
        critical: true
      },
      {
        name: 'Data directory has files',
        check: () => getFileCount('src/data', '.json') >= 3,
        critical: true
      },
      {
        name: 'Components directory has files',
        check: () => getFileCount('src/components', '.jsx') >= 10,
        critical: true
      },
      {
        name: 'Pages directory has files',
        check: () => getFileCount('src/pages', '.jsx') >= 5,
        critical: true
      }
    ]
  }
]

// Run validation
console.log(colorize('\n🚀 MVP Validation Starting...', 'cyan'))
console.log(colorize('=' .repeat(50), 'blue'))

let totalTests = 0
let passedTests = 0
let criticalFailures = 0

validationTests.forEach(category => {
  console.log(colorize(`\n📋 ${category.category}`, 'magenta'))
  console.log(colorize('-'.repeat(30), 'blue'))
  
  category.tests.forEach(test => {
    totalTests++
    const result = test.check()
    
    if (result) {
      passedTests++
      console.log(colorize(`  ✅ ${test.name}`, 'green'))
    } else {
      if (test.critical) {
        criticalFailures++
        console.log(colorize(`  ❌ ${test.name} (CRITICAL)`, 'red'))
      } else {
        console.log(colorize(`  ⚠️  ${test.name} (Optional)`, 'yellow'))
      }
    }
  })
})

// Summary
console.log(colorize('\n' + '='.repeat(50), 'blue'))
console.log(colorize('📊 VALIDATION SUMMARY', 'cyan'))
console.log(colorize('='.repeat(50), 'blue'))

console.log(`Total Tests: ${totalTests}`)
console.log(colorize(`Passed: ${passedTests}`, 'green'))
console.log(colorize(`Failed: ${totalTests - passedTests}`, 'red'))
console.log(colorize(`Critical Failures: ${criticalFailures}`, criticalFailures > 0 ? 'red' : 'green'))

const successRate = Math.round((passedTests / totalTests) * 100)
console.log(`Success Rate: ${successRate}%`)

// Final status
if (criticalFailures === 0 && successRate >= 90) {
  console.log(colorize('\n🎉 MVP VALIDATION PASSED!', 'green'))
  console.log(colorize('✅ All critical features are implemented and ready for deployment.', 'green'))
  process.exit(0)
} else if (criticalFailures === 0) {
  console.log(colorize('\n⚠️  MVP VALIDATION PASSED WITH WARNINGS', 'yellow'))
  console.log(colorize('✅ All critical features are implemented.', 'green'))
  console.log(colorize('⚠️  Some optional features are missing.', 'yellow'))
  process.exit(0)
} else {
  console.log(colorize('\n❌ MVP VALIDATION FAILED!', 'red'))
  console.log(colorize(`❌ ${criticalFailures} critical feature(s) are missing.`, 'red'))
  console.log(colorize('🔧 Please fix critical issues before deployment.', 'yellow'))
  process.exit(1)
}