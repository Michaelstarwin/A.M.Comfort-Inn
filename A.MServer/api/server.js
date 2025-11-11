const serverless = require("serverless-http");
// require compiled app from dist (make sure dist/app.js exists after tsc)
const app = require("../dist/app").default;
module.exports = serverless(app);
