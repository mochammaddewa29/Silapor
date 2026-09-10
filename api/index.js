const imported = require('../backend/src/app');
const app = (imported && imported.app) ? imported.app : imported;

module.exports = app;
