const express = require("express");
const db = require("./db");
const cors = require("cors");

const app = express();

app.use(express.json({ limit: "10mb" }));
app.use(cors());

const userRoutes = require("./routes/userRoutes");
const foodRoutes = require("./routes/foodRoutes");
const cartRoutes = require("./routes/cartRoutes");

app.use("/users", userRoutes);
app.use("/food", foodRoutes);
app.use("/cart", cartRoutes);

app.get("/test", (req, res) => {
  res.json({
    message: "API connected successfully"
  });
});

// app.listen(5000, () => {
//   console.log("Server is running on port 5000");
// });

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
});