#!/usr/bin/env node

// Simple file to run the system
import { seedDatabase } from './src/scripts/seedData.js';

console.log('🚀 Starting pharmacy system...');
console.log('📋 Adding sample data...');

try {
  await seedDatabase();
  console.log('✅ System setup completed successfully!');
  console.log('');
  console.log('📝 Added data:');
  console.log('- 5 different medications');
  console.log('- 1 client (Healthcare Care Clinic)');
  console.log('- Clinic code: CLINIC_001');
  console.log('');
  console.log('🔗 You can now start the server:');
  console.log('npm run dev');
  console.log('');
  console.log('🌐 Pharmacy will be available at: http://localhost:5001');
} catch (error) {
  console.error('❌ Error setting up system:', error.message);
  process.exit(1);
}
