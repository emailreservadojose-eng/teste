// backend/src/routes/player.js
import { Router } from 'express';
import { z } from 'zod';
import { db } from '../index.js';

const router = Router();

router.get('/me', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const profile = await db('player_profiles').where({ user_id: userId }).first();
    if (!profile) return res.status(404).json({ error: 'Perfil não encontrado' });

    const inventory = await db('inventories').where({ player_id: profile.id }).first();
    const items = await db('inventory_items').where({ inventory_id: inventory.id }).select();
    res.json({ profile, inventory: { id: inventory.id, items } });
  } catch (err) {
    next(err);
  }
});

const stateSchema = z.object({
  position_x: z.number().finite(),
  position_y: z.number().finite(),
  health: z.number().min(0).max(200),
  stamina: z.number().min(0).max(200),
  xp: z.number().min(0),
  level: z.number().min(1),
  world_id: z.number().min(1)
});

router.patch('/state', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const data = stateSchema.parse(req.body);
    const [profile] = await db('player_profiles')
      .where({ user_id: userId })
      .update({ ...data, updated_at: new Date() })
      .returning('*');
    res.json({ profile });
  } catch (err) {
    next(err);
  }
});

export default router;
