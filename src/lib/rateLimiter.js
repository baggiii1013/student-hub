// Simple rate limiter for API endpoints
class RateLimiter {
  constructor(windowMs = 60000, maxRequests = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.requests = new Map();
  }

  isAllowed(identifier) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Get or create request history for this identifier
    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, []);
    }
    
    const requestHistory = this.requests.get(identifier);
    
    // Remove old requests outside the window
    const validRequests = requestHistory.filter(timestamp => timestamp > windowStart);
    this.requests.set(identifier, validRequests);
    
    // Check if under the limit
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    // Add current request
    validRequests.push(now);
    return true;
  }

  cleanup() {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    for (const [identifier, requests] of this.requests.entries()) {
      const validRequests = requests.filter(timestamp => timestamp > windowStart);
      if (validRequests.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, validRequests);
      }
    }
  }

  getStats() {
    return {
      activeIdentifiers: this.requests.size,
      totalRequests: Array.from(this.requests.values()).reduce((sum, requests) => sum + requests.length, 0)
    };
  }
}

// Global rate limiter instances
const searchRateLimiter = new RateLimiter(60000, 1000); // 1000 requests per minute for search (increased for testing)
const generalRateLimiter = new RateLimiter(60000, 500); // 500 requests per minute for general APIs

// Cleanup function to run periodically
setInterval(() => {
  searchRateLimiter.cleanup();
  generalRateLimiter.cleanup();
}, 60000); // Cleanup every minute

export { generalRateLimiter, searchRateLimiter };

// Rate limiting middleware
export function withRateLimit(rateLimiter) {
  return function(handler) {
    return async function(request, context) {
      // Use IP address or user ID as identifier
      const forwardedFor = request.headers.get('x-forwarded-for');
      const ip = forwardedFor ? forwardedFor.split(',')[0] : 'unknown';
      const identifier = ip;

      if (!rateLimiter.isAllowed(identifier)) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Rate limit exceeded. Please try again later.',
            retryAfter: 60 
          }),
          { 
            status: 429, 
            headers: { 
              'Content-Type': 'application/json',
              'Retry-After': '60'
            } 
          }
        );
      }

      return handler(request, context);
    };
  };
}
