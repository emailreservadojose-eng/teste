// backend/src/routes/inventory.js
import { Router } from 'express';
import { z } from 'zod';
import { db } from '../index.js';

const router = Router();

const moveSchema = z.object({
  from_slot: z.number().min(0),
  to_slot: z.number().min(0),
  quantity: z.number().min(1)
});

router.post('/move', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { from_slot, to_slot, quantity } = moveSchema.parse(req.body);

    const profile = await db('player_profiles').where({ user_id: userId }).first();
    const inv = await db('inventories').where({ player_id: profile.id }).first();

    const fromItem = await db('inventory_items')
      .where({ inventory_id: inv.id, slot: from_slot })
      .first();

    if (!fromItem || fromItem.quantity < quantity)
      return res.status(400).json({ error: 'Quantidade inválida' });

    const toItem = await db('inventory_items')
      .where({ inventory_id: inv.id, slot: to_slot })
      .first();

    if (!toItem) {
      if (fromItem.quantity === quantity) {
        await db('inventory_items')
          .where({ id: fromItem.id })
          .update({ slot: to_slot });
      } else {
        await db('inventory_items').insert({
          inventory_id: inv.id,
          item_id: fromItem.item_id,
          quantity,
          durability: fromItem.durability,
          slot: to_slot
        });
        await db('inventory_items')
          .where({ id: fromItem.id })
          .update({ quantity: fromItem.quantity - quantity });
      }
    } else {
      // stack if same item
      if (toItem.item_id === fromItem.item_id) {
        await db('inventory_items')
          .where({ id: toItem.id })
          .update({ quantity: toItem.quantity + quantity });
        if (fromItem.quantity === quantity) {
          await db('inventory_items').where({ id: fromItem.id }).del();
        } else {
          await db('inventory_items')
            .where({ id: fromItem.id })
            .update({ quantity: fromItem.quantity - quantity });
        }
      } else {
        // swap if different
        await db.transaction(async (trx) => {
          await trx('inventory_items').where({ id: fromItem.id }).update({ slot: to_slot });
          await trx('inventory_items').where({ id: toItem.id }).update({ slot: from_slot });
        });
      }
    }

    const items = await db('inventory_items').where({ inventory_id: inv.id });
    res.json({ items });
  } catch (err) {
    next(err);
  }
});

const splitSchema = z.object({
  from_slot: z.number().min(0),
  to_slot: z.number().min(0),
  quantity: z.number().min(1)
});

router.post('/split', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { from_slot, to_slot, quantity } = splitSchema.parse(req.body);
    const profile = await db('player_profiles').where({ user_id: userId }).first();
    const inv = await db('inventories').where({ player_id: profile.id }).first();
    const fromItem = await db('inventory_items')
      .where({ inventory_id: inv.id, slot: from_slot })
      .first();

    if (!fromItem || fromItem.quantity <= quantity)
      return res.status(400).json({ error: 'Impossível dividir' });

    const toItem = await db('inventory_items')
      .where({ inventory_id: inv.id, slot: to_slot })
      .first();
    if (toItem) return res.status(400).json({ error: 'Slot destino ocupado' });

    await db('inventory_items').insert({
      inventory_id: inv.id,
      item_id: fromItem.item_id,
      quantity,
      durability: fromItem.durability,
      slot: to_slot
    });
    await db('inventory_items')
      .where({ id: fromItem.id })
      .update({ quantity: fromItem.quantity - quantity });

    const items = await db('inventory_items').where({ inventory_id: inv.id });
    res.json({ items });
  } catch (err) {
    next(err);
  }
});

const dropSchema = z.object({
  from_slot: z.number().min(0),
  quantity: z.number().min(1)
});

router.post('/drop', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { from_slot, quantity } = dropSchema.parse(req.body);
    const profile = await db('player_profiles').where({ user_id: userId }).first();
    const inv = await db('inventories').where({ player_id: profile.id }).first();
    const item = await db('inventory_items')
      .where({ inventory_id: inv.id, slot: from_slot })
      .first();
    if (!item || item.quantity < quantity)
      return res.status(400).json({ error: 'Quantidade inválida' });

    if (item.quantity === quantity) {
      await db('inventory_items').where({ id: item.id }).del();
    } else {
      await db('inventory_items')
        .where({ id: item.id })
        .update({ quantity: item.quantity - quantity });
    }

    const items = await db('inventory_items').where({ inventory_id: inv.id });
    res.json({ items });
  } catch (err) {
    next(err);
  }
});

export default router;
