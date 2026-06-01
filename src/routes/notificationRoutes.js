const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");


router.post("/register", notificationController.registerToken);
router.get("/send-test", notificationController.sendToAll);
router.post("/tryon-ready", notificationController.sendTryOnReady);

module.exports = router;