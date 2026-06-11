const handleWebhook = async (req, res) => {
  res.json({ received: true });
};

module.exports = { handleWebhook };
