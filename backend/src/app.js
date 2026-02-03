require("dotenv").config();
const express = require("express");
const cors = require("cors");
const reviewRoutes = require("./routes/review");

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => res.send("Backend running"));

app.use("/review", reviewRoutes);

module.exports = app;
