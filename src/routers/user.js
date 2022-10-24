import { Router } from 'express'
import {
  getUserByUsername,
  resendVerificationEmail,
  userLogin,
  userSignUp,
  verifyUser,
} from '../controllers/user/user.js'
import { validateAuthentication } from '../middleware/auth.js'

const router = Router()

router.get('/verify/:userId/:uniqueString', verifyUser)
router.get('/:username', validateAuthentication, getUserByUsername)

router.post('/login', userLogin)
router.post('/signup', userSignUp)
router.post('/signup/resend-email/:username', resendVerificationEmail)

export default router
