import { Router } from 'express'
import {
  resendVerificationEmail,
  userLogin,
  userSignUp,
  verifyUser,
} from '../controllers/user/index.js'

const router = Router()

router.get('/verify/:userId/:uniqueString', verifyUser)

router.post('/login', userLogin)
router.post('/signup', userSignUp)
router.post('/signup/resend-email/:username', resendVerificationEmail)

export default router
