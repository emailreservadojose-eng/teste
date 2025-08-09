// backend/db/seeds/001_seed.js
export async function seed(knex) {
  await knex('mobs').del();
  await knex('recipes').del();
  await knex('inventory_items').del();
  await knex('items').del();
  await knex('inventories').del();
  await knex('player_profiles').del();
  await knex('sessions').del();
  await knex('users').del();
  await knex('worlds').del();

  await knex('worlds').insert([{ seed: 'ARKÉ-SEED-001', name: 'Elyria' }]);

  const items = [
    { key: 'wood_branch', name: 'Galho de Madeira', rarity: 'comum', stack_size: 50, type: 'recurso', base_stats: { dano: 1, durabilidade: 20 }, craftable: false },
    { key: 'stone', name: 'Pedra', rarity: 'comum', stack_size: 50, type: 'recurso', base_stats: {}, craftable: false },
    { key: 'fiber', name: 'Fibra', rarity: 'comum', stack_size: 50, type: 'recurso', base_stats: {}, craftable: false },
    { key: 'raw_meat', name: 'Carne Crua', rarity: 'comum', stack_size: 20, type: 'comida', base_stats: {}, craftable: false },
    { key: 'wood_plank', name: 'Tábua de Madeira', rarity: 'comum', stack_size: 50, type: 'recurso', base_stats: {}, craftable: true },
    { key: 'stone_axe', name: 'Machado de Pedra', rarity: 'comum', stack_size: 1, type: 'arma', base_stats: { dano: 5, durabilidade: 40 }, craftable: true },
    { key: 'stone_pick', name: 'Picareta de Pedra', rarity: 'comum', stack_size: 1, type: 'arma', base_stats: { dano: 4, durabilidade: 40 }, craftable: true },
    { key: 'campfire', name: 'Fogueira', rarity: 'comum', stack_size: 5, type: 'construcao', base_stats: {}, craftable: true },
    { key: 'workbench', name: 'Bancada', rarity: 'comum', stack_size: 1, type: 'construcao', base_stats: {}, craftable: true },
    { key: 'cloth_armor', name: 'Roupa Leve', rarity: 'comum', stack_size: 1, type: 'armadura', base_stats: { def: 2 }, craftable: true }
  ];
  const createdItems = await knex('items').insert(items).returning('*');
  const idByKey = Object.fromEntries(createdItems.map((i) => [i.key, i.id]));

  const recipes = [
    { result_item_id: idByKey['stone_axe'], result_qty: 1, station: 'bancada', ingredients_json: [{ item: 'wood_branch', qty: 2 }, { item: 'stone', qty: 1 }] },
    { result_item_id: idByKey['stone_pick'], result_qty: 1, station: 'bancada', ingredients_json: [{ item: 'wood_branch', qty: 2 }, { item: 'stone', qty: 2 }] },
    { result_item_id: idByKey['workbench'], result_qty: 1, station: 'mao', ingredients_json: [{ item: 'wood_branch', qty: 4 }] },
    { result_item_id: idByKey['wood_plank'], result_qty: 2, station: 'bancada', ingredients_json: [{ item: 'wood_branch', qty: 2 }] },
    { result_item_id: idByKey['campfire'], result_qty: 1, station: 'mao', ingredients_json: [{ item: 'stone', qty: 4 }] },
    { result_item_id: idByKey['cloth_armor'], result_qty: 1, station: 'bancada', ingredients_json: [{ item: 'fiber', qty: 6 }] },
    { result_item_id: idByKey['wood_plank'], result_qty: 3, station: 'forja', ingredients_json: [{ item: 'wood_branch', qty: 2 }] },
    { result_item_id: idByKey['campfire'], result_qty: 1, station: 'fogueira', ingredients_json: [{ item: 'wood_branch', qty: 1 }, { item: 'stone', qty: 2 }] }
  ];
  await knex('recipes').insert(recipes);

  const mobs = [
    { key: 'wild_boar', name: 'Javali Selvagem', biome: JSON.stringify(['floresta', 'campo']), base_stats: { hp: 30, atk: 6, def: 1, speed: 1.2, xp: 12 }, behavior: { aggro_range: 6, flee_threshold: 0.15 } },
    { key: 'wolf', name: 'Lobo', biome: JSON.stringify(['montanha', 'floresta']), base_stats: { hp: 25, atk: 7, def: 1, speed: 1.5, xp: 14 }, behavior: { aggro_range: 7, flee_threshold: 0.1 } },
    { key: 'deer', name: 'Cervo', biome: JSON.stringify(['campo', 'floresta']), base_stats: { hp: 20, atk: 2, def: 0, speed: 1.8, xp: 8 }, behavior: { aggro_range: 0, flee_threshold: 0.8 } }
  ];
  await knex('mobs').insert(mobs);
}
