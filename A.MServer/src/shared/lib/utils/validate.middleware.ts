import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

/**
 * Middleware to validate the request's body, query, and params
 * against a provided Zod schema.
 *
 * If validation fails, it passes the error to the
 * global error handler (in index.ts) to be formatted and returned.
 */
export const validate = (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      // Parse the incoming request data against the schema.
      // The schema should be structured to expect an object with
      // optional body, query, and params properties.
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      
      // If validation is successful, proceed to the next middleware or route handler.
      next();
    } catch (err: any) {
      // If validation fails, Zod throws an error. We pass it to our global error handler.
      next(err);
    }
  };
