import 'dotenv/config'
import app from './app.js'

const PORT = Number(process.env.PORT) || 5000

app.listen(PORT, () => {
  console.log(`leadflow-tracker backend listening on port ${PORT}`)
})
