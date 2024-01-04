const nodemailer = require("nodemailer");
const pug = require("pug");
const htmlToText = require("html-to-text")

module.exports = class Email {
  constructor(user, url, code) {
    this.to = user.email;
    this.firstName = user.firstName;
    this.url = url;
    this.code = code
    this.from = "Stephen Okunola <okunolas21@gmail.com>";
  }

  newTransport() {
    if (process.env.NODE_ENV === "production") {
      // send grid
      console.log("I am in production")
      return nodemailer.createTransport({
        service: "SendGrid",
        auth: {
            user: process.env.SENDGRID_USERNAME,
            pass: process.env.SENDGRID_PASSWORD,
          },
      })
    }
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }
  async send(template, subject){
    // 1) Render HTML based on a pug template
    const html = pug.renderFile(`${__dirname}/../views/emails/${template}.pug`, {
        firstName: this.firstName,
        url: this.url,
        code: this.code,
        subject
    })

    // 2) Define Email Options
    const mailOptions = {
        from: this.from,
        to: this.to,
        subject,
        html,
        text: "whatsapp",
      };
    // 3) Create a Transport and send Email
    await this.newTransport().sendMail(mailOptions)

  }

  async sendWelcome(){
    await this.send("welcome", "Welcome to Roomservice")
  }

  async sendPasswordReset(){
    await this.send("passwordReset", "Reset your Password")
  }
};

// const sendEmail = async (options) => {
//   const transporter = nodemailer.createTransport({
//     host: process.env.EMAIL_HOST,
//     port: process.env.EMAIL_PORT,
//     secure: false,
//     auth: {
//       user: process.env.EMAIL_USERNAME,
//       pass: process.env.EMAIL_PASSWORD,
//     },
//   });

//   const mailOptions = {
//     from: "Stephen Okunola <hello@rommservicehq.io>",
//     to: options.email,
//     subject: options.subject,
//     text: options.message,
//   };

//   await transporter.sendMail(mailOptions)
//   // console.log(sent)
// };

// module.exports = sendEmail;
