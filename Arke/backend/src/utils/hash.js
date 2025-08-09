// backend/src/utils/hash.js
import bcrypt from 'bcrypt';
export const hashPassword = (pwd) => bcrypt.hash(pwd, 11);
export const comparePassword = (pwd, hash) => bcrypt.compare(pwd, hash);
