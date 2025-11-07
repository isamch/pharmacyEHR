// File to add sample data for pharmacy with admin user
import mongoose from 'mongoose';
import Medication from './../models/medication.model.js';
import Client from './../models/client.model.js';
import PharmacyUser from './../models//user.model.js';

// Sample medications data
const sampleMedications = [
  {
    name: "Paracetamol 500mg",
    code: "PARA_500",
    description: "Pain reliever and fever reducer",
    stockQuantity: 100,
    unit: "box",
    price: 15.50,
    requiresPrescription: true,
    category: "Analgesics"
  },
  {
    name: "Amoxicillin 250mg",
    code: "AMOX_250",
    description: "Broad spectrum antibiotic",
    stockQuantity: 50,
    unit: "box",
    price: 25.00,
    requiresPrescription: true,
    category: "Antibiotics"
  },
  {
    name: "Ibuprofen 400mg",
    code: "IBU_400",
    description: "Anti-inflammatory and pain reliever",
    stockQuantity: 75,
    unit: "box",
    price: 18.75,
    requiresPrescription: true,
    category: "Anti-inflammatory"
  },
  {
    name: "Omeprazole 20mg",
    code: "OME_20",
    description: "Proton pump inhibitor for stomach ulcers",
    stockQuantity: 60,
    unit: "box",
    price: 35.00,
    requiresPrescription: true,
    category: "Gastrointestinal"
  },
  {
    name: "Loratadine 10mg",
    code: "LOR_10",
    description: "Antihistamine for allergy treatment",
    stockQuantity: 40,
    unit: "box",
    price: 22.50,
    requiresPrescription: true,
    category: "Allergy"
  }
];

// Sample client data
const sampleClient = {
  name: "Healthcare Care Clinic",
  clinicCode: "CLINIC_001",
  contactPerson: "Dr. Ahmed Mohammed",
  phone: "0123456789",
  address: "King Fahd Street, Riyadh, Saudi Arabia",
  status: "active"
};

// Sample admin user
const sampleAdmin = {
  fullName: "Pharmacy Admin",
  email: "admin@pharmacy.com",
  password: "admin123",
  role: "admin",
  status: "active",
  isEmailVerified: true
};

// Sample pharmacist user
const samplePharmacist = {
  fullName: "Dr. Sarah Pharmacist",
  email: "pharmacist@pharmacy.com",
  password: "pharmacist123",
  role: "pharmacist",
  status: "active",
  isEmailVerified: true
};

// Sample staff user
const sampleStaff = {
  fullName: "Ahmed Staff",
  email: "staff@pharmacy.com",
  password: "staff123",
  role: "staff",
  status: "active",
  isEmailVerified: true
};

// Function to add sample data
export async function seedDatabase() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://isam:isam2003@localhost:27017/pharmacy_db?authSource=admin');
    console.log('Connected to database');

    // Clear existing data
    await Medication.deleteMany({});
    await Client.deleteMany({});
    await PharmacyUser.deleteMany({});
    console.log('Cleared existing data');

    // Add medications
    const medications = await Medication.insertMany(sampleMedications);
    console.log(`Added ${medications.length} medications`);

    // Add client
    const client = await Client.create(sampleClient);
    console.log(`Added client: ${client.name}`);

    // Add users
    const admin = await PharmacyUser.create(sampleAdmin);
    console.log(`Added admin user: ${admin.fullName}`);

    const pharmacist = await PharmacyUser.create(samplePharmacist);
    console.log(`Added pharmacist user: ${pharmacist.fullName}`);

    const staff = await PharmacyUser.create(sampleStaff);
    console.log(`Added staff user: ${staff.fullName}`);

    console.log('Sample data added successfully');
    console.log('');
    console.log('📝 Login credentials:');
    console.log('Admin: admin@pharmacy.com / admin123');
    console.log('Pharmacist: pharmacist@pharmacy.com / pharmacist123');
    console.log('Staff: staff@pharmacy.com / staff123');
    console.log('');
    console.log('🔗 You can now start the server:');
    console.log('npm run dev');
    console.log('');
    console.log('🌐 Pharmacy will be available at: http://localhost:5001');

  } catch (error) {
    console.error('Error adding sample data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

// Run function if file is called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase();
}