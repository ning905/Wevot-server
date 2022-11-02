import dbClient from '../../utils/dbClient.js'
import {
  InternalServerError,
  NotFoundError,
  InvalidLoginError,
  MissingInputError,
  NoAccessError,
  BadRequestError,
  ServerConflictError,
} from '../../utils/Errors.js'
import { sendDataResponse, sendMessageResponse } from '../../utils/serverResponse.js'
import { sendVerificationEmail } from '../../utils/sendEmails.js'
import { createUserInDB, createVerificationInDB } from './utils.js'
import { compareHash, hashData } from '../../utils/hashData.js'
import { v4 as uuid } from 'uuid'
import { generateJwt } from '../../utils/jwtToken.js'

const serverError = new InternalServerError()

export async function userSignUp(req, res) {
  try {
    const user = await createUserInDB(req.body, res)

    const uniqueString = uuid() + user.id
    const hashedString = await hashData(uniqueString)
    await createVerificationInDB(user.id, hashedString)

    await sendVerificationEmail(user.id, user.email, uniqueString)

    return sendMessageResponse(res, 201, 'Signup successful')
  } catch (err) {
    sendMessageResponse(res, serverError.code, serverError.message)
    throw err
  }
}

export async function resendVerificationEmail(req, res) {
  const { username } = req.params

  if (!username) {
    const err = new BadRequestError('Missing user identifier')
    return sendMessageResponse(res, err.code, err.message)
  }

  try {
    const foundUser = await dbClient.user.findUnique({ where: { username } })
    if (!foundUser) {
      const notFound = new NotFoundError('user', 'username')
      return sendMessageResponse(res, notFound.code, notFound.message)
    }

    const foundVerification = await dbClient.userVerification.findUnique({
      where: { userId: foundUser.id },
    })
    if (!foundVerification) {
      const err = new ServerConflictError(
        "Account record doesn't exist or has been verified already. Please sign up or log in."
      )
      return sendMessageResponse(res, err.code, err.message)
    }

    await dbClient.userVerification.delete({ where: { userId: foundUser.id } })

    const uniqueString = uuid() + foundUser.id
    const hashedString = await hashData(uniqueString)
    await createVerificationInDB(foundUser.id, hashedString)

    await sendVerificationEmail(foundUser.id, foundUser.email, uniqueString)

    return sendMessageResponse(res, 201, 'Verification email resent')
  } catch (err) {
    sendMessageResponse(res, serverError.code, serverError.message)
    throw err
  }
}

export async function verifyUser(req, res) {
  const { userId, uniqueString } = req.params

  try {
    // check if the verification record exists
    const foundVerification = await dbClient.userVerification.findUnique({ where: { userId } })

    if (!foundVerification) {
      return sendMessageResponse(
        res,
        404,
        "Account record doesn't exist or has been verified already. Please sign up or log in."
      )
    }

    const { expiresAt } = foundVerification
    if (expiresAt < Date.now()) {
      await dbClient.userVerification.delete({ where: { userId } })
      await dbClient.user.delete({ where: { userId } })
      return sendMessageResponse(res, 401, 'Link has expired. Please sign up again.')
    }

    const isValidString = compareHash(uniqueString, foundVerification.uniqueString)

    if (!isValidString) {
      return sendMessageResponse(res, 401, 'Invalid verification details passed. Check your inbox.')
    }

    const updatedUser = await dbClient.user.update({
      where: { id: userId },
      data: { isVerified: true },
    })

    const token = generateJwt(updatedUser.username)
    delete updatedUser.password
    sendDataResponse(res, 200, { token, user: updatedUser })

    await dbClient.userVerification.delete({ where: { userId } })
  } catch (err) {
    sendMessageResponse(res, serverError.code, serverError.message)
    throw err
  }
}

export async function userLogin(req, res) {
  let { identifier, password } = req.body
  identifier = identifier.trim()
  password = password.trim()

  if (!identifier || !password) {
    const err = new MissingInputError()
    return sendMessageResponse(res, err.code, err.message)
  }

  try {
    const foundUser = await dbClient.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
    })

    if (!foundUser) {
      const notFound = new NotFoundError('user', 'email / username')
      return sendMessageResponse(res, notFound.code, notFound.message)
    }

    if (!foundUser.isVerified) {
      const err = new NoAccessError('This account has not been verified. Please check your inbox.')
      return sendMessageResponse(res, err.code, err.message)
    }

    const isValidPassword = await compareHash(password, foundUser.password)
    if (!isValidPassword) {
      const err = new InvalidLoginError()
      return sendMessageResponse(res, err.code, err.message)
    }

    const token = generateJwt(foundUser.username)
    delete foundUser.password
    return sendDataResponse(res, 200, { token, user: foundUser })
  } catch (err) {
    sendMessageResponse(res, serverError.code, serverError.message)
    throw err
  }
}

export async function getUserByUsername(req, res) {
  const { username } = req.params

  try {
    const foundUser = await dbClient.user.findUnique({
      where: { username },
    })

    if (!foundUser) {
      const notFound = new NotFoundError('user', 'username')
      return sendMessageResponse(res, notFound.code, notFound.message)
    }

    if (foundUser.id !== req.user.id) {
      const err = new NoAccessError()
      return sendMessageResponse(res, err.code, err.message)
    }

    if (!foundUser.isVerified) {
      const err = new NoAccessError('This account has not been verified. Please check your inbox.')
      return sendMessageResponse(res, err.code, err.message)
    }

    delete foundUser.password
    return sendDataResponse(res, 200, foundUser)
  } catch (err) {
    sendMessageResponse(res, serverError.code, serverError.message)
    throw err
  }
}

export async function updateUserById(req, res) {
  const { username, profileImgUrl } = req.body
  const { id } = req.params
  try {
    const foundUser = await dbClient.user.findUnique({ where: { id } })

    if (!foundUser) {
      const notFound = new NotFoundError('user', 'id')
      return sendMessageResponse(res, notFound.code, notFound.message)
    }

    if (foundUser.id !== req.user.id) {
      const err = new NoAccessError()
      return sendMessageResponse(res, err.code, err.message)
    }

    if (!foundUser.isVerified) {
      const err = new NoAccessError('This account has not been verified. Please check your inbox.')
      return sendMessageResponse(res, err.code, err.message)
    }

    const updated = await dbClient.user.update({
      where: { id },
      data: { username, profileImgUrl },
    })

    sendDataResponse(res, 201, updated)
  } catch (err) {
    sendMessageResponse(res, serverError.code, serverError.message)
    throw err
  }
}
