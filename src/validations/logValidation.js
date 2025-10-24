import Joi from 'joi'

export const getLogs = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1),
    perPage: Joi.number().integer().min(1).max(100)    
  })
}

