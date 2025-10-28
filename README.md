# Pharmacy Management System - MVP

## Overview
A simple MVP pharmacy management system with authentication, user management, and medication inventory control. Built with Node.js, Express.js, and MongoDB.

## Features

### 🔐 Authentication System
- User registration and login
- JWT token-based authentication
- Role-based access control (Admin, Pharmacist, Staff)
- Password hashing with bcryptjs
- Token refresh mechanism

### 👥 User Management (Admin Only)
- Create, read, update, delete users
- Change user passwords
- User statistics and analytics
- Role assignment (Admin, Pharmacist, Staff)
- User status management (Active, Inactive, Suspended)

### 💊 Medication Management
- Add, edit, delete medications
- Stock quantity management
- Price and category management
- Low stock alerts
- Medication statistics
- Search and filter medications

### 📋 Prescription Processing
- Receive prescriptions from clinics
- Process and track prescription status
- Patient lookup by name
- Prescription history

## Base URL
```
http://localhost:5001/api
```

## Authentication

### Register New User
```http
POST /api/auth/register
Content-Type: application/json

{
  "fullName": "John Doe",
  "email": "john@pharmacy.com",
  "password": "password123",
  "role": "staff"
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@pharmacy.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "user": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "fullName": "John Doe",
      "email": "john@pharmacy.com",
      "role": "staff",
      "status": "active"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## User Management (Admin Only)

### Get All Users
```http
GET /api/admin/users
Authorization: Bearer <token>
```

### Create New User
```http
POST /api/admin/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullName": "Jane Pharmacist",
  "email": "jane@pharmacy.com",
  "password": "password123",
  "role": "pharmacist"
}
```

### Update User
```http
PUT /api/admin/users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullName": "Jane Smith",
  "role": "pharmacist",
  "status": "active"
}
```

### Delete User
```http
DELETE /api/admin/users/:id
Authorization: Bearer <token>
```

## Medication Management

### Get All Medications
```http
GET /api/medications
Authorization: Bearer <token>
```

### Create New Medication
```http
POST /api/medications
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Aspirin 100mg",
  "code": "ASP_100",
  "description": "Pain reliever and anti-inflammatory",
  "stockQuantity": 50,
  "unit": "box",
  "price": 12.50,
  "requiresPrescription": true,
  "category": "Analgesics",
  "supplier": "PharmaCorp"
}
```

### Update Medication Stock
```http
PUT /api/medications/:id/stock
Authorization: Bearer <token>
Content-Type: application/json

{
  "stockQuantity": 100,
  "operation": "set"
}
```

### Get Low Stock Medications
```http
GET /api/medications/low-stock?threshold=10
Authorization: Bearer <token>
```

## Prescription Management

### Create Prescription (from clinic)
```http
POST /api/prescriptions
Content-Type: application/json

{
  "patientName": "John Doe",
  "doctorName": "Dr. Smith",
  "clinicCode": "CLINIC_001",
  "medications": [
    {
      "medicationName": "Paracetamol 500mg",
      "quantity": 2,
      "dosage": "500mg"
    }
  ]
}
```

### Search Prescription by Patient Name
```http
GET /api/prescriptions/search/John Doe
```

### Update Prescription Status
```http
PUT /api/prescriptions/:id/status
Content-Type: application/json

{
  "status": "ready",
  "notes": "Prescription is ready for pickup"
}
```

## User Roles & Permissions

### Admin
- Full system access
- User management (create, update, delete users)
- All medication management features
- System statistics and analytics

### Pharmacist
- Medication management (create, update, delete medications)
- Stock management
- Prescription processing
- View medication statistics

### Staff
- View medications
- Update stock quantities
- Process prescriptions
- Basic medication management

## Environment Variables

Create a `.env` file with:

```env
# Server Configuration
PORT=5001
NODE_ENV=development

# Database
DB_URL=mongodb://localhost:27017/pharmacy_db

# JWT Configuration
JWT_SECRET=pharmacy_jwt_secret_here
JWT_REFRESH_SECRET=pharmacy_refresh_secret_here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=pharmacy@example.com
SMTP_PASS=pharmacy_password
```

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Setup sample data:**
   ```bash
   npm run setup
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **The API will be available at:**
   ```
   http://localhost:5001/api
   ```

## Sample Data

The system comes with pre-loaded sample data:

### Users:
- **Admin**: admin@pharmacy.com / admin123
- **Pharmacist**: pharmacist@pharmacy.com / pharmacist123
- **Staff**: staff@pharmacy.com / staff123

### Medications:
- Paracetamol 500mg (15.50 SAR)
- Amoxicillin 250mg (25.00 SAR)
- Ibuprofen 400mg (18.75 SAR)
- Omeprazole 20mg (35.00 SAR)
- Loratadine 10mg (22.50 SAR)

### Client:
- Healthcare Care Clinic (CLINIC_001)

## API Endpoints Summary

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Admin Management
- `GET /api/admin/users` - Get all users
- `POST /api/admin/users` - Create user
- `GET /api/admin/users/:id` - Get user by ID
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `PUT /api/admin/users/:id/password` - Change user password
- `GET /api/admin/users/stats` - User statistics

### Medication Management
- `GET /api/medications` - Get all medications
- `POST /api/medications` - Create medication
- `GET /api/medications/:id` - Get medication by ID
- `PUT /api/medications/:id` - Update medication
- `DELETE /api/medications/:id` - Delete medication
- `PUT /api/medications/:id/stock` - Update stock
- `GET /api/medications/low-stock` - Get low stock medications
- `GET /api/medications/stats` - Medication statistics

### Prescription Management
- `POST /api/prescriptions` - Create prescription
- `GET /api/prescriptions` - Get all prescriptions
- `GET /api/prescriptions/search/:patientName` - Search by patient name
- `PUT /api/prescriptions/:id/status` - Update prescription status

## Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- Role-based access control
- Input validation and sanitization
- CORS protection
- Helmet for security headers

## Error Handling

All endpoints return consistent error responses:

```json
{
  "status": "error",
  "message": "Error description"
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error