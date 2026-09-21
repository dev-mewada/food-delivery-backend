const express = require("express");

const router = express.Router();

const {
    getFoods,
    createFood
} = require("../controllers/foodController");

router.get("/", getFoods);

router.post("/", createFood);

module.exports = router;