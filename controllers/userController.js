const db = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendOTPEmail } = require("../emailService");

// NEW: Temporary registration OTP storage
const registrationOTPs = new Map();


// OLD CODE
/*
const createUser = async (req, res) => {

    const {
        name,
        email,
        password,
        address
    } = req.body;

    if (!name) {
        return res.status(400).json({
            message: "Name is required"
        });
    }

    if (!email) {
        return res.status(400).json({
            message: "Email is required"
        });
    }

    if (!password) {
        return res.status(400).json({
            message: "Password is required"
        });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
        return res.status(400).json({
            message: "Invalid email"
        });
    }

    try {

        const checkSql = `
            SELECT id, is_verified
            FROM users
            WHERE email = ?
        `;

        db.query(
            checkSql,
            [email],
            async (err, results) => {

                if (err) {
                    console.log(err);
                    return res.status(500).json({
                        message: "Database error"
                    });
                }

                if (results.length > 0) {

                    if (results[0].is_verified) {
                        return res.status(409).json({
                            message: "Email already exists"
                        });
                    }

                    return res.status(409).json({
                        message: "Email already registered but not verified"
                    });
                }

                const hashedPassword = await bcrypt.hash(
                    password,
                    10
                );

                const otp = Math.floor(
                    100000 + Math.random() * 900000
                ).toString();

                const otpExpiry = new Date(
                    Date.now() + 10 * 60 * 1000
                );

                const sql = `
                    INSERT INTO users
                    (
                        name,
                        email,
                        password,
                        address,
                        is_verified,
                        verification_otp,
                        otp_expiry
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `;

                db.query(
                    sql,
                    [
                        name,
                        email,
                        hashedPassword,
                        address,
                        false,
                        otp,
                        otpExpiry
                    ],
                    async (err, result) => {

                        if (err) {

                            console.log(err);

                            if (err.code === "ER_DUP_ENTRY") {
                                return res.status(409).json({
                                    message: "Email already exists"
                                });
                            }

                            return res.status(500).json({
                                message: "Database error"
                            });
                        }

                        try {

                            await sendOTPEmail(
                                email,
                                otp
                            );

                            res.status(201).json({
                                message:
                                    "Registration successful. OTP sent to your email",
                                userId:
                                    result.insertId,
                                email: email
                            });

                        } catch (emailError) {

                            console.log(
                                "Email error:",
                                emailError
                            );

                            return res.status(500).json({
                                message:
                                    "User created but OTP email could not be sent"
                            });
                        }
                    }
                );
            }
        );

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};
*/


// NEW: Send registration OTP
const sendRegistrationOTP = async (req, res) => {

    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            message: "Email is required"
        });
    }

    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
        return res.status(400).json({
            message: "Invalid email"
        });
    }

    try {

        const checkSql = `
            SELECT id, is_verified
            FROM users
            WHERE email = ?
        `;

        db.query(
            checkSql,
            [email],
            async (err, results) => {

                if (err) {

                    console.log(err);

                    return res.status(500).json({
                        message: "Database error"
                    });
                }

                if (results.length > 0) {

                    if (results[0].is_verified) {

                        return res.status(409).json({
                            message: "Email already exists"
                        });
                    }

                    return res.status(409).json({
                        message: "Email already registered"
                    });
                }

                const otp = Math.floor(
                    100000 + Math.random() * 900000
                ).toString();

                const expiry =
                    Date.now()  + 50 * 60 * 1000;

                registrationOTPs.set(email, {
                    otp,
                    expiry,
                    verified: false
                });

                try {

                    await sendOTPEmail(
                        email,
                        otp
                    );

                    return res.status(200).json({
                        message: "OTP sent to your email"
                    });

                } catch (emailError) {

                    console.log(
                        "Email error:",
                        emailError
                    );

                    registrationOTPs.delete(email);

                    return res.status(500).json({
                        message: "Failed to send OTP email"
                    });
                }
            }
        );

    } catch (error) {

        console.log(
            "Send OTP error:",
            error
        );

        return res.status(500).json({
            message: "Server error"
        });
    }
};


