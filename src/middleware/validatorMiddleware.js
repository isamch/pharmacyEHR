import Joi from 'joi'

/**
 * @desc Middleware factory to validate request body, params, and query against a Joi schema
 * @param {object} schema - An object containing optional 'body', 'params', 'query' Joi schemas
 * @returns {function} Express middleware function
 */
export default (schema) => (req, res, next) => {
  // Define a combined schema for validation
  const requestSchema = Joi.object({
    body: schema.body || Joi.object(), // Default to empty object if not provided
    params: schema.params || Joi.object(),
    query: schema.query || Joi.object()
  })

  // Data object to validate
  const dataToValidate = {
    body: req.body,
    params: req.params,
    query: req.query
  }

  // Perform validation
  const { error, value } = requestSchema.validate(dataToValidate, {
    abortEarly: false, // Return all validation errors
    allowUnknown: true, // Allow properties not defined in schema (for safety)
    stripUnknown: { // Remove unknown properties from validated output
        body: true,
        params: true,
        query: true
    }
  })

  if (error) {
    // Mark error as Joi error for the errorHandler
    error.isJoi = true
    return next(error)
  }

  // Overwrite request parts with validated (and potentially sanitized/stripped) values
  // This is important for security and consistency
  req.body = value.body
  req.params = value.params
  req.query = value.query

  next() // Proceed to the next middleware or controller
}