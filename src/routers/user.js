import { Router } from 'express'
import {
  getUserByUsername,
  resendVerificationEmail,
  updateUserById,
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

router.patch('/:id', validateAuthentication, updateUserById)

export default router
