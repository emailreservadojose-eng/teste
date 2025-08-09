// backend/src/routes/game.js
import { Router } from 'express';
import { db } from '../index.js';

const router = Router();

router.get('/definitions', async (req, res, next) => {
  try {
    const items = await db('items').select();
    const recipes = await db('recipes').select();
    const mobs = await db('mobs').select();
    res.json({ items, recipes, mobs });
  } catch (err) {
    next(err);
  }
});

export default router;
