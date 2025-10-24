import mongoose from 'mongoose'
import { errorResponse } from '../utils/apiResponse.js'

const errorHandler = (err, req, res, next) => {
  console.error(err)

  let statusCode = err.statusCode || 500
  let message = err.message || 'Internal Server Error'
  let details = err.details || null

  if (err.isJoi) {
    statusCode = 400
    message = 'Validation Error'
    details = err.details.map(e => ({
      field: e.path.join('.'),
      message: e.message
    }))
  }

  if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400
    message = 'Validation Error'
    details = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }))
  }

  if (err instanceof mongoose.Error.CastError) {
    statusCode = 400
    message = 'Invalid ID format'
    details = { field: err.path, value: err.value }
  }

  if (err.code === 11000) {
    statusCode = 409
    message = 'Duplicate key error'
    details = {
      field: Object.keys(err.keyValue)[0],
      value: Object.values(err.keyValue)[0]
    }
  }

  return errorResponse(res, statusCode, message, details)
}

export default errorHandler