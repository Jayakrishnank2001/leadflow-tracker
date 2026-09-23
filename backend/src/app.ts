import cors from 'cors'
import express from 'express'
import { errorMiddleware, notFoundMiddleware } from './middleware/error.middleware.js'
import leadRoutes from './routes/lead.routes.js'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.use('/api/leads', leadRoutes)

app.use(notFoundMiddleware)
app.use(errorMiddleware)

export default app

