// backend/src/utils/jwt.js
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export const createAccessToken = (userId) => {
  const exp = parseInt(process.env.JWT_ACCESS_EXPIRES || '900', 10);
  const token = jwt.sign({ scope: ['player'] }, process.env.JWT_ACCESS_SECRET, {
    subject: String(userId),
    expiresIn: exp
  });
  return token;
};

export const createRefreshToken = (userId) => {
  const days = parseInt(process.env.JWT_REFRESH_EXPIRES_DAYS || '15', 10);
  const token = jwt.sign({ type: 'refresh' }, process.env.JWT_REFRESH_SECRET, {
    subject: String(userId),
    expiresIn: `${days}d`
  });
  return token;
};

export const verifyRefreshToken = (token) =>
  jwt.verify(token, process.env.JWT_REFRESH_SECRET);
