import cors from 'cors'
import express from 'express'
import { errorMiddleware, notFoundMiddleware } from './middleware/error.middleware.js'
import leadRoutes from './routes/lead.routes.js'

const app = express()

// Comma-separated allow-list (deployed frontend + local dev). Unset → allow any origin.
const corsOrigins = process.env.CORS_ORIGIN?.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.use(cors(corsOrigins && corsOrigins.length > 0 ? { origin: corsOrigins } : undefined))
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.use('/api/leads', leadRoutes)

app.use(notFoundMiddleware)
app.use(errorMiddleware)

export default app

