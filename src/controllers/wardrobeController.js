const wardrobeService = require("../services/wardrobe");

const getWardrobe = async (req, res) => {
  try {
    const items = await wardrobeService.getUserWardrobe(req.user._id);
    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const addFromAnalysis = async (req, res) => {
  try {
    const { analysis_id, garment_index } = req.body;
    if (!analysis_id) {
      return res.status(400).json({ error: "analysis_id is required" });
    }

    const Analysis = require("../models/Analysis");
    const analysis = await Analysis.findOne({
      _id: analysis_id,
      user_id: req.user._id,
    });
    if (!analysis) {
      return res.status(404).json({ error: "Analysis not found" });
    }

    const items = await wardrobeService.addFromAnalysis(
      req.user._id, analysis, garment_index
    );
    res.status(201).json({ items });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message });
  }
};

const deleteItem = async (req, res) => {
  try {
    const deleted = await wardrobeService.deleteItem(req.user._id, req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Item not found" });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const clearWardrobe = async (req, res) => {
  try {
    await wardrobeService.clearUserWardrobe(req.user._id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getWardrobe,
  addFromAnalysis,
  deleteItem,
  clearWardrobe,
};
