import { defineEventHandler, setHeader, setResponseStatus } from "h3";

export default defineEventHandler((event) => {
  // Handle CORS preflight
  if (event.method === "OPTIONS") {
    setResponseStatus(event, 204);
    setHeader(event, "Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "*");
    setHeader(event, "Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    setHeader(event, "Access-Control-Allow-Headers", "Content-Type, Authorization, x-bypass-auth");
    setHeader(event, "Access-Control-Allow-Credentials", "true");
    setHeader(event, "Access-Control-Max-Age", 86400);
    return "";
  }

  // Security headers for all responses
  setHeader(event, "X-Content-Type-Options", "nosniff");
  setHeader(event, "X-Frame-Options", "DENY");
  setHeader(event, "X-XSS-Protection", "1; mode=block");
  setHeader(event, "Referrer-Policy", "strict-origin-when-cross-origin");

  // CORS headers for API responses
  if (event.path?.startsWith("/api/")) {
    setHeader(event, "Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "*");
    setHeader(event, "Access-Control-Allow-Credentials", "true");
  }
});
