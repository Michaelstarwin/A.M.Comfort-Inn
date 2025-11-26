const serverless = require("serverless-http");

try {
  const app = require("./dist/app").default;
  
  if (!app) {
    throw new Error("App not found or not exported properly");
  }
  
  module.exports = serverless(app);
} catch (error) {
  console.error("Error loading app:", error);
  module.exports = (req, res) => {
    res.status(500).json({ 
      error: "Server initialization failed", 
      message: error.message 
    });
  };
}