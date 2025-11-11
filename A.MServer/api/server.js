const serverless = require("serverless-http");

// safe import (works whether app exports default or not)
const mod = require("../dist/app");
const app = mod.default || mod;

module.exports = serverless(app);
