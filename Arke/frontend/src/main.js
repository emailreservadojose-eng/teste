// frontend/src/main.js
import { initAuth } from './ui/auth.js';
import { initGame } from './game/engine/gameLoop.js';
import { loadAssets } from './game/engine/assets.js';

(async () => {
  await loadAssets();
  initAuth(async () => {
    await initGame();
  });
})();
