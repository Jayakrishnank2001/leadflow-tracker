import mongoose from 'mongoose'

export async function connectDatabase(): Promise<void> {
  const uri = process.env.MONGODB_URI

  if (!uri) {
    throw new Error('MONGODB_URI is not defined in the environment')
  }

  if (mongoose.connection.readyState === 1) {
    return
  }

  await mongoose.connect(uri)
}

export default connectDatabase
