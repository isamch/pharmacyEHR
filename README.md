# CareFlow EHR - Electronic Health Record Management System

A comprehensive Electronic Health Record (EHR) management system built with Node.js, Express.js, and MongoDB. This system provides a complete solution for managing medical records, appointments, and patient care across multiple healthcare roles including patients, doctors, nurses, secretaries, and administrators.

## Features

### Core Healthcare Management
- **Multi-role User System**: Support for Patients, Doctors, Nurses, Secretaries, and Administrators
- **Appointment Management**: Complete appointment scheduling, modification, and cancellation system
- **Electronic Medical Records**: Comprehensive patient record management with visit history
- **Role-based Access Control**: Granular permissions system for different user types
- **Real-time Notifications**: System-wide notification management

### Technical Features
- **JWT Authentication**: Secure authentication with HTTP-only cookies and refresh tokens
- **Email Verification**: OTP-based email verification system using Nodemailer
- **Input Validation**: Comprehensive validation using Joi schemas
- **Error Handling**: Centralized error handling with consistent API responses
- **Security**: Helmet, CORS, and other security middleware
- **Database**: MongoDB with Mongoose ODM
- **Pagination**: Built-in pagination utilities for large datasets
- **Logging**: Comprehensive system logging and audit trails

### Healthcare-Specific Features
- **Patient Records**: Blood type, medical history, visit tracking
- **Doctor Profiles**: Specialization, working hours, assigned nurses
- **Appointment Scheduling**: Time slot management with availability checking
- **Medical Visits**: Diagnosis tracking, treatment management, notes
- **Notification System**: Patient and staff notifications

## Quick Start

```bash
# 1) Clone the repository
git clone <repository-url>
cd careflow-ehr

# 2) Install dependencies
npm install

# 3) Configure environment variables
cp .env.example .env
# Edit .env with your configuration

# 4) Start MongoDB (if not running)
# Make sure MongoDB is running on your system

# 5) Run development server
npm run dev
```

The API will be available at `http://localhost:5000/api`

## Scripts

- `npm run dev`: Run with Nodemon on `server.js`
- `npm start`: Run with Node

## Environment Variables

Create a `.env` file in the project root with:

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

## Project Structure

```
server.js                # Entry point; loads app and starts HTTP server
app.js                   # Express app configuration and middleware
src/
  config/
    db.js                # MongoDB connection configuration
  controllers/
    auth/                # Authentication controllers
      authController.js  # register/login/logout, email verification
    admin/               # Admin-specific controllers
      userController.js  # User management
      logController.js   # System logs
      NotificationController.js # Admin notifications
    doctor/              # Doctor-specific controllers
      appointmentController.js # Doctor appointment management
      patientController.js    # Patient management
      profileController.js    # Doctor profile management
      availabilityController.js # Working hours management
    nurse/               # Nurse-specific controllers
      appointmentController.js # Nurse appointment management
      patientController.js    # Patient management
      profileController.js    # Nurse profile management
    patient/             # Patient-specific controllers
      appointmentController.js # Patient appointment management
      recordController.js     # Medical record access
    secretary/           # Secretary-specific controllers
      appointmentController.js # Secretary appointment management
      patientController.js    # Patient management
      profileController.js    # Secretary profile management
    shared/              # Shared controllers
      NotificationController.js # Shared notification system
      patientRecord.js   # Shared patient record management
      userController.js  # Shared user operations
  middleware/
    authMiddleware.js    # JWT authentication and authorization
    errorHandler.js      # Centralized error handling
    validatorMiddleware.js # Joi schema validation
    uploadMiddleware.js  # File upload handling
  models/
    User.js              # User model with role-based access
    Patient.js           # Patient profile model
    Doctor.js            # Doctor profile model
    Nurse.js             # Nurse profile model
    Secretary.js         # Secretary profile model
    Appointment.js       # Appointment scheduling model
    PatientRecord.js     # Medical records model
    Role.js              # Role and permissions model
    Notification.js      # Notification system model
    Log.js               # System logging model
    Token.js             # JWT token management
  routes/
    api/                 # API route definitions
      auth.routes.js     # Authentication endpoints
      admin.routes.js    # Admin management endpoints
      doctor.routes.js   # Doctor-specific endpoints
      nurse.routes.js    # Nurse-specific endpoints
      patient.routes.js  # Patient-specific endpoints
      secretary.routes.js # Secretary-specific endpoints
      user.routes.js     # Shared user endpoints
      home.routes.js     # Public home endpoints
    api.js               # Main API router
    router.js            # Root router configuration
  validations/           # Joi validation schemas
    authValidation.js    # Authentication validation
    appointmentValidation.js # Appointment validation
    userValidation.js    # User validation
    # ... other validation files
  utils/                 # Utility functions
    apiResponse.js       # Standardized API responses
    apiError.js          # Custom error classes
    asyncHandler.js      # Async error handling wrapper
    Cookies.js           # Cookie management
    email.js             # Email sending utilities
    generateTokens.js    # Token generation utilities
    hashing.js           # Password hashing utilities
    jwt.js               # JWT token utilities
    pagination.js        # Pagination helper functions
    viewHelpers.js       # EJS template helpers
  templates/
    emailTemplates.js    # Email template system
  factories/             # Data factories for testing
    userFactory.js       # User data factory
    run.js               # Factory runner
  console/               # CLI tools and generators
    index.js             # Console command interface
    templates/           # Code generation templates
```

