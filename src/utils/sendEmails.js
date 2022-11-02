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
  const clientUrl = process.env.CLIENT_URL

  const mailOptions = {
    from: process.env.AUTH_EMAIL,
    to: email,
    subject: 'Please verify Your Email',
    html: `<p>Please verify your email address to complete the signup and login into your account.</p><p>This link <b>expires in 6 hours</b>.</p><p>Press <a href=${
      clientUrl + '/signup/verify/' + id + '/' + uniqueString
    }>here</a> to proceed.</p>`,
  }
  console.log('url: ', clientUrl + '/signup/verify/' + id + '/' + uniqueString)
  try {
    transporter.sendMail(mailOptions)
  } catch (err) {
    throw err
  }
}

export async function sendEditEventEmail(code, email, eventTitle) {
  const clientUrl = process.env.CLIENT_URL

  const mailOptions = {
    from: process.env.AUTH_EMAIL,
    to: email,
    subject: 'An event you joined has been updated',
    html: `<p>The event <b>${eventTitle}</b> has just been updated by the host.</p><p>Click <a href=${
      clientUrl + '/events/participate/' + code
    }>here</a> to check the details,</p><p>or use this code <b>${code}</b> to join on the website.</p>`,
  }

  try {
    transporter.sendMail(mailOptions)
  } catch (err) {
    throw err
  }
}
