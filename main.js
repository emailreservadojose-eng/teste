import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js';

// -----------------------------
// Basic setup
// -----------------------------
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b1020);
scene.fog = new THREE.Fog(0x0b1020, 60, 180);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 12, 18);

// Lights
const hemiLight = new THREE.HemisphereLight(0xbfd4ff, 0x0d0f12, 0.7);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
dirLight.position.set(12, 22, 8);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(2048, 2048);
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 120;
dirLight.shadow.camera.left = -40;
dirLight.shadow.camera.right = 40;
dirLight.shadow.camera.top = 40;
dirLight.shadow.camera.bottom = -40;
scene.add(dirLight);

// Ground
const groundSize = 240;
const groundGeo = new THREE.PlaneGeometry(groundSize, groundSize);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x0f162d, roughness: 1 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const grid = new THREE.GridHelper(groundSize, groundSize / 4, 0x22406a, 0x14243f);
scene.add(grid);

// -----------------------------
// Player
// -----------------------------
const playerRadius = 1.1;
const player = new THREE.Mesh(
  new THREE.SphereGeometry(playerRadius, 32, 16),
  new THREE.MeshStandardMaterial({ color: 0x4caf50, metalness: 0.1, roughness: 0.6 })
);
player.position.y = playerRadius + 0.01;
player.castShadow = true;
scene.add(player);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.enablePan = false;
controls.minDistance = 10;
controls.maxDistance = 40;
controls.minPolarAngle = Math.PI * 0.2;
controls.maxPolarAngle = Math.PI * 0.49;
controls.target.copy(player.position);

// -----------------------------
// Game objects
// -----------------------------
const FIELD = 90; // logical bounds inside ground
let coins = [];
let obstacles = [];
const tempVec3 = new THREE.Vector3();

function createCoin(position) {
  const coin = new THREE.Mesh(
    new THREE.TorusGeometry(1, 0.35, 12, 24),
    new THREE.MeshStandardMaterial({ color: 0xffd166, emissive: 0x4d3700, emissiveIntensity: 0.25 })
  );
  coin.position.copy(position);
  coin.position.y = 1.4;
  coin.rotation.x = Math.PI / 2;
  coin.castShadow = true;
  coin.receiveShadow = false;
  coin.userData.type = 'coin';
  scene.add(coin);
  return coin;
}

function createObstacle(position, size = 3 + Math.random() * 2) {
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(size, size, size),
    new THREE.MeshStandardMaterial({ color: 0xfb7185, metalness: 0.2, roughness: 0.5 })
  );
  box.castShadow = true;
  box.receiveShadow = true;
  box.position.copy(position);
  box.userData.type = 'obstacle';
  box.userData.base = position.clone();
  box.userData.omega = 0.4 + Math.random() * 0.6; // angular speed
  box.userData.amp = 10 + Math.random() * 16; // amplitude of motion
  box.userData.axis = new THREE.Vector3(Math.round(Math.random()) ? 1 : 0, 0, Math.round(Math.random()) ? 1 : 0).normalize();
  scene.add(box);
  return box;
}

function randomPosition(margin = 6) {
  const x = THREE.MathUtils.randFloatSpread(FIELD - margin * 2);
  const z = THREE.MathUtils.randFloatSpread(FIELD - margin * 2);
  return new THREE.Vector3(x, 0, z);
}

function resetGame() {
  coins.forEach(o => scene.remove(o));
  obstacles.forEach(o => scene.remove(o));
  coins = [];
  obstacles = [];

  for (let i = 0; i < 18; i++) {
    const p = randomPosition();
    coins.push(createCoin(p));
  }
  for (let i = 0; i < 7; i++) {
    const p = randomPosition();
    p.y = 1.5 + Math.random() * 2;
    obstacles.push(createObstacle(p));
  }

  player.position.set(0, playerRadius + 0.01, 0);
  velocity.set(0, 0, 0);
  score = 0;
  startTime = performance.now();
  updateHUD();
}

// -----------------------------
// Input
// -----------------------------
const keys = { forward: false, back: false, left: false, right: false };

window.addEventListener('keydown', (e) => {
  switch (e.code) {
    case 'ArrowUp':
    case 'KeyW': keys.forward = true; break;
    case 'ArrowDown':
    case 'KeyS': keys.back = true; break;
    case 'ArrowLeft':
    case 'KeyA': keys.left = true; break;
    case 'ArrowRight':
    case 'KeyD': keys.right = true; break;
  }
});
window.addEventListener('keyup', (e) => {
  switch (e.code) {
    case 'ArrowUp':
    case 'KeyW': keys.forward = false; break;
    case 'ArrowDown':
    case 'KeyS': keys.back = false; break;
    case 'ArrowLeft':
    case 'KeyA': keys.left = false; break;
    case 'ArrowRight':
    case 'KeyD': keys.right = false; break;
  }
});

