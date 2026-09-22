// const nodemailer = require("nodemailer");
require("dotenv").config();

// const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASSWORD
//     }
// });

const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendOTPEmail = async (email, otp) => {

    const { data, error } = await resend.emails.send({
        from: "Food Delivery <onboarding@resend.dev>",
        to: [email],
        subject: "Food Delivery - Email Verification OTP",

        html: `
            <h2>Food Delivery Email Verification</h2>

            <p>Your verification OTP is:</p>

            <h1>${otp}</h1>

            <p>This OTP is valid for 50 minutes.</p>

            <p>Please do not share this OTP with anyone.</p>
        `
    });

    if (error) {
        console.log("Resend email error:", error);
        throw new Error(error.message);
    }

    console.log("OTP email sent successfully:", data);
};

module.exports = {
    sendOTPEmail
};