// NEW: Register only after OTP verification
const createUser = async (req, res) => {

    const {
        name,
        email,
        password,
        address
    } = req.body;

    if (!name) {
        return res.status(400).json({
            message: "Name is required"
        });
    }

    if (!email) {
        return res.status(400).json({
            message: "Email is required"
        });
    }

    if (!password) {
        return res.status(400).json({
            message: "Password is required"
        });
    }

    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
        return res.status(400).json({
            message: "Invalid email"
        });
    }

    try {

        // NEW: Check OTP verification
        const otpData = registrationOTPs.get(email);

        if (!otpData) {

            return res.status(403).json({
                message: "Please verify your email first"
            });
        }

        if (Date.now() > otpData.expiry) {

            registrationOTPs.delete(email);

            return res.status(403).json({
                message: "OTP has expired. Please verify again"
            });
        }

        if (!otpData.verified) {

            return res.status(403).json({
                message: "Please verify your email first"
            });
        }

        const checkSql = `
            SELECT id
            FROM users
            WHERE email = ?
        `;

        db.query(
            checkSql,
            [email],
            async (err, results) => {

                if (err) {

                    console.log(err);

                    return res.status(500).json({
                        message: "Database error"
                    });
                }

                if (results.length > 0) {

                    return res.status(409).json({
                        message: "Email already exists"
                    });
                }

                const hashedPassword =
                    await bcrypt.hash(
                        password,
                        10
                    );

                const sql = `
                    INSERT INTO users
                    (
                        name,
                        email,
                        password,
                        address,
                        is_verified
                    )
                    VALUES (?, ?, ?, ?, ?)
                `;

                db.query(
                    sql,
                    [
                        name,
                        email,
                        hashedPassword,
                        address,
                        true
                    ],
                    (err, result) => {

                        if (err) {

                            console.log(err);

                            if (
                                err.code ===
                                "ER_DUP_ENTRY"
                            ) {

                                return res.status(409).json({
                                    message:
                                        "Email already exists"
                                });
                            }

                            return res.status(500).json({
                                message:
                                    "Database error"
                            });
                        }

                        // NEW: OTP remove
                        registrationOTPs.delete(email);

                        return res.status(201).json({

                            message:
                                "Registration successful",

                            userId:
                                result.insertId,

                            email:
                                email
                        });
                    }
                );
            }
        );

    } catch (error) {

        console.log(
            "Registration error:",
            error
        );

        return res.status(500).json({
            message: "Server error"
        });
    }
};


// Test email
const sendTestEmail = async (req, res) => {

    try {

        const otp = Math.floor(
            100000 + Math.random() * 900000
        ).toString();

        await sendOTPEmail(
            process.env.EMAIL_USER,
            otp
        );

        res.json({
            message: "Test email sent successfully"
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Email sending failed"
        });
    }
};


// Login User
const loginUser = async (req, res) => {

    const {
        email,
        password
    } = req.body;

    const sql = `
        SELECT *
        FROM users
        WHERE email = ?
    `;

    db.query(
        sql,
        [email],
        async (err, results) => {

            if (err) {

                console.log(err);

                return res.status(500).json({
                    message: "Database error"
                });
            }

            if (results.length === 0) {

                return res.status(401).json({
                    message:
                        "Invalid email or password"
                });
            }

            const user = results[0];

            if (!user.is_verified) {

                return res.status(403).json({
                    message:
                        "Please verify your email first"
                });
            }

            const isPasswordMatch =
                await bcrypt.compare(
                    password,
                    user.password
                );

            if (!isPasswordMatch) {

                return res.status(401).json({
                    message:
                        "Invalid email or password"
                });
            }

            const token = jwt.sign(
                {
                    id: user.id,
                    email: user.email
                },
                "mySecretKey",
                {
                    expiresIn: "1h"
                }
            );

            res.json({

                message: "Login successful",

                token: token,

                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    address: user.address
                }
            });
        }
    );
};


// OLD CODE
/*
const verifyOTP = (req, res) => {

    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({
            message: "Email and OTP are required"
        });
    }

    const sql = `
        SELECT id, is_verified, verification_otp, otp_expiry
        FROM users
        WHERE email = ?
    `;

    db.query(sql, [email], (err, results) => {

        if (err) {

            console.log(err);

            return res.status(500).json({
                message: "Database error"
            });
        }

        if (results.length === 0) {

            return res.status(404).json({
                message: "User not found"
            });
        }

        const user = results[0];

        if (user.is_verified) {

            return res.status(400).json({
                message: "Email is already verified"
            });
        }

        if (user.verification_otp !== otp) {

            return res.status(400).json({
                message: "Invalid OTP"
            });
        }

        if (
            !user.otp_expiry ||
            new Date() > new Date(user.otp_expiry)
        ) {

            return res.status(400).json({
                message: "OTP has expired"
            });
        }

        const updateSql = `
            UPDATE users
            SET
                is_verified = true,
                verification_otp = NULL,
                otp_expiry = NULL
            WHERE email = ?
        `;

        db.query(
            updateSql,
            [email],
            (err) => {

                if (err) {

                    console.log(err);

                    return res.status(500).json({
                        message: "Database error"
                    });
                }

                res.json({
                    message:
                        "Email verified successfully"
                });
            }
        );
    });
};
*/


