import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { connectDatabase } from '../src/config/database.js'
import Lead from '../src/models/lead.model.js'

// Each test file gets its own in-memory MongoDB instance, so the suite needs
// no external database and can run in CI.
let mongo: MongoMemoryServer

beforeAll(async () => {
  mongo = await MongoMemoryServer.create()
  process.env.MONGODB_URI = mongo.getUri()
  await connectDatabase()
  // Build the indexes (unique email) before the first assertion runs.
  await Lead.init()
})

afterEach(async () => {
  await Lead.deleteMany({})
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongo.stop()
})
