const db = require("../db");

// Add food to cart
const addToCart = (req, res) => {
    const { user_id, food_id, quantity = 1 } = req.body;

    if (!user_id) {
        return res.status(400).json({
            message: "User ID is required"
        });
    }

    if (!food_id) {
        return res.status(400).json({
            message: "Food ID is required"
        });
    }

    if (quantity <= 0) {
        return res.status(400).json({
            message: "Quantity must be greater than 0"
        });
    }

    const checkFoodSql = `
        SELECT id
        FROM fooddata
        WHERE id = ?
    `;

    db.query(checkFoodSql, [food_id], (err, foodResult) => {
        if (err) {
            console.log(err);

            return res.status(500).json({
                message: "Database error"
            });
        }

        if (foodResult.length === 0) {
            return res.status(404).json({
                message: "Food not found"
            });
        }

        const sql = `
            INSERT INTO cart
            (user_id, food_id, quantity)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE
            quantity = quantity + ?
        `;

        db.query(
            sql,
            [user_id, food_id, quantity, quantity],
            (err, result) => {
                if (err) {
                    console.log(err);

                    return res.status(500).json({
                        message: "Database error"
                    });
                }

                res.status(201).json({
                    message: "Food added to cart successfully"
                });
            }
        );
    });
};


// Get user's cart
const getCart = (req, res) => {
    const { user_id } = req.query;

    if (!user_id) {
        return res.status(400).json({
            message: "User ID is required"
        });
    }

    const sql = `
        SELECT
            cart.id,
            cart.user_id,
            cart.food_id,
            cart.quantity,

            fooddata.food_name,
            fooddata.foodimage,
            fooddata.rate,
            fooddata.restaurant,
            fooddata.description,
            fooddata.rating,
            fooddata.category

        FROM cart

        JOIN fooddata
        ON cart.food_id = fooddata.id

        WHERE cart.user_id = ?
    `;

    db.query(sql, [user_id], (err, results) => {
        if (err) {
            console.log(err);

            return res.status(500).json({
                message: "Database error"
            });
        }

        res.json(results);
    });
};
// Update cart quantity
const updateCartQuantity = (req, res) => {
    const { food_id } = req.params;
    const { user_id, quantity } = req.body;

    if (!user_id) {
        return res.status(400).json({
            message: "User ID is required"
        });
    }

    if (!quantity || quantity <= 0) {
        return res.status(400).json({
            message: "Quantity must be greater than 0"
        });
    }

    const sql = `
        UPDATE cart
        SET quantity = ?
        WHERE user_id = ?
        AND food_id = ?
    `;

    db.query(
        sql,
        [quantity, user_id, food_id],
        (err, result) => {
            if (err) {
                console.log(err);

                return res.status(500).json({
                    message: "Database error"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Cart item not found"
                });
            }

            res.json({
                message: "Cart quantity updated successfully"
            });
        }
    );
};
// Remove food from cart
const removeFromCart = (req, res) => {
    const { food_id } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
        return res.status(400).json({
            message: "User ID is required"
        });
    }

    const sql = `
        DELETE FROM cart
        WHERE user_id = ?
        AND food_id = ?
    `;

    db.query(
        sql,
        [user_id, food_id],
        (err, result) => {
            if (err) {
                console.log(err);

                return res.status(500).json({
                    message: "Database error"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Cart item not found"
                });
            }

            res.json({
                message: "Food removed from cart successfully"
            });
        }
    );
};
// Clear all cart items
const clearCart = (req, res) => {
    const { user_id } = req.body;

    if (!user_id) {
        return res.status(400).json({
            message: "User ID is required"
        });
    }

    const sql = `
        DELETE FROM cart
        WHERE user_id = ?
    `;

    db.query(sql, [user_id], (err, result) => {
        if (err) {
            console.log(err);

            return res.status(500).json({
                message: "Database error"
            });
        }

        res.json({
            message: "Cart cleared successfully"
        });
    });
};
module.exports = {
    addToCart,
    getCart,
    updateCartQuantity,
    removeFromCart,
    clearCart
};