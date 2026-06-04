function extractKeys(req, res, next) {
  req.apiKeys = {
    HF_TOKEN: req.headers["x-hf-token"] || req.headers["x-huggingface-token"],
    KIE_API_KEY: req.headers["x-kie-api-key"],
  };
  next();
}

module.exports = { extractKeys };
