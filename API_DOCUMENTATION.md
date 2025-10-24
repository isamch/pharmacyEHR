# CareFlow EHR - API Documentation

## Overview
CareFlow EHR is a comprehensive Electronic Health Record (EHR) management system built with Node.js, Express.js, and MongoDB. The system supports multiple user roles including patients, doctors, nurses, secretaries, and administrators.

## Base URL
```
http://localhost:5000/api
```

## Authentication
The API uses JWT (JSON Web Tokens) for authentication with HTTP-only cookies for security. All protected routes require a valid JWT token.

### Authentication Flow
1. **Register** - Create a new patient account
2. **Login** - Authenticate and receive JWT tokens
3. **Refresh** - Refresh expired access tokens
4. **Logout** - Invalidate tokens and clear cookies

## User Roles & Permissions

### Roles
- **Patient**: Can manage appointments and view medical records
- **Doctor**: Can manage appointments, view patient records, add medical visits
- **Nurse**: Assists doctors with patient management
- **Secretary**: Manages appointments and patient information
- **Admin**: Full system administration

### Permission System
The system uses a granular permission-based access control system where each role has specific permissions like:
- `create:appointment`
- `read:patient_record`
- `update:own_profile`
- `read:own_appointments`

## API Endpoints

### Authentication Routes (`/api/auth`)

#### Register Patient
```http
POST /api/auth/register
Content-Type: application/json

{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Registration successful. Please check your email.",
  "data": {
    "userId": "64f1a2b3c4d5e6f7g8h9i0j1"
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900000
  }
}
```

#### Refresh Token
```http
POST /api/auth/refresh
```

#### Logout
```http
POST /api/auth/logout
```

#### Verify Email
```http
GET /api/auth/verify-email/:token
```

#### Forgot Password
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}
```

#### Reset Password
```http
POST /api/auth/reset-password/:token
Content-Type: application/json

{
  "password": "newpassword123"
}
```

### Patient Routes (`/api/patient`)

**Authentication Required:** All routes require valid JWT token with Patient role.

#### Get My Appointments
```http
GET /api/patient/appointments
Authorization: Bearer <token>
```

**Response:**
```json
{
  "status": "success",
  "message": "Appointments retrieved",
  "data": {
    "appointments": [
      {
        "id": "64f1a2b3c4d5e6f7g8h9i0j1",
        "patient": "64f1a2b3c4d5e6f7g8h9i0j2",
        "doctor": "64f1a2b3c4d5e6f7g8h9i0j3",
        "startTime": "2024-01-15T10:00:00.000Z",
        "endTime": "2024-01-15T10:30:00.000Z",
        "status": "scheduled",
        "reason": "Regular checkup"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10
  }
}
```

#### Create Appointment
```http
POST /api/patient/appointments
Authorization: Bearer <token>
Content-Type: application/json

{
  "doctorId": "64f1a2b3c4d5e6f7g8h9i0j3",
  "startTime": "2024-01-15T10:00:00.000Z",
  "endTime": "2024-01-15T10:30:00.000Z",
  "reason": "Regular checkup"
}
```

#### Cancel Appointment
```http
PATCH /api/patient/appointments/:id/cancel
Authorization: Bearer <token>
```

#### Get My Medical Record
```http
GET /api/patient/record/me
Authorization: Bearer <token>
```

#### Get My Notifications
```http
GET /api/patient/notifications/me
Authorization: Bearer <token>
```

### Doctor Routes (`/api/doctor`)

**Authentication Required:** All routes require valid JWT token with Doctor role.

#### Get My Profile
```http
GET /api/doctor/profile/me
Authorization: Bearer <token>
```

#### Update My Profile
```http
PUT /api/doctor/profile/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "specialization": "Cardiology",
  "workingHours": [
    {
      "dayOfWeek": "Monday",
      "timeSlots": [
        {
          "startTime": "09:00",
          "endTime": "17:00",
          "isAvailable": true
        }
      ]
    }
  ]
}
```

#### Get My Appointments
```http
GET /api/doctor/appointments/me
Authorization: Bearer <token>
```

#### Update Appointment Status
```http
PATCH /api/doctor/appointments/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "completed"
}
```

#### Get Patient Record
```http
GET /api/doctor/patients/:patientId/record
Authorization: Bearer <token>
```

#### Add Patient Visit
```http
POST /api/doctor/patients/:patientId/visits
Authorization: Bearer <token>
Content-Type: application/json