## API Overview

Base URL: `/api`

### Authentication Endpoints (`/api/auth`)
- `POST /api/auth/register` - Register new patient
- `POST /api/auth/login` - User login with JWT tokens
- `POST /api/auth/logout` - User logout and token invalidation
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/verify-email/:token` - Verify email address
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password/:token` - Reset password

### Patient Endpoints (`/api/patient`)
- `GET /api/patient/appointments` - Get patient's appointments
- `POST /api/patient/appointments` - Create new appointment
- `PATCH /api/patient/appointments/:id/cancel` - Cancel appointment
- `GET /api/patient/record/me` - Get own medical record
- `GET /api/patient/notifications/me` - Get notifications

### Doctor Endpoints (`/api/doctor`)
- `GET /api/doctor/profile/me` - Get doctor profile
- `PUT /api/doctor/profile/me` - Update doctor profile
- `GET /api/doctor/appointments/me` - Get doctor's appointments
- `PATCH /api/doctor/appointments/:id/status` - Update appointment status
- `GET /api/doctor/patients/:patientId/record` - Get patient record
- `POST /api/doctor/patients/:patientId/visits` - Add medical visit

### Nurse Endpoints (`/api/nurse`)
- `GET /api/nurse/profile/me` - Get nurse profile
- `GET /api/nurse/appointments/me` - Get nurse's appointments
- `GET /api/nurse/patients/me` - Get assigned patients

### Secretary Endpoints (`/api/secretary`)
- `GET /api/secretary/profile/me` - Get secretary profile
- `GET /api/secretary/appointments` - Get all appointments
- `GET /api/secretary/patients` - Get all patients

### Admin Endpoints (`/api/admin`)
- `GET /api/admin/users` - Get all users
- `POST /api/admin/users` - Create new user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/logs` - Get system logs
- `GET /api/admin/notifications` - Get all notifications

### Shared Endpoints (`/api/user`)
- `GET /api/user/me` - Get current user profile
- `PUT /api/user/me` - Update current user profile

## User Roles and Permissions

### Role-Based Access Control
The system implements a comprehensive role-based access control (RBAC) system:

#### Patient Role
- Create and manage own appointments
- View own medical records
- Receive notifications
- Cancel appointments

#### Doctor Role
- Manage own appointments
- View and update patient medical records
- Add medical visits and diagnoses
- Update appointment statuses
- Manage working hours and availability

#### Nurse Role
- View assigned appointments
- Assist with patient management
- Update patient information
- View patient records

#### Secretary Role
- Manage all appointments
- View all patients
- Schedule appointments for patients
- Handle administrative tasks

#### Admin Role
- Full system access
- User management
- System configuration
- View system logs
- Manage roles and permissions

### Permission System
Each role has specific permissions that control access to different features:
- `create:appointment` - Create appointments
- `read:patient_record` - Read patient records
- `update:own_profile` - Update own profile
- `read:own_appointments` - Read own appointments
- `create:visit` - Add medical visits
- `update:appointment` - Update appointment status

## Authentication Flow

### JWT Token System
- **Access Tokens**: Short-lived (15 minutes) for API access
- **Refresh Tokens**: Long-lived (7 days) for token renewal
- **HTTP-only Cookies**: Secure token storage
- **Role-based Payload**: User ID, role, profile ID, and permissions

### Login Process
1. User provides email and password
2. System validates credentials using bcryptjs
3. JWT tokens generated with user data and permissions
4. Tokens stored in HTTP-only cookies
5. Refresh token saved to database

### Protected Routes
- `authMiddleware` extracts and verifies JWT tokens
- User data attached to `req.user` object
- Permission-based authorization for specific actions

## Data Models

### Core Models
- **User**: Base user information with role assignment
- **Patient**: Patient-specific data linked to medical records
- **Doctor**: Doctor profiles with specialization and working hours
- **Nurse**: Nurse profiles with assigned doctors
- **Secretary**: Administrative staff profiles
- **Appointment**: Medical appointment scheduling
- **PatientRecord**: Comprehensive medical history
- **Role**: User roles and permission definitions

### Key Features
- **MongoDB Integration**: Mongoose ODM for database operations
- **Data Validation**: Joi schemas for input validation
- **Timestamps**: Automatic creation and update tracking
- **References**: Proper relationships between models
- **Indexing**: Optimized database queries

## Security Features

### Authentication Security
- JWT with secure signing
- HTTP-only cookies prevent XSS attacks
- Refresh token rotation
- Password hashing with bcryptjs

### Authorization Security
- Role-based access control (RBAC)
- Permission-based authorization
- Route-level protection
- Profile-specific data access

### General Security
- Helmet.js for security headers
- CORS configuration
- Input validation and sanitization
- Error handling without information leakage

## API Documentation

For detailed API documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## Development

### Prerequisites
- Node.js 18+
- MongoDB 4.4+
- npm or yarn

### Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Configure environment variables
4. Start MongoDB
5. Run development server: `npm run dev`

### Testing
- Use Postman or similar tools for API testing
- Include `Authorization: Bearer <token>` header for protected routes
- Test different user roles and permissions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License - see the LICENSE file for details.

## Support

For support and questions, please contact the development team or create an issue in the repository. 