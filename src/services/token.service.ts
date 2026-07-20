import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";

export function signAuthToken(userId: string, loginId: string): string {
  return jwt.sign({ sub: userId, loginId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  });
}
