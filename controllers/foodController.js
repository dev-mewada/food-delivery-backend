const db = require("../db");

const getFoods = (req, res) => {

    const sql = "SELECT * FROM fooddata";

    db.query(sql, (err, results) => {

        if (err) {
            console.log(err);

            return res.status(500).json({
                message: "Database error"
            });
        }

        res.json(results);
    });
};


const createFood = (req, res) => {

    const {
        foodimage,
        food_name,
        restaurant,
        description,
        rate,
        rating,
        category,
        today_special
    } = req.body;


    if (!food_name) {
        return res.status(400).json({
            message: "Food name is required"
        });
    }


    if (!restaurant) {
        return res.status(400).json({
            message: "Restaurant name is required"
        });
    }


    if (rate === undefined) {
        return res.status(400).json({
            message: "Rate is required"
        });
    }


    if (!category) {
        return res.status(400).json({
            message: "Category is required"
        });
    }


    const sql = `
        INSERT INTO fooddata
        (
            foodimage,
            food_name,
            restaurant,
            description,
            rate,
            rating,
            category,
            today_special
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;


    db.query(
        sql,
        [
            foodimage,
            food_name,
            restaurant,
            description,
            rate,
            rating,
            category,
            today_special
        ],
        (err, result) => {

            if (err) {
                console.log(err);

                return res.status(500).json({
                    message: "Database error"
                });
            }


            res.status(201).json({
                message: "Food created successfully",
                id: result.insertId,
                foodimage,
                food_name,
                restaurant,
                description,
                rate,
                rating,
                category,
                today_special
            });
        }
    );
};


module.exports = {
    getFoods,
    createFood
};