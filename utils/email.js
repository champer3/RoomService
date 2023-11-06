const nodemailer = require("nodemailer")

const sendEmail = async options => {
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: false,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
    })

    const mailOptions = {
        from: "Stephen Okunola <hello@rommservicehq.io>",
        to: options.email,
        subject: options.subject,
        text: options.message,
    }

    await transporter.sendMail(mailOptions, (error, info) =>{
        if(error){
            console.log(error)
        } else{
            console.log('EMAIL sent' + info.response)
        }
    })
    // console.log(sent)
}

module.exports = sendEmail