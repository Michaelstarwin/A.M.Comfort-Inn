const serverless = require("serverless-http");

// adjust path if compiled JS is in dist
const app = require("../dist/app").default;

module.exports = serverless(app);
