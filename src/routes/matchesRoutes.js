const { Router } = require("express");
const { findMatches } = require("../services/matching.js");
const { loadWardrobe } = require("../services/wardrobe.js");

const router = Router();

router.post("/", (req, res) => {
  try {
    const { garments } = req.body;
    if (!garments || !garments.length) {
      return res.status(400).json({ error: "garments array is required" });
    }

    const wardrobe = loadWardrobe();
    const matches = findMatches({ garments }, wardrobe);

    res.json({ matches });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
