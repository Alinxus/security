import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export interface RequestWithId extends Request {
  id: string;
}

export const requestLogger = (req: RequestWithId, res: Response, next: NextFunction): void => {
  // Generate unique request ID
  req.id = uuidv4();
  
  // Add request ID to response headers
  res.setHeader('X-Request-ID', req.id);
  
  const start = Date.now();
  const { method, url, ip } = req;
  
  console.log(`📥 ${method} ${url} - IP: ${ip} - ID: ${req.id} - Started`);
  
  // Override res.end to log response details
  const originalEnd = res.end.bind(res);
  res.end = function(chunk?: any, encoding?: any) {
    const duration = Date.now() - start;
    const { statusCode } = res;
    
    // Log response
    const logLevel = statusCode >= 400 ? '❌' : '✅';
    console.log(`${logLevel} ${method} ${url} - ${statusCode} - ${duration}ms - ID: ${req.id}`);
    
    // Call original end method
    return originalEnd(chunk, encoding);
  };
  
  next();
};
