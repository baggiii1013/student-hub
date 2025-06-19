const {constants} = require("../constants")
const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode ? res.statusCode : 500;
  
  // Ensure we always send JSON response
  res.status(statusCode);
  
  switch (statusCode) {
      case constants.VALIDATION_ERROR:
        res.json({ 
          success: false,
          error: true,
          title: "Validation error", 
          message: err.message, 
          stackTrace: process.env.NODE_ENV === 'development' ? err.stack : undefined 
        });
        break;
    
      case constants.NOT_FOUND:
        res.json({ 
          success: false,
          error: true,
          title: "Not found", 
          message: err.message, 
          stackTrace: process.env.NODE_ENV === 'development' ? err.stack : undefined 
        });
        break;
    
      case constants.UNAUTHORIZED:
        res.json({ 
          success: false,
          error: true,
          title: "Unauthorized", 
          message: err.message, 
          stackTrace: process.env.NODE_ENV === 'development' ? err.stack : undefined 
        });
        break;
    
      case constants.FORBIDDEN:
        res.json({ 
          success: false,
          error: true,
          title: "Forbidden", 
          message: err.message, 
          stackTrace: process.env.NODE_ENV === 'development' ? err.stack : undefined 
        });
        break;
    
      case constants.SERVER_ERROR:
        res.json({ 
          success: false,
          error: true,
          title: "Server side error", 
          message: err.message, 
          stackTrace: process.env.NODE_ENV === 'development' ? err.stack : undefined 
        });
        break;
        
      default:
        res.json({ 
          success: false,
          error: true,
          title: "Unknown error", 
          message: err.message || "An unexpected error occurred", 
          stackTrace: process.env.NODE_ENV === 'development' ? err.stack : undefined 
        });
        break;
  }
};
module.exports = errorHandler;