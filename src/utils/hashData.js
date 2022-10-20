import bcrypt from 'bcrypt'

export async function hashData(data, saltRounds = 10) {
  try {
    const hashed = await bcrypt.hash(data, saltRounds)
    return hashed
  } catch (e) {
    throw e
  }
}

export async function compareHash(data, hashedData) {
  try {
    return await bcrypt.compare(data, hashedData)
  } catch (e) {
    throw e
  }
}
