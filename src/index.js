import 'dotenv/config'
import express from 'express'
import 'express-async-errors'
import cors from 'cors'
import { sendDataResponse } from './utils/serverResponse.js'

const app = express()
app.disable('x-powered-by')
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use((error, req, res, next) => {
  console.error(error)

  if (error.code === 'P2025') {
    return sendDataResponse(res, 404, 'Record does not exist')
  }

  return sendDataResponse(res, 500)
})

const port = process.env.PORT || 4000
app.listen(port, () => {
  console.log(`\n Server is running on port ${port}\n`)
})
