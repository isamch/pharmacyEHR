import Doctor from '../../models/Doctor.js'
// import User from '../../models/User.js'
import Appointment from '../../models/Appointment.js'
import { successResponse } from '../../utils/apiResponse.js'
import * as ApiError from '../../utils/ApiError.js'
import asyncHandler from '../../utils/asyncHandler.js'
import dayjs from 'dayjs'


// @desc    Get list of doctors (for visitors)
export const getAllDoctors = asyncHandler(async (req, res) => {
  const doctors = await Doctor.find().populate({
    path: 'userId',
    select: 'fullName' // Get the name from the User model
  })
  
  const publicDoctors = doctors.map(doc => ({
    id: doc.id,
    fullName: doc.userId.fullName,
    specialization: doc.specialization
  }))
  
  return successResponse(res, 200, 'Doctors list retrieved', publicDoctors)
})



// @desc    Get available appointments for a doctor (for visitors)
export const getDoctorAvailability = asyncHandler(async (req, res, next) => {
  const { doctorId } = req.params
  const { date } = req.query
  if (!date) return next(ApiError.badRequest('Date is required'))

  const doctor = await Doctor.findById(doctorId)
  if (!doctor) return next(ApiError.notFound('Doctor not found'))
  
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const dayOfWeek = days[dayjs(date).day()]
  const schedule = doctor.workingHours.find(h => h.dayOfWeek === dayOfWeek)

  if (!schedule || !schedule.timeSlots || schedule.timeSlots.length === 0) {
    return successResponse(res, 200, 'Doctor is not available on this day', { date, availableSlots: [] })
  }

  const dayStart = dayjs(date).startOf('day')
  const dayEnd = dayjs(date).endOf('day')

  const existingAppointments = await Appointment.find({
    doctor: doctorId,
    status: { $ne: 'cancelled' },
    startTime: { $gte: dayStart.toDate(), $lt: dayEnd.toDate() }
  }, { startTime: 1, endTime: 1 })

  const bookedSlots = existingAppointments.map(appt => ({
    start: dayjs(appt.startTime),
    end: dayjs(appt.endTime)
  }))

  const availableSlots = []
  schedule.timeSlots.forEach(slot => {
    if (!slot.isAvailable) return

    const slotStart = dayjs(`${date}T${slot.startTime}`)
    const slotEnd = dayjs(`${date}T${slot.endTime}`)

    const isBooked = bookedSlots.some(b => 
      slotStart.isBefore(b.end) && slotEnd.isAfter(b.start)
    )

    if (!isBooked) {
      availableSlots.push({
        start: slotStart.toISOString(),
        end: slotEnd.toISOString()
      })
    }
  })

  return successResponse(res, 200, 'Availability retrieved', { schedule, availableSlots })
})

