const express = require("express");
const router = express.Router();
const { reviewController } = require("../controllers/reviewController");

// POST /review
router.post("/", reviewController);

module.exports = router;
