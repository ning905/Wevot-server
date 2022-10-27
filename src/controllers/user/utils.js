import dbClient from '../../utils/dbClient.js'
import {
  InternalServerError,
  InUseError,
  InvalidInputError,
  MissingInputError,
} from '../../utils/Errors.js'
import { hashData } from '../../utils/hashData.js'
import { sendMessageResponse } from '../../utils/serverResponse.js'

const serverError = new InternalServerError()
const userValidRegex = {
  //only accept letter and numbers
  username: /^[a-zA-Z0-9]+$/,
  email: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/,
  // At least one lowercase, one upper case English letter, one digit, one special character, minimum eight in length
  password: /^(.{0,7}|[^0-9]*|[^A-Z]*|[^a-z]*|[a-zA-Z0-9]*)$/,
  confirmedPassword: /^(.{0,7}|[^0-9]*|[^A-Z]*|[^a-z]*|[a-zA-Z0-9]*)$/,
}

function validateInput(input, res) {
  if (!Object.values(input)[0] || !Object.values(input)[0].trim()) {
    const err = new MissingInputError()
    return sendMessageResponse(res, err.code, err.message)
  }

  const key = Object.keys(input)[0]
  if (key === 'password' || key === 'confirmedPassword') {
    if (input[key].match(userValidRegex[key])) {
      const err = new InvalidInputError(key)
      return sendMessageResponse(res, err.code, err.message)
    }
  } else if (!input[key].match(userValidRegex[key])) {
    const err = new InvalidInputError(key)
    return sendMessageResponse(res, err.code, err.message)
  }
}

export function validateInputs(inputs, res) {
  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i]
    validateInput(input, res)
  }
}

export async function checkUserUniqueFields(username, email, res) {
  const foundByUsername = await dbClient.user.findUnique({ where: { username } })
  const foundByEmail = await dbClient.user.findUnique({ where: { email } })

  if (foundByUsername) {
    const inUse = new InUseError('User', 'username')
    return sendMessageResponse(res, inUse.code, inUse.message)
  }

  if (foundByEmail) {
    const inUse = new InUseError('User', 'email')
    return sendMessageResponse(res, inUse.code, inUse.message)
  }
}

export async function createUserInDB(data, res) {
  let { username, email, password, confirmedPassword } = data

  validateInputs([{ username }, { email }, { password }, { confirmedPassword }], res)

  if (password !== confirmedPassword) {
    return sendMessageResponse(res, 400, 'Confirmed password should be the same as password')
  }

  try {
    await checkUserUniqueFields(username, email, res)

    password = await hashData(password)

    const newUser = await dbClient.user.create({
      data: {
        username,
        email,
        password,
      },
    })

    return newUser
  } catch (err) {
    sendMessageResponse(res, serverError.code, serverError.message)
    throw err
  }
}

export async function createVerificationInDB(userId, uniqueString) {
  try {
    const newVerification = await dbClient.userVerification.create({
      data: {
        userId,
        uniqueString,
        expiresAt: new Date(Date.now() + 21600000),
      },
    })

    return newVerification
  } catch (err) {
    throw err
  }
}
