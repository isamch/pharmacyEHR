import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import createError from 'http-errors'
import mainRouter from './src/routes/router.js'
import errorHandler from './src/middleware/errorHandler.js'
import cookieParser from "cookie-parser";
const app = express()

// Core Middleware
app.use(cors())
app.use(helmet())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser());


// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

// Main Router
app.use(mainRouter)

// 404 Handler
app.use((req, res, next) => {
  next(createError.NotFound('The route you requested does not exist.'))
})

// Global Error Handler
app.use(errorHandler)

export default app