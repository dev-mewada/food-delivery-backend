const mysql = require("mysql2");
const fs = require("fs");
require("dotenv").config();

const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    ssl: {
        ca: fs.readFileSync("./ca.pem")
    },

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

db.getConnection((err, connection) => {
    if (err) {
        console.log("Database connection failed");
        console.log(err.message);
        return;
    }

    console.log("Aiven MySQL connected successfully");

    connection.release();
});

module.exports = db;


// const mysql = require("mysql2");
// const fs = require("fs");
// require("dotenv").config();

// const db = mysql.createConnection({
//     host: process.env.DB_HOST,
//     port: process.env.DB_PORT,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_NAME,

//     ssl: {
//         ca: fs.readFileSync("./ca.pem")
//     }
// });

// db.connect((err) => {
//     if (err) {
//         console.log("Database connection failed");
//         console.log(err.message);
//         return;
//     }

//     console.log("Aiven MySQL connected successfully");
// });

// module.exports = db;