// -----------------------------
// Movement and camera
// -----------------------------
const clock = new THREE.Clock();
const velocity = new THREE.Vector3();
const moveSpeed = 16; // units per second
const friction = 10; // decay when no input

function updatePlayer(delta) {
  const input = new THREE.Vector3(
    (keys.right ? 1 : 0) - (keys.left ? 1 : 0),
    0,
    (keys.back ? 1 : 0) - (keys.forward ? 1 : 0)
  );

  if (input.lengthSq() > 0) {
    input.normalize();
    velocity.x = THREE.MathUtils.damp(velocity.x, input.x * moveSpeed, 12, delta);
    velocity.z = THREE.MathUtils.damp(velocity.z, input.z * moveSpeed, 12, delta);
  } else {
    velocity.x = THREE.MathUtils.damp(velocity.x, 0, friction, delta);
    velocity.z = THREE.MathUtils.damp(velocity.z, 0, friction, delta);
  }

  player.position.addScaledVector(velocity, delta);

  // clamp inside field
  player.position.x = THREE.MathUtils.clamp(player.position.x, -FIELD * 0.5, FIELD * 0.5);
  player.position.z = THREE.MathUtils.clamp(player.position.z, -FIELD * 0.5, FIELD * 0.5);

  // face moving direction (optional)
  if (velocity.lengthSq() > 0.001) {
    const angle = Math.atan2(velocity.x, velocity.z);
    player.rotation.y = THREE.MathUtils.damp(player.rotation.y, angle, 10, delta);
  }

  // camera follow via orbit target
  controls.target.lerp(player.position, 1 - Math.pow(0.001, delta));
}

// -----------------------------
// Collisions and game logic
// -----------------------------
let running = false;
let score = 0;
let startTime = performance.now();

const scoreEl = document.getElementById('score');
const timeEl = document.getElementById('time');
const overlayEl = document.getElementById('overlay');
const startBtn = document.getElementById('startBtn');

function updateHUD() {
  scoreEl.textContent = String(score);
  const t = (performance.now() - startTime) / 1000;
  timeEl.textContent = t.toFixed(1);
}

function playBeep(f = 880, ms = 120) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = f;
    o.connect(g);
    g.connect(ctx.destination);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + ms / 1000);
    o.start();
    setTimeout(() => { o.stop(); ctx.close(); }, ms + 20);
  } catch (_) {}
}

function checkCollisions(delta) {
  // coin pickup
  for (let i = coins.length - 1; i >= 0; i--) {
    const c = coins[i];
    const d = c.position.distanceTo(player.position);
    if (d < playerRadius + 1.1) {
      scene.remove(c);
      coins.splice(i, 1);
      score += 1;
      playBeep(1046);
      updateHUD();
      if (coins.length === 0) {
        running = false;
        showOverlay(`Parabéns! Você coletou todas as moedas em ${timeEl.textContent}s.`);
      }
    }
  }

  // obstacle hit -> small penalty and knockback
  for (let i = 0; i < obstacles.length; i++) {
    const o = obstacles[i];
    const approxRadius = (o.geometry.parameters.width || 3) * 0.65;
    const d = o.position.distanceTo(player.position);
    if (d < playerRadius + approxRadius) {
      playBeep(220, 180);
      const away = tempVec3.subVectors(player.position, o.position).setY(0).normalize();
      player.position.addScaledVector(away, 4);
      score = Math.max(0, score - 1);
      updateHUD();
    }
  }
}

function updateObstacles(t, delta) {
  for (let i = 0; i < obstacles.length; i++) {
    const o = obstacles[i];
    const w = o.userData.omega;
    const A = o.userData.amp;
    const axis = o.userData.axis;
    o.position.x = o.userData.base.x + Math.sin(t * w + i) * A * axis.x;
    o.position.z = o.userData.base.z + Math.cos(t * w + i * 1.37) * A * axis.z;
    o.rotation.y += delta * 0.8;
  }
}

function updateCoins(delta) {
  for (let i = 0; i < coins.length; i++) {
    const c = coins[i];
    c.rotation.z += delta * 1.6;
    c.position.y = 1.2 + Math.sin((performance.now() + i * 120) * 0.004) * 0.15;
  }
}

function showOverlay(messageHtml) {
  overlayEl.querySelector('p').innerHTML = messageHtml;
  overlayEl.classList.add('visible');
}

function hideOverlay() {
  overlayEl.classList.remove('visible');
}

startBtn.addEventListener('click', () => {
  hideOverlay();
  running = true;
  resetGame();
});

window.addEventListener('blur', () => { running = false; showOverlay('Jogo pausado. Clique em "Começar" para retomar.'); });

// -----------------------------
// Main loop
// -----------------------------
resetGame();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const t = performance.now() / 1000;

  updateCoins(delta);
  updateObstacles(t, delta);

  if (running) {
    updatePlayer(delta);
    checkCollisions(delta);
    updateHUD();
  }

  controls.update();
  renderer.render(scene, camera);
}
animate();

// -----------------------------
// Resize
// -----------------------------
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});