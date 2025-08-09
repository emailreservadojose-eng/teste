// frontend/src/ui/auth.js
import { apiLogin, apiRegister, apiRefresh } from '../api/client.js';
import { loadPlayerState } from '../state/player.js';

export function initAuth(onSuccess) {
  const modal = document.getElementById('auth-modal');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');

  tabLogin.onclick = () => {
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    tabLogin.setAttribute('aria-selected', 'true');
    tabRegister.setAttribute('aria-selected', 'false');
  };

  tabRegister.onclick = () => {
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    tabRegister.setAttribute('aria-selected', 'true');
    tabLogin.setAttribute('aria-selected', 'false');
  };

  loginForm.onsubmit = async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const keep = document.getElementById('keep-logged').checked;
    try {
      const { accessToken, refreshToken } = await apiLogin(username, password);
      if (keep) localStorage.setItem('refreshToken', refreshToken);
      await loadPlayerState(accessToken);
      modal.classList.add('hidden');
      onSuccess();
    } catch (err) {
      document.getElementById('login-error').textContent = err.message || 'Erro ao entrar';
    }
  };

  registerForm.onsubmit = async (e) => {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    try {
      await apiRegister(username, password);
      tabLogin.click();
    } catch (err) {
      document.getElementById('register-error').textContent = err.message || 'Erro ao registrar';
    }
  };

  // Auto-login via refresh token
  const stored = localStorage.getItem('refreshToken');
  if (stored) {
    apiRefresh(stored)
      .then(({ accessToken }) => {
        loadPlayerState(accessToken).then(() => {
          modal.classList.add('hidden');
          onSuccess();
        });
      })
      .catch(() => {
        localStorage.removeItem('refreshToken');
      });
  }
}
