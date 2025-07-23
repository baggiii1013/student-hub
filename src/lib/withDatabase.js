import { createErrorResponse } from './auth';
import connectDB from './dbConnection';

/**
 * Higher-order function to wrap API routes with database connection
 * This ensures a database connection is established before the handler runs
 */
export function withDatabase(handler) {
  return async (request, context) => {
    let retries = 3;
    let lastError;

    while (retries > 0) {
      try {
        // Ensure database connection is established
        await connectDB();
        
        // Call the original handler
        return await handler(request, context);
      } catch (dbError) {
        lastError = dbError;
        retries--;
        
        console.error(`Database operation failed (retries left: ${retries}):`, dbError);
        
        // If it's a connection error, wait a bit before retrying
        if (retries > 0 && (
          dbError.name === 'MongoNetworkError' ||
          dbError.name === 'MongoServerSelectionError' ||
          dbError.message.includes('connection') ||
          dbError.message.includes('timeout')
        )) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries))); // Exponential backoff
          continue;
        }
        
        // If it's not a connection error or we're out of retries, break
        break;
      }
    }
    
    console.error('Database operation failed after all retries:', lastError);
    
    // Return a proper error response
    return createErrorResponse(
      'Database operation failed. Please try again later.',
      503
    );
  };
}

export default withDatabase;
