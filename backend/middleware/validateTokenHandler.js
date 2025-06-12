const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");

const validateToken = asyncHandler(async (req, res, next) => {
  let token;
  let authHeader = req.headers.Authorization || req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer")) {
    token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      req.user = decoded.user; // Assign decoded user to req.user
      console.log("Token has been validated");
      next();
    } catch (err) {
      res.status(401);
      throw new Error("User not authorized");
    }
  } else {
    res.status(401);
    throw new Error("No token, authorization denied");
  }
});

module.exports = validateToken;