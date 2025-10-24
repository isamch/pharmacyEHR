import Joi from 'joi'
const objectId = Joi.string().hex().length(24)

// --- Profile Schemas for Different Roles ---
const timeSlotSchema = Joi.object({
  startTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required(), // "HH:MM"
  endTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required(),
  isAvailable: Joi.boolean().default(true)
})

// Schema for working hours per day
const workingHourSchema = Joi.object({
  dayOfWeek: Joi.string()
    .valid('Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')
    .required(),
  timeSlots: Joi.array().items(timeSlotSchema).min(1).required()
})



const doctorProfileSchema = Joi.object({
  specialization: Joi.string().required(),
  assignedNurse: objectId.optional(),
  workingHours: Joi.array().items(workingHourSchema).optional()
})

const nurseProfileSchema = Joi.object({
  assignedDoctor: objectId.optional(),
  shift: Joi.string().valid('day', 'night', 'rotating').optional(),
})

const secretaryProfileSchema = Joi.object({
  managingDoctors: Joi.array().items(objectId).optional()
})


// --- Validation for Admin Routes ---
export const createUser = {
  body: Joi.object().keys({
    fullName: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).optional(),
    roleName: Joi.string().valid('Doctor', 'Nurse', 'Secretary', 'Patient', 'Admin').required(),
    profileData: Joi.when('roleName', {
      switch: [
        { is: 'Doctor', then: doctorProfileSchema.required() },
        { is: 'Nurse', then: nurseProfileSchema.required() },
        { is: 'Secretary', then: secretaryProfileSchema.required() }
      ],
      otherwise: Joi.forbidden()
    })
  })
}

export const getUsers = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1),
    perPage: Joi.number().integer().min(1).max(100),
    roleName: Joi.string().valid('Doctor', 'Nurse', 'Secretary', 'Patient', 'Admin')
  })
}

export const getUserById = {
  params: Joi.object().keys({
    id: objectId.required() // User ID
  })
}

export const updateUser = {
  params: Joi.object().keys({
    id: objectId.required() // User ID
  }),
  body: Joi.object().keys({
    fullName: Joi.string(),
    email: Joi.string().email(),
    status: Joi.string().valid('active', 'suspended', 'pending_verification'),
    // Role update requires careful consideration, often better done via a separate process
    roleName: Joi.string().valid('Doctor', 'Nurse', 'Secretary', 'Patient', 'Admin')
  }).min(1) // Require at least one field to update
}

export const updateUserProfile = {
  params: Joi.object().keys({
    id: objectId.required() // User ID
  }),
  body: Joi.alternatives().try(
    doctorProfileSchema,
    nurseProfileSchema,
    secretaryProfileSchema
  ).required() // Body must match one of the profile types
}

