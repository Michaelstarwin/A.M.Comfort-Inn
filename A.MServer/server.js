const serverless = require("serverless-http");

// Import the compiled app
const app = require("./dist/app").default;

module.exports = serverless(app);