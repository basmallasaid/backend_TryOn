const express = require("express");
const { submitContact, getAllContacts, markContactRead, deleteContact } = require("../controllers/contactController");
const protect = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/", submitContact);
router.get("/", protect, getAllContacts);
router.put("/:id/read", protect, markContactRead);
router.delete("/:id", protect, deleteContact);

module.exports = router;
