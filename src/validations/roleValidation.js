import Joi from 'joi'
const objectId = Joi.string().hex().length(24)

export const createRole = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    description: Joi.string().optional(),
    permissions: Joi.array().items(Joi.string()).required().min(1) // Must have at least one permission
  })
}

export const updateRole = {
  params: Joi.object().keys({
    id: objectId.required()
  }),
  body: Joi.object().keys({
    name: Joi.string().optional(),
    description: Joi.string().optional(),
    permissions: Joi.array().items(Joi.string()).optional().min(1)
  }).min(1) // Require at least one field to update
}

export const getOrDeleteRole = {
    params: Joi.object().keys({
        id: objectId.required()
    })
}