// NEW: Verify registration OTP
const verifyOTP = (req, res) => {

    const {
        email,
        otp
    } = req.body;

    if (!email || !otp) {

        return res.status(400).json({
            message:
                "Email and OTP are required"
        });
    }

    const otpData =
        registrationOTPs.get(email);

    if (!otpData) {

        return res.status(400).json({
            message:
                "OTP not found. Please send OTP again"
        });
    }

    if (Date.now() > otpData.expiry) {

        registrationOTPs.delete(email);

        return res.status(400).json({
            message:
                "OTP has expired. Please send OTP again"
        });
    }

    if (otpData.otp !== otp) {

        return res.status(400).json({
            message: "Invalid OTP"
        });
    }

    registrationOTPs.set(email, {
        ...otpData,
        verified: true
    });

    return res.json({
        message:
            "Email verified successfully"
    });
};


const forgotPassword = (req, res) => {

    const { email } = req.body;

    if (!email) {

        return res.status(400).json({
            message: "Email is required"
        });
    }

    const sql = `
        SELECT id, email, is_verified
        FROM users
        WHERE email = ?
    `;

    db.query(
        sql,
        [email],
        (err, results) => {

            if (err) {

                console.log(err);

                return res.status(500).json({
                    message: "Database error"
                });
            }

            if (results.length === 0) {

                return res.status(404).json({
                    message:
                        "Email not registered"
                });
            }

            const user = results[0];

            if (!user.is_verified) {

                return res.status(403).json({
                    message:
                        "Please verify your email first"
                });
            }

            const otp = Math.floor(
                100000 + Math.random() * 900000
            ).toString();

            const expiry = new Date(
                Date.now()  + 50 * 60 * 1000
            );

            const updateSql = `
                UPDATE users
                SET
                    reset_otp = ?,
                    reset_otp_expiry = ?
                WHERE email = ?
            `;

            db.query(
                updateSql,
                [otp, expiry, email],
                async (err) => {

                    if (err) {

                        console.log(err);

                        return res.status(500).json({
                            message:
                                "Database error"
                        });
                    }

                    try {

                        await sendOTPEmail(
                            email,
                            otp
                        );

                        res.json({
                            message:
                                "Password reset OTP sent to your email"
                        });

                    } catch (error) {

                        console.log(error);

                        res.status(500).json({
                            message:
                                `Failed to send OTP email ${error}`
                        });
                    }
                }
            );
        }
    );
};


const verifyResetOTP = (req, res) => {

    const {
        email,
        otp
    } = req.body;

    if (!email || !otp) {

        return res.status(400).json({
            message:
                "Email and OTP are required"
        });
    }

    const sql = `
        SELECT
            reset_otp,
            reset_otp_expiry
        FROM users
        WHERE email = ?
    `;

    db.query(
        sql,
        [email],
        (err, results) => {

            if (err) {

                console.log(err);

                return res.status(500).json({
                    message: "Database error"
                });
            }

            if (results.length === 0) {

                return res.status(404).json({
                    message: "User not found"
                });
            }

            const user = results[0];

            if (user.reset_otp !== otp) {

                return res.status(400).json({
                    message: "Invalid OTP"
                });
            }

            if (
                new Date() >
                new Date(user.reset_otp_expiry)
            ) {

                return res.status(400).json({
                    message: "OTP expired"
                });
            }

            res.json({
                message:
                    "OTP verified successfully"
            });
        }
    );
};


