const { Router } = require("express");
const protect = require("../middlewares/authMiddleware");
const {
  getWardrobe,
  addFromAnalysis,
  deleteItem,
  clearWardrobe,
} = require("../controllers/wardrobeController");

const router = Router();

router.use(protect);

router.get("/", getWardrobe);
router.post("/from-analysis", addFromAnalysis);
router.delete("/:id", deleteItem);
router.delete("/", clearWardrobe);

module.exports = router;
