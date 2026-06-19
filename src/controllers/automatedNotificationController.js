const AutomatedNotification = require('../models/AutomatedNotification');

exports.getAll = async (req, res) => {
  try {
    const items = await AutomatedNotification.find().sort('operation');
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { enabled, titleTemplate, bodyTemplate, channels } = req.body;
    const item = await AutomatedNotification.findOneAndUpdate(
      { operation: req.params.operation },
      { enabled, titleTemplate, bodyTemplate, channels },
      { new: true, runValidators: true, upsert: true },
    );
    if (!item) {
      return res.status(404).json({ error: 'Operation not found' });
    }
    res.json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};