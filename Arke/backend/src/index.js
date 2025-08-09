// backend/src/index.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import knex from 'knex';
import knexConfig from '../knexfile.js';

import authRoutes from './routes/auth.js';
import playerRoutes from './routes/player.js';
import inventoryRoutes from './routes/inventory.js';
import craftRoutes from './routes/craft.js';
import combatRoutes from './routes/combat.js';
import gameRoutes from './routes/game.js';
import worldRoutes from './routes/world.js';

import { authMiddleware } from './middlewares/auth.js';
import { errorHandler } from './middlewares/error.js';

dotenv.config();

export const db = knex(knexConfig);

const app = express();
app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
  })
);
app.use(
  morgan('dev', {
    skip: () => process.env.NODE_ENV === 'test'
  })
);

// Rate limits
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Muitas requisições de autenticação. Tente novamente em alguns minutos.'
});
const combatLimiter = rateLimit({
  windowMs: 10 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Muitas ações de combate. Aguarde um momento.'
});

// Routes
app.use('/auth', authLimiter, authRoutes);
app.use('/game', gameRoutes);
app.use('/world', worldRoutes);

// Protected routes
app.use('/player', authMiddleware, playerRoutes);
app.use('/inventory', authMiddleware, inventoryRoutes);
app.use('/craft', authMiddleware, craftRoutes);
app.use('/combat', authMiddleware, combatLimiter, combatRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 4000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => console.log(`Backend rodando na porta ${PORT}`));
}

export default app;
