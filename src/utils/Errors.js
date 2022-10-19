export class BadRequestError {
  constructor(message = 'Bad request') {
    this.code = 400
    this.message = message
  }
}

export class MissingInputError {
  constructor(message = 'Input fields cannot be empty') {
    this.code = 400
    this.message = message
  }
}

export class InvalidInputError {
  constructor(target) {
    this.code = 400
    this.message = `Invalid ${target} entered`
  }
}

export class InvalidAuthError {
  constructor(message = 'Unable to verify user') {
    this.code = 401
    this.message = message
  }
}

export class NoAccessError {
  constructor(message = 'You do not access to this content') {
    this.code = 403
    this.message = message
  }
}

export class InvalidLoginError {
  constructor() {
    this.code = 404
    this.message = 'Invalid credentials provided'
  }
}

export class NotFoundError {
  constructor(target, info) {
    this.code = 404
    this.message = `The ${target} with the provided ${info} does not exist`
  }
}

export class InUseError {
  constructor(target, info) {
    this.code = 409
    this.message = `${target} with the provided ${info} already exists`
  }
}

export class ServerConflictError {
  constructor(message) {
    this.code = 409
    this.message = message
  }
}

export class InternalServerError {
  constructor(message = 'Internal Server Error') {
    this.code = 500
    this.message = message
  }
}