const resetPassword = async (req, res) => {

    const {
        email,
        password
    } = req.body;

    if (!email || !password) {

        return res.status(400).json({
            message:
                "Email and new password are required"
        });
    }

    if (password.length < 6) {

        return res.status(400).json({
            message:
                "Password must be at least 6 characters"
        });
    }

    const sql = `
        SELECT id
        FROM users
        WHERE email = ?
    `;

    db.query(
        sql,
        [email],
        async (err, results) => {

            if (err) {

                console.log(err);

                return res.status(500).json({
                    message: "Database error"
                });
            }

            if (results.length === 0) {

                return res.status(404).json({
                    message: "User not found"
                });
            }

            try {

                const hashedPassword =
                    await bcrypt.hash(
                        password,
                        10
                    );

                const updateSql = `
                    UPDATE users
                    SET
                        password = ?,
                        reset_otp = NULL,
                        reset_otp_expiry = NULL
                    WHERE email = ?
                `;

                db.query(
                    updateSql,
                    [
                        hashedPassword,
                        email
                    ],
                    (err) => {

                        if (err) {

                            console.log(err);

                            return res.status(500).json({
                                message:
                                    "Failed to reset password"
                            });
                        }

                        res.json({
                            message:
                                "Password reset successfully"
                        });
                    }
                );

            } catch (error) {

                console.log(error);

                res.status(500).json({
                    message:
                        "Password hashing failed"
                });
            }
        }
    );
};


const getUsers = (req, res) => {

    const sql = `
        SELECT
            id,
            name,
            email,
            address
        FROM users
    `;

    db.query(
        sql,
        (err, results) => {

            if (err) {

                console.log(err);

                return res.status(500).json({
                    message: "Database error"
                });
            }

            res.json(results);
        }
    );
};


const getUser = (req, res) => {

    const id =
        Number(req.params.id);

    const sql = `
        SELECT
            id,
            name,
            email,
            address
        FROM users
        WHERE id = ?
    `;

    db.query(
        sql,
        [id],
        (err, results) => {

            if (err) {

                console.log(err);

                return res.status(500).json({
                    message: "Database error"
                });
            }

            if (results.length === 0) {

                return res.status(404).json({
                    message: "User not found"
                });
            }

            res.json(results[0]);
        }
    );
};


const updateUser = async (req, res) => {

    const id =
        Number(req.params.id);

    if (req.user.id !== id) {

        return res.status(403).json({
            message:
                "You are not allowed to update this user"
        });
    }

    const {
        name,
        email,
        password,
        address
    } = req.body;

    if (!name) {

        return res.status(400).json({
            message: "Name is required"
        });
    }

    if (!email) {

        return res.status(400).json({
            message: "Email is required"
        });
    }

    if (!password) {

        return res.status(400).json({
            message: "Password is required"
        });
    }

    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {

        return res.status(400).json({
            message: "Invalid email"
        });
    }

    const hashedPassword =
        await bcrypt.hash(
            password,
            10
        );

    const sql = `
        UPDATE users
        SET
            name = ?,
            email = ?,
            password = ?,
            address = ?
        WHERE id = ?
    `;

    db.query(
        sql,
        [
            name,
            email,
            hashedPassword,
            address,
            id
        ],
        (err, result) => {

            if (err) {

                console.log(err);

                if (
                    err.code ===
                    "ER_DUP_ENTRY"
                ) {

                    return res.status(409).json({
                        message:
                            "Email already exists"
                    });
                }

                return res.status(500).json({
                    message:
                        "Database error"
                });
            }

            if (result.affectedRows === 0) {

                return res.status(404).json({
                    message:
                        "User not found"
                });
            }

            res.json({

                message:
                    "User updated successfully",

                id,
                name,
                email,
                address
            });
        }
    );
};


const deleteUser = (req, res) => {

    const id =
        Number(req.params.id);

    if (req.user.id !== id) {

        return res.status(403).json({
            message:
                "You are not allowed to delete this user"
        });
    }

    const sql =
        "DELETE FROM users WHERE id = ?";

    db.query(
        sql,
        [id],
        (err, result) => {

            if (err) {

                console.log(err);

                return res.status(500).json({
                    message:
                        "Database error"
                });
            }

            if (result.affectedRows === 0) {

                return res.status(404).json({
                    message:
                        "User not found"
                });
            }

            res.json({
                message:
                    "User deleted successfully"
            });
        }
    );
};


module.exports = {

    createUser,
    loginUser,
    getUsers,
    getUser,
    updateUser,
    deleteUser,
    sendTestEmail,

    // NEW
    sendRegistrationOTP,

    verifyOTP,
    forgotPassword,
    verifyResetOTP,
    resetPassword
};