// frontend/src/state/player.js
import { apiGetPlayer, setAccessToken } from '../api/client.js';

export let player = null;
export let inventory = [];

export async function loadPlayerState(token) {
  setAccessToken(token);
  const data = await apiGetPlayer();
  player = data.profile;
  inventory = data.inventory.items;
}
