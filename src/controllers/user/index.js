import dbClient from '../../utils/dbClient.js'
import {
  InternalServerError,
  NotFoundError,
  InvalidLoginError,
  MissingInputError,
  NoAccessError,
} from '../../utils/Errors.js'
import { sendDataResponse, sendMessageResponse } from '../../utils/serverResponse.js'
import { sendVerificationEmail } from './validateEmail.js'
import { createUserInDB, createVerificationInDB } from './utils.js'
import { compareHash, hashData } from '../../utils/hashData.js'
import { v4 as uuid } from 'uuid'

const serverError = new InternalServerError()

export async function userSignUp(req, res) {
  try {
    const user = await createUserInDB(req.body, res)

    const uniqueString = uuid() + user.id
    const hashedString = await hashData(uniqueString)
    await createVerificationInDB(user.id, hashedString)

    await sendVerificationEmail(user.id, user.email, uniqueString)
    console.log('email sent')
    return sendMessageResponse(res, 201, 'Signup successful')
  } catch (err) {
    sendMessageResponse(res, serverError.code, serverError.message)
    throw err
  }
}

export async function verifyUser(req, res) {
  const { userId, uniqueString } = req.params
  console.log('userId: ', userId)
  console.log('uniqueString: ', uniqueString)
  try {
    // check if the verification record exists
    const foundVerification = await dbClient.userVerification.findUnique({ where: { userId } })
    console.log('foundVerification', foundVerification)

    if (!foundVerification) {
      return sendMessageResponse(
        res,
        404,
        "Account record doesn't exist or has been verified already. Please sign up or log in."
      )
    }

    // check if the verification record has expired
    const { expiresAt } = foundVerification
    if (expiresAt < Date.now()) {
      // delete the record and the user if expired
      await dbClient.userVerification.delete({ where: { userId } })
      await dbClient.user.delete({ where: { userId } })
      return sendMessageResponse(res, 401, 'Link has expired. Please sign up again.')
    }

    // validate the unique string
    const isValidString = compareHash(uniqueString, foundVerification.uniqueString)

    if (!isValidString) {
      return sendMessageResponse(res, 401, 'Invalid verification details passed. Check your inbox.')
    }

    //update the user record
    const updatedUser = await dbClient.user.update({
      where: { id: userId },
      data: { isVerified: true },
      include: { profile: true },
    })

    await dbClient.userVerification.delete({ where: { userId } })

    delete updatedUser.password
    sendDataResponse(res, 201, updatedUser)
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
      include: { profile: true },
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

    delete foundUser.password
    return sendDataResponse(res, 200, foundUser)
  } catch (err) {
    sendMessageResponse(res, serverError.code, serverError.message)
    throw err
  }
}
