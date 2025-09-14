import nodemailer from 'nodemailer'

const MAIL_USER = process.env.MAIL_USER // 邮箱账号
const MAIL_PASS = process.env.MAIL_PASS // 邮箱 SMTP 授权码
const MAIL_TO = process.env.MAIL_TO || MAIL_USER // 收件人，默认发给自己

// 创建传输器
const transporter = nodemailer.createTransport({
  host: 'smtp.qq.com',
  port: 465,
  secure: true,
  auth: {
    user: MAIL_USER,
    pass: MAIL_PASS,
  },
})

// 发送邮件方法
async function sendMail(subject, html) {
  const info = await transporter.sendMail({
    from: `"自动快照" <${MAIL_USER}>`,
    to: MAIL_TO,
    subject,
    html,
  })
  console.log('邮件已发送: %s', info.messageId)
}

export { sendMail }
