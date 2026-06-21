const middleware = require('i18next-http-middleware');
const i18next = require('../i18n');

module.exports = middleware.handle(i18next);