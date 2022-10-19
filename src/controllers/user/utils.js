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
  console.log('input value: ', Object.values(input))
  if (!Object.values(input)[0] || !Object.values(input)[0].trim()) {
    const err = new MissingInputError()
    return sendMessageResponse(res, err.code, err.message)
  }

  const key = Object.keys(input)[0]
  console.log('key', key)
  if (key === 'password' || key === 'confirmedPassword') {
    console.log('check match')
    if (input[key].match(userValidRegex[key])) {
      console.log('match')
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
  console.log('check username')
  const foundByUsername = await dbClient.user.findUnique({ where: { username } })
  console.log('check email')
  const foundByEmail = await dbClient.user.findUnique({ where: { email } })

  if (foundByUsername) {
    console.log('foundByUsername')
    const inUse = new InUseError('User', 'username')
    return sendMessageResponse(res, inUse.code, inUse.message)
  }

  if (foundByEmail) {
    console.log('foundByEmail')
    const inUse = new InUseError('User', 'email')
    return sendMessageResponse(res, inUse.code, inUse.message)
  }
}

export async function createUserInDB(data, res) {
  let { username, email, password, confirmedPassword } = data

  validateInputs([{ username }, { email }, { password }, { confirmedPassword }], res)

  console.log('passed validation')
  if (password !== confirmedPassword) {
    console.log('passwords mismatch')
    return sendMessageResponse(res, 400, 'Confirmed password should be the same as password')
  }

  try {
    console.log('check unique fields')
    await checkUserUniqueFields(username, email, res)

    console.log('hash password')
    password = await hashData(password)

    console.log('create user')
    const newUser = await dbClient.user.create({
      data: {
        username,
        email,
        password,
      },
    })

    console.log('new user: ', newUser)
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
