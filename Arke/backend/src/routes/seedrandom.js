// backend/src/utils/seedrandom.js
export default function seedrandom(seed) {
  // Pequeno PRNG determinístico (Mulberry32)
  let h = 1779033703 ^ seed.split('').reduce((a, c) => (a + c.charCodeAt(0)) | 0, 0);
  return function () {
    h |= 0;
    h = (h + 0x6D2B79F5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
