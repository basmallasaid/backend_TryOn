const ApiKey = require("../models/ApiKey");

function maskKey(key) {
  if (!key || key.length <= 8) return "••••••••";
  return key.slice(0, 4) + "••••••••" + key.slice(-4);
}

exports.getAllApiKeys = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    const keys = await ApiKey.find({}).sort({ created_at: -1 });
    const masked = keys.map((k) => ({
      _id: k._id,
      name: k.name,
      service: k.service,
      maskedKey: maskKey(k.key),
      status: k.status,
      created_at: k.created_at,
      updated_at: k.updated_at,
    }));
    res.status(200).json(masked);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getApiKey = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    const { id } = req.params;
    const key = await ApiKey.findById(id);
    if (!key) {
      return res.status(404).json({ message: "API key not found" });
    }
    res.status(200).json({
      _id: key._id,
      name: key.name,
      service: key.service,
      key: key.key,
      maskedKey: maskKey(key.key),
      status: key.status,
      created_at: key.created_at,
      updated_at: key.updated_at,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateApiKey = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    const { id } = req.params;
    const { name, key, status } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (key !== undefined) update.key = key;
    if (status !== undefined) update.status = status;
    const doc = await ApiKey.findByIdAndUpdate(id, update, { new: true });
    if (!doc) {
      return res.status(404).json({ message: "API key not found" });
    }
    res.status(200).json({
      _id: doc._id,
      name: doc.name,
      service: doc.service,
      maskedKey: maskKey(doc.key),
      status: doc.status,
      updated_at: doc.updated_at,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteApiKey = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    const { id } = req.params;
    const doc = await ApiKey.findByIdAndDelete(id);
    if (!doc) {
      return res.status(404).json({ message: "API key not found" });
    }
    res.status(200).json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
