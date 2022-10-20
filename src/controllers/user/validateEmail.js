import 'dotenv/config'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'login',
    user: process.env.AUTH_EMAIL,
    pass: process.env.AUTH_PASS,
  },
})

export async function sendVerificationEmail(id, email, uniqueString) {
  const currentUrl = 'http://localhost:3000'

  const mailOptions = {
    from: process.env.AUTH_EMAIL,
    to: email,
    subject: 'Verify Your Email',
    html: `<p>Verify your email address to complete the signup and login into your account.</p><p>This link <b>expires in 6 hours</b>.</p><p>Press <a href=${
      currentUrl + '/signup/verify/' + id + '/' + uniqueString
    }>here</a> to proceed.</p>`,
  }
  // console.log('url: ', currentUrl + '/signup/verify/' + id + '/' + uniqueString)

  try {
    console.log('sending email')
    transporter.sendMail(mailOptions)
  } catch (err) {
    throw err
  }
}
