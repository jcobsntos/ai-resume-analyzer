#!/usr/bin/env node

/**
 * Quick Test Runner for AI Features
 * 
 * This script provides various testing modes for the AI features.
 * 
 * Usage:
 * node scripts/quick-test.js [mode]
 * 
 * Modes:
 * - all: Run all tests (default)
 * - unit: Run only unit tests
 * - integration: Run only integration tests
 * - manual: Run manual endpoint testing
 * - health: Check AI service health
 * - performance: Run performance tests
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const mode = process.argv[2] || 'all';

// Colors for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    log(`Running: ${command} ${args.join(' ')}`, colors.blue);
    
    const process = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    process.on('error', reject);
  });
}

async function checkPrerequisites() {
  log('\n🔍 Checking prerequisites...', colors.cyan);
  
  // Check if backend is running
  try {
    const http = require('http');
    await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: 5000,
        path: '/health',
        method: 'GET',
        timeout: 5000
      }, (res) => {
        if (res.statusCode === 200) {
          log('✅ Backend server is running', colors.green);
          resolve();
        } else {
          reject(new Error(`Backend server returned ${res.statusCode}`));
        }
      });
      
      req.on('error', reject);
      req.on('timeout', () => reject(new Error('Backend server timeout')));
      req.end();
    });
  } catch (error) {
    log('❌ Backend server is not running. Please start it first:', colors.red);
    log('   cd backend && npm run dev', colors.yellow);
    throw error;
  }

  // Check if test dependencies are installed
  const packageJson = path.join(__dirname, '../package.json');
  if (!fs.existsSync(packageJson)) {
    throw new Error('package.json not found');
  }

  const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
  if (!pkg.devDependencies.jest) {
    log('⚠️  Jest not found in devDependencies. Installing...', colors.yellow);
    await runCommand('npm', ['install', '--save-dev', 'jest', 'supertest']);
  }

  log('✅ Prerequisites check passed', colors.green);
}

async function runUnitTests() {
  log('\n🧪 Running unit tests...', colors.cyan);
  await runCommand('npm', ['test', '--', '--testPathPattern=test', '--verbose']);
}

async function runIntegrationTests() {
  log('\n🔗 Running integration tests...', colors.cyan);
  await runCommand('npm', ['test', '--', '--testPathPattern=integration', '--verbose']);
}

async function runManualTests() {
  log('\n🚀 Running manual endpoint tests...', colors.cyan);
  const testScript = path.join(__dirname, 'test-ai-endpoints.js');
  await runCommand('node', [testScript]);
}

async function checkAIServiceHealth() {
  log('\n🏥 Checking AI service health...', colors.cyan);
  
  const axios = require('axios');
  
  // Check Hugging Face API
  const hfKey = process.env.HUGGING_FACE_API_KEY;
  if (!hfKey) {
    log('⚠️  HUGGING_FACE_API_KEY not set. Fallback methods will be used.', colors.yellow);
  } else {
    try {
      const response = await axios.post(
        'https://api-inference.huggingface.co/models/microsoft/DialoGPT-small',
        { inputs: 'Health check' },
        {
          headers: {
            'Authorization': `Bearer ${hfKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      log('✅ Hugging Face API is accessible', colors.green);
    } catch (error) {
      log(`⚠️  Hugging Face API issue: ${error.message}`, colors.yellow);
    }
  }

  // Test local AI service endpoints
  try {
    const response = await axios.get('http://localhost:5000/health');
    log('✅ Local backend is healthy', colors.green);
  } catch (error) {
    log(`❌ Local backend health check failed: ${error.message}`, colors.red);
  }
}

async function runPerformanceTests() {
  log('\n⚡ Running performance tests...', colors.cyan);
  
  const axios = require('axios');
  
  // Login first to get token
  try {
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    // Test response times for different endpoints
    const endpoints = [
      { name: 'Resume Improvements', method: 'post', url: '/ai/resume-improvements', data: { targetRole: 'Developer' } },
      { name: 'Career Guidance', method: 'get', url: '/ai/career-guidance' },
      { name: 'Hiring Insights', method: 'get', url: '/ai/hiring-insights?timeRange=30' },
      { name: 'Advanced Skills', method: 'get', url: '/ai/advanced-skills' }
    ];

    for (const endpoint of endpoints) {
      const startTime = Date.now();
      
      try {
        const response = await axios({
          method: endpoint.method,
          url: `http://localhost:5000/api${endpoint.url}`,
          headers,
          data: endpoint.data,
          timeout: 30000
        });
        
        const responseTime = Date.now() - startTime;
        const status = response.status === 200 ? '✅' : '❌';
        
        log(`${status} ${endpoint.name}: ${responseTime}ms`, 
            responseTime < 5000 ? colors.green : responseTime < 15000 ? colors.yellow : colors.red);
      } catch (error) {
        log(`❌ ${endpoint.name}: FAILED (${error.message})`, colors.red);
      }
    }
  } catch (error) {
    log(`❌ Performance tests failed: ${error.message}`, colors.red);
  }
}

async function main() {
  log(`${colors.bright}🤖 AI Features Test Runner${colors.reset}`, colors.cyan);
  log(`Mode: ${mode}`, colors.blue);

  try {
    await checkPrerequisites();

    switch (mode) {
      case 'unit':
        await runUnitTests();
        break;
      
      case 'integration':
        await runIntegrationTests();
        break;
      
      case 'manual':
        await runManualTests();
        break;
      
      case 'health':
        await checkAIServiceHealth();
        break;
      
      case 'performance':
        await runPerformanceTests();
        break;
      
      case 'all':
      default:
        await runUnitTests();
        await runIntegrationTests();
        await runManualTests();
        await checkAIServiceHealth();
        break;
    }

    log(`\n🎉 Testing completed successfully!`, colors.green);
  } catch (error) {
    log(`\n❌ Testing failed: ${error.message}`, colors.red);
    process.exit(1);
  }
}

// Handle command line help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
AI Features Test Runner

Usage: node scripts/quick-test.js [mode]

Modes:
  all         Run all tests (default)
  unit        Run only unit tests  
  integration Run only integration tests
  manual      Run manual endpoint testing
  health      Check AI service health
  performance Run performance tests

Examples:
  node scripts/quick-test.js
  node scripts/quick-test.js unit
  node scripts/quick-test.js health
  `);
  process.exit(0);
}

if (require.main === module) {
  main();
}
