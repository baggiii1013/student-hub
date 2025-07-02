import { createErrorResponse } from './auth';
import connectDB from './dbConnection';

/**
 * Higher-order function to wrap API routes with database connection
 * This ensures a database connection is established before the handler runs
 */
export function withDatabase(handler) {
  return async (request, context) => {
    try {
      // Ensure database connection is established
      await connectDB();
      
      // Call the original handler
      return await handler(request, context);
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      
      // Return a proper error response
      return createErrorResponse(
        'Database connection failed. Please try again later.',
        503
      );
    }
  };
}

export default withDatabase;
