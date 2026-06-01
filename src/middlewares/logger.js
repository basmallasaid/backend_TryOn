const logger = (req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} request to ${req.url}`);
  next(); // مهم جداً للانتقال للخطوة التالية
};

module.exports = logger;