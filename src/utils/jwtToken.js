import jwt from 'jsonwebtoken'
const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRY = process.env.JWT_EXPIRY

export function generateJwt(username) {
  return jwt.sign({ username }, JWT_SECRET, { expiresIn: JWT_EXPIRY })
}
