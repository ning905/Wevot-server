import bcrypt from 'bcrypt'

export async function hashData(data, saltRounds = 10) {
  console.log('start hashing')
  try {
    const hashed = await bcrypt.hash(data, saltRounds)
    console.log('finished hashing')
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
