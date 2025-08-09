// backend/src/routes/craft.js
import { Router } from 'express';
import { z } from 'zod';
import { db } from '../index.js';

const router = Router();

const craftSchema = z.object({
  result_item_key: z.string(),
  qty: z.number().min(1),
  station: z.enum(['mao', 'bancada', 'forja', 'fogueira'])
});

router.post('/perform', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { result_item_key, qty, station } = craftSchema.parse(req.body);

    const profile = await db('player_profiles').where({ user_id: userId }).first();
    const inv = await db('inventories').where({ player_id: profile.id }).first();

    const item = await db('items').where({ key: result_item_key }).first();
    if (!item || !item.craftable) return res.status(400).json({ error: 'Item não craftável' });

    const recipe = await db('recipes')
      .where({ result_item_id: item.id, station })
      .first();
    if (!recipe) return res.status(400).json({ error: 'Receita inexistente nesta estação' });

    const ingredients = recipe.ingredients_json;
    // valida recursos
    for (const ing of ingredients) {
      const ingItem = await db('items').where({ key: ing.item }).first();
      const totalQty = (
        await db('inventory_items')
          .where({ inventory_id: inv.id, item_id: ingItem.id })
          .sum({ sum: 'quantity' })
      )[0].sum;
      if ((totalQty || 0) < ing.qty * qty)
        return res.status(400).json({ error: `Falta ${ing.item}` });
    }

    // operação atômica
    await db.transaction(async (trx) => {
      for (const ing of ingredients) {
        const ingItem = await trx('items').where({ key: ing.item }).first();
        let remaining = ing.qty * qty;
        const stacks = await trx('inventory_items')
          .where({ inventory_id: inv.id, item_id: ingItem.id })
          .orderBy('quantity', 'asc');
        for (const s of stacks) {
          const use = Math.min(remaining, s.quantity);
          if (use === s.quantity) await trx('inventory_items').where({ id: s.id }).del();
          else await trx('inventory_items').where({ id: s.id }).update({ quantity: s.quantity - use });
          remaining -= use;
          if (remaining <= 0) break;
        }
      }
      // add crafted
      const resultQty = recipe.result_qty * qty;
      // try stack merge into first free slot or existing stacks
      // simplificado: cria/empilha no primeiro stack ou novo slot disponível
      const existingStacks = await trx('inventory_items')
        .where({ inventory_id: inv.id, item_id: item.id })
        .orderBy('slot', 'asc');
      let toAdd = resultQty;
      const stackSize = item.stack_size || 50;
      for (const st of existingStacks) {
        const space = stackSize - st.quantity;
        if (space > 0) {
          const add = Math.min(space, toAdd);
          await trx('inventory_items').where({ id: st.id }).update({ quantity: st.quantity + add });
          toAdd -= add;
          if (toAdd <= 0) break;
        }
      }
      // new stacks as needed
      if (toAdd > 0) {
        // find free slots 0..29
        const taken = new Set(
          (await trx('inventory_items').where({ inventory_id: inv.id }).select('slot')).map((r) => r.slot)
        );
        for (let slot = 0; toAdd > 0 && slot < 30; slot++) {
          if (!taken.has(slot)) {
            const add = Math.min(stackSize, toAdd);
            await trx('inventory_items').insert({
              inventory_id: inv.id,
              item_id: item.id,
              quantity: add,
              durability: item.base_stats?.durabilidade || null,
              slot
            });
            toAdd -= add;
          }
        }
        if (toAdd > 0) throw new Error('Inventário cheio');
      }
      // XP por craft
      await trx('player_profiles')
        .where({ user_id: userId })
        .increment({ xp: Math.ceil(5 * qty) });
    });

    const items = await db('inventory_items').where({ inventory_id: inv.id });
    res.json({ items, message: 'Craft realizado' });
  } catch (err) {
    next(err);
  }
});

export default router;