{
  "diagnosis": ["Hypertension", "Diabetes"],
  "symptoms": ["Headache", "Fatigue"],
  "treatments": [
    {
      "name": "Metformin",
      "dosage": "500mg",
      "duration": "30 days"
    }
  ],
  "notes": "Patient responding well to treatment"
}
```

### Nurse Routes (`/api/nurse`)

**Authentication Required:** All routes require valid JWT token with Nurse role.

#### Get My Profile
```http
GET /api/nurse/profile/me
Authorization: Bearer <token>
```

#### Get My Appointments
```http
GET /api/nurse/appointments/me
Authorization: Bearer <token>
```

#### Get My Patients
```http
GET /api/nurse/patients/me
Authorization: Bearer <token>
```

### Secretary Routes (`/api/secretary`)

**Authentication Required:** All routes require valid JWT token with Secretary role.

#### Get My Profile
```http
GET /api/secretary/profile/me
Authorization: Bearer <token>
```

#### Get All Appointments
```http
GET /api/secretary/appointments
Authorization: Bearer <token>
```

#### Get All Patients
```http
GET /api/secretary/patients
Authorization: Bearer <token>
```

### Admin Routes (`/api/admin`)

**Authentication Required:** All routes require valid JWT token with Admin role.

#### Get All Users
```http
GET /api/admin/users
Authorization: Bearer <token>
```

#### Create User
```http
POST /api/admin/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullName": "Dr. Smith",
  "email": "dr.smith@example.com",
  "password": "password123",
  "roleId": "64f1a2b3c4d5e6f7g8h9i0j4"
}
```

#### Update User
```http
PUT /api/admin/users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "active"
}
```

#### Delete User
```http
DELETE /api/admin/users/:id
Authorization: Bearer <token>
```

#### Get System Logs
```http
GET /api/admin/logs
Authorization: Bearer <token>
```

#### Get Notifications
```http
GET /api/admin/notifications
Authorization: Bearer <token>
```

### Shared Routes (`/api/user`)

#### Get My Profile
```http
GET /api/user/me
Authorization: Bearer <token>
```

#### Update My Profile
```http
PUT /api/user/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullName": "John Doe Updated"
}
```

## Data Models

### User Model
```json
{
  "id": "ObjectId",
  "fullName": "String",
  "email": "String",
  "role": "ObjectId (ref: Role)",
  "status": "String (active|suspended|pending_verification)",
  "isEmailVerified": "Boolean",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Patient Model
```json
{
  "id": "ObjectId",
  "userId": "ObjectId (ref: User)",
  "patientRecord": "ObjectId (ref: PatientRecord)"
}
```

### Doctor Model
```json
{
  "id": "ObjectId",
  "userId": "ObjectId (ref: User)",
  "specialization": "String",
  "assignedNurse": "ObjectId (ref: Nurse)",
  "workingHours": [
    {
      "dayOfWeek": "String",
      "timeSlots": [
        {
          "startTime": "String",
          "endTime": "String",
          "isAvailable": "Boolean"
        }
      ]
    }
  ]
}
```

### Appointment Model
```json
{
  "id": "ObjectId",
  "patient": "ObjectId (ref: Patient)",
  "doctor": "ObjectId (ref: Doctor)",
  "nurse": "ObjectId (ref: Nurse)",
  "secretary": "ObjectId (ref: Secretary)",
  "startTime": "Date",
  "endTime": "Date",
  "status": "String (scheduled|in-progress|completed|cancelled|no-show)",
  "reason": "String",
  "notes": "String",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### PatientRecord Model
```json
{
  "id": "ObjectId",
  "bloodType": "String (A+|A-|B+|B-|AB+|AB-|O+|O-)",
  "dateOfBirth": "Date",
  "address": "String",
  "visits": [
    {
      "visitId": "ObjectId",
      "date": "Date",
      "doctorId": "ObjectId (ref: Doctor)",
      "nurseId": "ObjectId (ref: Nurse)",
      "diagnosis": ["String"],
      "symptoms": ["String"],
      "treatments": [
        {
          "name": "String",
          "dosage": "String",
          "duration": "String"
        }
      ],
      "notes": "String"
    }
  ],
  "createdAt": "Date",
  "lastUpdated": "Date"
}
```

## Error Handling

The API uses consistent error response format:

```json
{
  "status": "error",
  "message": "Error description",
  "stack": null
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

## Pagination

Many list endpoints support pagination:

```http
GET /api/endpoint?page=1&limit=10
```

**Response includes:**
```json
{
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 10
}
```

## Environment Variables

Create a `.env` file with the following variables:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DB_URL=mongodb://localhost:27017/careflow_ehr

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here

# HMAC (for OTP hashing)
HMAC_VERIFICATION_CODE_SECRET=your_hmac_secret_here

# SMTP (email)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your@email.com
SMTP_PASS=your_password
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

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **The API will be available at:**
   ```
   http://localhost:5000/api
   ```

## Security Features

- JWT-based authentication with HTTP-only cookies
- Password hashing using bcryptjs
- CORS protection
- Helmet for security headers
- Input validation using Joi
- Role-based access control
- Email verification system
- Password reset functionality

## Rate Limiting

Consider implementing rate limiting for production use to prevent abuse.

## Database Indexes

The system includes optimized database indexes for:
- User email lookups
- Appointment queries by doctor and patient
- Token lookups for authentication

## Testing

The API can be tested using tools like:
- Postman
- Insomnia
- curl
- Any HTTP client

Make sure to include the `Authorization: Bearer <token>` header for protected routes.
