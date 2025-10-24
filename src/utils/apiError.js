const createError = (statusCode, message, details = null) => {
  const error = new Error(message)
  error.statusCode = statusCode
  error.details = details
  return error
}

export const badRequest = (msg, details = null) => {
  return createError(400, msg, details)
}

export const unauthorized = (msg = 'Unauthorized', details = null) => {
  return createError(401, msg, details)
}

export const forbidden = (msg = 'Forbidden', details = null) => {
  return createError(403, msg, details)
}

export const notFound = (msg = 'Not Found', details = null) => {
  return createError(404, msg, details)
}

export const conflict = (msg, details = null) => {
  return createError(409, msg, details)
}

// Exporting createError itself in case you need it
export { createError }