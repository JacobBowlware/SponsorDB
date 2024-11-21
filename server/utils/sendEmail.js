const nodemailer = require("nodemailer");

const sendEmail = async (email, subject, text) => {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            service: 'Gmail',
            port: 587,
            secure: false,
            auth: {
                user: 'sponsordatabase@gmail.com',
                pass: process.env.sponsorDBGmailPass,
            },
        });

        await transporter.sendMail({
            from: "sponsordatabase@gmail.com",
            to: email,
            subject: subject,
            text: text,
        });

        console.log("email sent sucessfully");
    } catch (error) {
        console.log(error, "email not sent");
    }
};

module.exports = sendEmail;
