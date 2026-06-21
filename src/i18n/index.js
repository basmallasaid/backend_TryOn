const i18next = require('i18next');
const Backend = require('i18next-fs-backend');
const middleware = require('i18next-http-middleware');
const path = require('path');

i18next
  .use(Backend)
  .use(middleware.LanguageDetector)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'ar'],
    preload: ['en', 'ar'],
    backend: {
      loadPath: path.join(__dirname, 'locales/{{lng}}/{{ns}}.json'),
    },
    detection: {
      order: ['header'],           // detect from Accept-Language header
      lookupHeader: 'accept-language',
      caches: false,
    },
    interpolation: {
      escapeValue: false,
    },
  });

module.exports = i18next;