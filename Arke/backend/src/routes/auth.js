// backend/src/routes/auth.js
import { Router } from 'express';
import { z } from 'zod';
import { db } from '../index.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken
} from '../utils/jwt.js';
import crypto from 'crypto';

const router = Router();

const usernameRegex = /^[a-zA-Z0-9_]{3,16}$/;

const registerSchema = z.object({
  username: z.string().regex(usernameRegex, 'Username inválido'),
  password: z.string().min(6).max(64)
});

router.post('/register', async (req, res, next) => {
  try {
    const { username, password } = registerSchema.parse(req.body);
    const existing = await db('users').where({ username }).first();
    if (existing) return res.status(409).json({ error: 'Username já existe' });
    const password_hash = await hashPassword(password);
    const [user] = await db('users')
      .insert({ username, password_hash })
      .returning(['id', 'username', 'created_at']);
    // Create initial profile + inventory
    const [profile] = await db('player_profiles')
      .insert({
        user_id: user.id,
        level: 1,
        xp: 0,
        health: 100,
        stamina: 100,
        position_x: 0,
        position_y: 0,
        world_id: 1
      })
      .returning(['id']);
    await db('inventories').insert({ player_id: profile.id });

    res.status(201).json({ message: 'Conta criada com sucesso' });
  } catch (err) {
    next(err);
  }
});

const loginSchema = z.object({
  username: z.string(),
  password: z.string()
});

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = loginSchema.parse(req.body);
    const user = await db('users').where({ username }).first();
    if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });
    const ok = await comparePassword(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Credenciais inválidas' });

    const accessToken = createAccessToken(user.id);
    const refreshToken = createRefreshToken(user.id);
    const refreshHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const exp = new Date(Date.now() + (parseInt(process.env.JWT_REFRESH_EXPIRES_DAYS || '15', 10) * 86400000));
    await db('sessions').insert({
      user_id: user.id,
      refresh_token_hash: refreshHash,
      exp
    });

    res.json({ accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
});

const refreshSchema = z.object({
  refreshToken: z.string()
});

router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);
    const payload = verifyRefreshToken(refreshToken);
    const userId = Number(payload.sub);
    const refreshHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const session = await db('sessions')
      .where({ user_id: userId, refresh_token_hash: refreshHash })
      .andWhere('exp', '>', new Date())
      .first();
    if (!session) return res.status(401).json({ error: 'Sessão inválida' });

    // Rotate refresh token
    await db('sessions').where({ id: session.id }).del();
    const newRefreshToken = createRefreshToken(userId);
    const newHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
    const exp = new Date(Date.now() + (parseInt(process.env.JWT_REFRESH_EXPIRES_DAYS || '15', 10) * 86400000));
    await db('sessions').insert({ user_id: userId, refresh_token_hash: newHash, exp });

    const accessToken = createAccessToken(userId);
    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (err) {
    return res.status(401).json({ error: 'Refresh inválido' });
  }
});

const logoutSchema = z.object({
  refreshToken: z.string()
});

router.post('/logout', async (req, res, next) => {
  try {
    const { refreshToken } = logoutSchema.parse(req.body);
    const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await db('sessions').where({ refresh_token_hash: hash }).del();
    res.json({ message: 'Logout efetuado' });
  } catch (err) {
    next(err);
  }
});

export default router;
