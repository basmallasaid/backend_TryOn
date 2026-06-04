const { Router } = require("express");
const { buildWardrobeItem, loadWardrobe, saveWardrobe, removeFromWardrobe } = require("../services/wardrobe.js");

const router = Router();

router.get("/", (_req, res) => {
  res.json({ items: loadWardrobe() });
});

router.post("/", (req, res) => {
  try {
    const { garment, image } = req.body;
    if (!garment) {
      return res.status(400).json({ error: "garment object is required" });
    }
    const item = buildWardrobeItem(garment, image || null);
    const wardrobe = loadWardrobe();
    wardrobe.push(item);
    saveWardrobe(wardrobe);
    res.status(201).json({ item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", (req, res) => {
  const wardrobe = loadWardrobe();
  const updated = removeFromWardrobe(wardrobe, req.params.id);
  if (updated.length === wardrobe.length) {
    return res.status(404).json({ error: "Item not found" });
  }
  saveWardrobe(updated);
  res.json({ success: true });
});

router.delete("/", (_req, res) => {
  saveWardrobe([]);
  res.json({ success: true });
});

module.exports = router;
