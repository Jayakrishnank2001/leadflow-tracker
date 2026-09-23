import 'dotenv/config'
import { connectDatabase } from './config/database.js'
import app from './app.js'

const PORT = Number(process.env.PORT) || 5000

async function start(): Promise<void> {
  await connectDatabase()

  app.listen(PORT, () => {
    console.log(`leadflow-tracker backend listening on port ${PORT}`)
  })
}

start().catch((error) => {
  console.error('Failed to start server:', error)
  process.exit(1)
})

