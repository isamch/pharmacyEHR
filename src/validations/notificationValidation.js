import Joi from 'joi'
const objectId = Joi.string().hex().length(24)

// For getting own notifications
export const getNotifications = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1),
    perPage: Joi.number().integer().min(1).max(100)
  })
}

// For Admin creating a notification
export const createNotification = {
  body: Joi.object().keys({
    userId: objectId.required(), // Target User ID
    title: Joi.string().required(),
    message: Joi.string().required(),
    type: Joi.string().optional()
  })
}