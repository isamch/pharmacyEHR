import Joi from 'joi'

// Used for validating MongoDB ObjectIDs
const objectId = Joi.string().hex().length(24)

export const register = {
  body: Joi.object().keys({
    fullName: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required()
  })
}

export const login = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  })
}

export const verifyEmail = {
  params: Joi.object().keys({
    token: Joi.string().hex().length(64).required() // Unhashed token length
  })
}

export const forgotPassword = {
  body: Joi.object().keys({
    email: Joi.string().email().required()
  })
}

export const resetPassword = {
  params: Joi.object().keys({
    token: Joi.string().hex().length(64).required() // Unhashed token length
  }),
  body: Joi.object().keys({
    password: Joi.string().min(8).required()
  })
}

export const refresh = { // If implementing refresh tokens
  body: Joi.object().keys({
    refreshToken: Joi.string().required()
  })
}