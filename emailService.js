const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
    service: "gmail",

    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

const sendOTPEmail = async (email, otp) => {

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Food Delivery - Email Verification OTP",

        html: `
            <h2>Food Delivery Email Verification</h2>

            <p>Your verification OTP is:</p>

            <h1>${otp}</h1>

            <p>This OTP is valid for 10 minutes.</p>

            <p>Please do not share this OTP with anyone.</p>
        `
    };

    await transporter.sendMail(mailOptions);
};

module.exports = {
    sendOTPEmail
};