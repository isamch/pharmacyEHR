#!/usr/bin/env node

// Simple file to run the pharmacy system setup
import { seedDatabase } from './src/scripts/seedData.js';

console.log('🚀 Starting pharmacy system setup...');
console.log('📋 Adding sample data...');

try {
  await seedDatabase();
  console.log('✅ System setup completed successfully!');
} catch (error) {
  console.error('❌ Error setting up system:', error.message);
  process.exit(1);
}
