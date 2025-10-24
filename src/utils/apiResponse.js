export const successResponse = (res, statusCode, message, data) => {
  return res.status(statusCode).json({
    status: 'success',
    message,
    data
  })
}

export const errorResponse = (res, statusCode, message, details = null) => {
  return res.status(statusCode).json({
    status: 'error',
    code: statusCode,
    message,
    ...(details && { details })
  })
}