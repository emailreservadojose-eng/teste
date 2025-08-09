// backend/src/routes/combat.js
import { Router } from 'express';
import { z } from 'zod';
import { db } from '../index.js';

const router = Router();

const attackSchema = z.object({
  mob_key: z.string(),
  mob_hp: z.number().min(0),
  player_pos: z.object({ x: z.number(), y: z.number() }),
  mob_pos: z.object({ x: z.number(), y: z.number() }),
  weapon_item_key: z.string().optional()
});

router.post('/attack', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { mob_key, mob_hp } = attackSchema.parse(req.body);

    const mob = await db('mobs').where({ key: mob_key }).first();
    if (!mob) return res.status(400).json({ error: 'Mob inexistente' });

    // valida/ajusta dano e recompensa
    let xpGain = mob.base_stats.xp || 5;
    let drops = []; // client usa tabelas de chance; servidor deve randomizar
    // simplificado: retorna dica de drop; client chama GET /game/definitions para mapear
    drops = [{ key: 'raw_meat', qty: 1 }];

    const profile = await db('player_profiles').where({ user_id: userId }).first();
    if (!profile) return res.status(404).json({ error: 'Perfil não encontrado' });

    if (mob_hp <= 0) {
      await db('player_profiles').where({ user_id: userId }).increment({ xp: xpGain });
    }

    res.json({ xpGain: mob_hp <= 0 ? xpGain : 0, drops });
  } catch (err) {
    next(err);
  }
});

export default router;
