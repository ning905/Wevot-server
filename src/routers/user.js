import { Router } from 'express'
import { userLogin, userSignUp, verifyUser } from '../controllers/user/index.js'

const router = Router()

router.get('/verify/:userId/:uniqueString', verifyUser)

router.post('/login', userLogin)
router.post('/signup', userSignUp)

export default router
