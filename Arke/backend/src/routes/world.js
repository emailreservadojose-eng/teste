// backend/src/routes/world.js
import { Router } from 'express';
import { z } from 'zod';
import seedrandom from '../utils/seedrandom.js';

const router = Router();

// Pseudo geração simples por seed e coords -> tile/bioma
function biomeAt(seed, gx, gy) {
  const rnd = seedrandom(seed + ':' + gx + ',' + gy);
  const v = rnd();
  if (v < 0.25) return 'campo';
  if (v < 0.5) return 'floresta';
  if (v < 0.75) return 'lago';
  return 'montanha';
}

const chunkSchema = z.object({
  x: z.coerce.number(),
  y: z.coerce.number()
});

router.get('/chunk', (req, res) => {
  const { x, y } = chunkSchema.parse(req.query);
  const seed = 'ARKÉ-SEED-001';
  const size = 32; // tiles por chunk
  const tiles = [];
  for (let ty = 0; ty < size; ty++) {
    const row = [];
    for (let tx = 0; tx < size; tx++) {
      const gx = x * size + tx;
      const gy = y * size + ty;
      const biome = biomeAt(seed, gx, gy);
      row.push({ biome, solid: biome === 'montanha' ? 1 : 0 });
    }
    tiles.push(row);
  }
  // spawns simples
  const spawns = [
    { key: 'wild_boar', x: size / 2, y: size / 2, biome: 'floresta' },
    { key: 'wolf', x: 5, y: 5, biome: 'montanha' },
    { key: 'deer', x: 20, y: 12, biome: 'campo' }
  ];
  res.json({ tiles, spawns });
});

export default router;
