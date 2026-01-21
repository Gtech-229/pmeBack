import rateLimit, { RateLimitRequestHandler } from "express-rate-limit";



/**
 * Factory de rate limiter
 * @param maxRequests nombre max de requêtes
 * @param minutes fenêtre de temps en minutes
 */
export function createRateLimiter(
  maxRequests: number,
  minutes: number
):RateLimitRequestHandler {
  return rateLimit({
    windowMs: minutes * 60 * 1000,
    max: maxRequests,
    
    standardHeaders: true, // RateLimit-*
    legacyHeaders: false,  // X-RateLimit-*
    ipv6Subnet : 56,
   

    handler: (req, res) => {

       console.warn(
    `[RATE LIMIT] ${req.ip} ${req.method} ${req.originalUrl}`
  );

  res.status(429).json({
    error: "Trop de requetes",
    message: `Limite des ${maxRequests} requetes par ${minutes} minute(s) dépassée. Réessayez dans plus tard`,
  });
      
    },
  });
}
