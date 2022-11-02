import jwt from 'jsonwebtoken'
import dbClient from '../utils/dbClient.js'
import { InvalidAuthError, NoAccessError } from '../utils/Errors.js'
import { sendMessageResponse } from '../utils/serverResponse.js'

function validateType(type) {
  if (!type || typeof type !== 'string') {
    return false
  }

  if (type.toUpperCase() === 'BEARER') {
    return true
  }

  return false
}

export async function validateAuthentication(req, res, next) {
  const header = req.header('authorization')
  let username
  if (!header) {
    const error = new InvalidAuthError('Missing Authorization header')
    return sendMessageResponse(res, error.code, error.message)
  }

  const [type, token] = header.split(' ')

  const typeIsValid = validateType(type)
  if (!typeIsValid) {
    const error = new InvalidAuthError(`Invalid token type, expected Bearer but got ${type}`)
    return sendMessageResponse(res, error.code, error.message)
  }

  if (!token) {
    const error = new InvalidAuthError('Missing access token')
    return sendMessageResponse(res, error.code, error.message)
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      const noAccess = new NoAccessError(err.message)
      return sendMessageResponse(res, noAccess.code, noAccess.message)
    }
    username = decoded.username
  })

  if (username) {
    const foundUser = await dbClient.user.findUnique({ where: { username } })
    if (!foundUser) {
      const noAccess = new NoAccessError('Invalid token')
      return sendMessageResponse(res, noAccess.code, noAccess.message)
    }

    delete foundUser.password
    req.user = foundUser
  }

  next()
}
