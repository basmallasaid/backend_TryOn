function extractKeys(req, res, next) {
  req.apiKeys = {
    HF_TOKEN: req.headers["x-hf-token"] || req.headers["x-huggingface-token"],
    KIE_API_KEY: req.headers["x-kie-api-key"],
    DASHSCOPE_API_KEY: req.headers["x-dashscope-api-key"],
    GITHUB_TOKEN: req.headers["x-github-token"],
  };
  next();
}

module.exports = { extractKeys };
