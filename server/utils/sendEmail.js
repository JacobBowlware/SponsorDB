const nodemailer = require("nodemailer");

const sendEmail = async (email, subject, text) => {
    try {
        // Create transporter using Zoho's SMTP server details
        const transporter = nodemailer.createTransport({
            host: 'smtppro.zoho.com',      // Zoho SMTP server
            port: 465,                    // SSL port for Zoho
            secure: true,                 // Use SSL
            auth: {
                user: 'info@sponsor-db.com', // Your Zoho email
                pass: process.env.sponsorDBEmailPassword, // Zoho email password or App password if 2FA enabled
            },
        });

        // Send the email
        await transporter.sendMail({
            from: 'info@sponsor-db.com',    // Sender address
            to: email,                    // Receiver email
            subject: subject,             // Email subject
            text: text,                   // Email body
        });

        console.log("Email sent successfully!");
    } catch (error) {
        console.error("Email not sent:", error);
    }
};

module.exports = sendEmail;
