#!/usr/bin/env node

/**
 * Deployment Test Script
 * Verifies that the project is ready for Netlify deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Checking deployment readiness...\n');

// Check required files
const requiredFiles = [
  'package.json',
  'netlify.toml',
  '_redirects',
  '.nvmrc',
  'src/App.jsx',
  'src/components/Login.jsx'
];

let allFilesExist = true;

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
    allFilesExist = false;
  }
});

// Check package.json build script
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  if (packageJson.scripts && packageJson.scripts.build) {
    console.log('✅ Build script found in package.json');
  } else {
    console.log('❌ Build script missing in package.json');
    allFilesExist = false;
  }
} catch (error) {
  console.log('❌ Error reading package.json');
  allFilesExist = false;
}

// Check Login component for paste prevention
try {
  const loginContent = fs.readFileSync('src/components/Login.jsx', 'utf8');
  if (loginContent.includes('onPaste={handlePaste}')) {
    console.log('✅ Paste prevention implemented in Login component');
  } else {
    console.log('❌ Paste prevention missing in Login component');
  }
} catch (error) {
  console.log('❌ Error reading Login component');
}

console.log('\n📋 Deployment Checklist:');
console.log('1. Push code to Git repository');
console.log('2. Connect repository to Netlify');
console.log('3. Netlify will auto-deploy on every push');
console.log('4. Test paste prevention on login page');

if (allFilesExist) {
  console.log('\n🎉 Project is ready for deployment!');
  process.exit(0);
} else {
  console.log('\n⚠️  Please fix missing files before deployment');
  process.exit(1);
}