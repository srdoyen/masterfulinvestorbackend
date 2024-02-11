const result = require("dotenv").config();
console.log(result); // Check if any error is reported
console.log(process.env); // Should include your .env variables

module.exports = {
  secretKey: "12345-67890-09876-54321",
  mongoUrl: "mongodb://localhost:27017/masterfulinvestor",
};
