const express = require("express");
const router = express.Router();
const travellerController = require("../controllers/travellerController");

router.post("/register", travellerController.register);
router.post("/login", travellerController.login);

module.exports = router;
