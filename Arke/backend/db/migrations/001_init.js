// backend/db/migrations/001_init.js
export async function up(knex) {
  await knex.schema.createTable('users', (t) => {
    t.increments('id').primary();
    t.string('username').unique().notNullable();
    t.string('password_hash').notNullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('sessions', (t) => {
    t.increments('id').primary();
    t.integer('user_id').references('users.id').onDelete('CASCADE');
    t.string('refresh_token_hash').notNullable();
    t.timestamp('exp').notNullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('worlds', (t) => {
    t.increments('id').primary();
    t.string('seed').notNullable();
    t.string('name').notNullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('player_profiles', (t) => {
    t.increments('id').primary();
    t.integer('user_id').references('users.id').onDelete('CASCADE');
    t.integer('level').notNullable().defaultTo(1);
    t.integer('xp').notNullable().defaultTo(0);
    t.integer('health').notNullable().defaultTo(100);
    t.integer('stamina').notNullable().defaultTo(100);
    t.float('position_x').notNullable().defaultTo(0);
    t.float('position_y').notNullable().defaultTo(0);
    t.integer('world_id').references('worlds.id');
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('inventories', (t) => {
    t.increments('id').primary();
    t.integer('player_id').references('player_profiles.id').onDelete('CASCADE');
  });

  await knex.schema.createTable('items', (t) => {
    t.increments('id').primary();
    t.string('key').unique().notNullable();
    t.string('name').notNullable();
    t.string('rarity').notNullable();
    t.integer('stack_size').notNullable().defaultTo(50);
    t.string('type').notNullable();
    t.jsonb('base_stats').defaultTo('{}');
    t.boolean('craftable').notNullable().defaultTo(false);
  });

  await knex.schema.createTable('inventory_items', (t) => {
    t.increments('id').primary();
    t.integer('inventory_id').references('inventories.id').onDelete('CASCADE');
    t.integer('item_id').references('items.id');
    t.integer('quantity').notNullable().defaultTo(1);
    t.integer('durability');
    t.integer('slot').notNullable(); // 0..29
  });

  await knex.schema.createTable('recipes', (t) => {
    t.increments('id').primary();
    t.integer('result_item_id').references('items.id');
    t.integer('result_qty').notNullable().defaultTo(1);
    t.string('station').notNullable();
    t.jsonb('ingredients_json').notNullable();
  });

  await knex.schema.createTable('mobs', (t) => {
    t.increments('id').primary();
    t.string('key').unique().notNullable();
    t.string('name').notNullable();
    t.string('biome').notNullable(); // csv ou json
    t.jsonb('base_stats').notNullable();
    t.jsonb('behavior').notNullable();
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('mobs');
  await knex.schema.dropTableIfExists('recipes');
  await knex.schema.dropTableIfExists('inventory_items');
  await knex.schema.dropTableIfExists('items');
  await knex.schema.dropTableIfExists('inventories');
  await knex.schema.dropTableIfExists('player_profiles');
  await knex.schema.dropTableIfExists('worlds');
  await knex.schema.dropTableIfExists('sessions');
  await knex.schema.dropTableIfExists('users');
}
