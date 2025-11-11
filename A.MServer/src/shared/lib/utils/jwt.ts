import jwt, { Secret, SignOptions, VerifyErrors } from 'jsonwebtoken';
import dotenv from "dotenv";
import { sendErrorObj } from './errorObject';
import { Response } from 'express';
import { token_err } from './customErrorCode';
import { JwtPayload } from '../models/jwtModel';

dotenv.config();

export const generateJwtToken = (payload: JwtPayload): string => {
  const secretKey: Secret = (process.env.JWT_SECRET_KEY ?? "Roriri_Cafe") as Secret;
  const options: SignOptions = { expiresIn: '1h' };
  const token = jwt.sign(payload as Record<string, unknown>, secretKey, options);
  return token;
};

export const authenticateToken = (req: any, res: Response, next: any) => {
  const authHeader = req.headers.authorization ? req.headers.authorization : req.query.token;
  if (!authHeader) {
    return sendErrorObj(res, token_err, "Token Not Found!");
  }

  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return sendErrorObj(res, token_err, "Token Not Found!");
  }

  const secretKey: Secret = (process.env.JWT_SECRET_KEY ?? "Roriri_Cafe") as Secret;

  jwt.verify(token, secretKey, (err: VerifyErrors | null, decoded: object | string | undefined) => {
    if (err) {
      // send a string message (not the VerifyErrors object)
      const message = err && typeof err.message === 'string' ? err.message : String(err);
      return sendErrorObj(res, token_err, message);
    }

    // decoded can be a string (if original payload was a string) or an object
    let user: JwtPayload | null = null;
    if (!decoded) {
      return sendErrorObj(res, token_err, "Invalid token payload");
    } else if (typeof decoded === 'string') {
      try {
        user = JSON.parse(decoded) as JwtPayload;
      } catch {
        // fallback: put the raw string in user object so downstream doesn't crash
        user = { sub: decoded } as unknown as JwtPayload;
      }
    } else {
      user = decoded as JwtPayload;
    }

    req.user = user;

    if (user && typeof user === 'object' && 'exp' in user && typeof (user as any).exp === 'number') {
      if (Date.now() >= (user as any).exp * 1000) {
        return sendErrorObj(res, 'TOKEN_EXP', "Token Expired!");
      }
    }

    return next();
  });
};
