const express = require("express");
const router = express.Router();

const {
  addToCart,
  getCart,
  updateCartQuantity,
  removeFromCart,
  clearCart
} = require("../controllers/cartController");

router.post("/", addToCart);

router.get("/", getCart);

router.put("/:food_id", updateCartQuantity);

router.delete("/clear", clearCart);

router.delete("/:food_id", removeFromCart);

module.exports = router;