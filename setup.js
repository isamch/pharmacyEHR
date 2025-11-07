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



// import Medication from './src/models/medication.model.js';
// import connectDB from './src/config/db.js';
// import dotenv from 'dotenv';
// dotenv.config();
// connectDB();

// await Medication.create({
//   name: 'Aspirin',
//   code: 'ASPIRIN_001',
//   stockQuantity: 100,
//   price: 10
// });

// console.log('✅ Aspirin added');
// process.exit();
