const jwt = require('jsonwebtoken');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7InVzZXJuYW1lIjoiNzc2IiwiZW1haWwiOiIyMjAzMDUxMDUwNzc2QHBhcnVsdW5pdmVyc2l0eS5hYy5pbiIsImlkIjoiNjg2NmFiNzM4M2QwMzM0MjNmMjhlN2I0Iiwicm9sZSI6InN1cGVyQWRtaW4ifSwiaWF0IjoxNzUzMjA5ODAyLCJleHAiOjE3NTMyMjQyMDJ9.2L0wdlHa9ySoCyHb4S1jw7wNxjWpm9V9Wa0MpBG6YNU';
const secret = 'your-super-secret-jwt-key-change-this-in-production-12345';

try {
  const decoded = jwt.decode(token);
  console.log('Decoded token:', JSON.stringify(decoded, null, 2));
  
  const now = Math.floor(Date.now() / 1000);
  console.log('Current timestamp:', now);
  console.log('Token expires at:', decoded.exp);
  console.log('Is expired:', now > decoded.exp);
  console.log('Time difference (seconds):', now - decoded.exp);
  
  // Try to verify with secret
  const verified = jwt.verify(token, secret);
  console.log('Token is valid!');
  console.log('User:', verified.user);
} catch (error) {
  console.error('Token verification failed:', error.message);
}
