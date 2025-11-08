import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = "https://oqbzbvkbqzpcuivsahkx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xYnpidmticXpwY3VpdnNhaGt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2MDk2MTMsImV4cCI6MjA3NDE4NTYxM30._bAXsOuz-xPbALqK9X0R5QKNZcwSzKCats3vMTfDGWs";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form');
  if (!form) return;

  const emailEl = document.getElementById('email');
  const passwordEl = document.getElementById('password');

  let errorEl = document.getElementById('error-msg');
  if (!errorEl) {
    errorEl = document.createElement('p');
    errorEl.id = 'error-msg';
    errorEl.style.color = 'red';
    errorEl.style.fontSize = '0.9rem';
    errorEl.style.marginTop = '5px';
    form.appendChild(errorEl);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.textContent = '';

    const email = emailEl?.value.trim() || '';
    const password = passwordEl?.value || '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !password) {
      errorEl.textContent = 'Please enter both email and password.';
      return;
    }

    if (!emailRegex.test(email)) {
      errorEl.textContent = 'Please enter a valid email address.';
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        console.error('[login] error', error);
        errorEl.textContent = 'Login failed. Please check your TuneVault credentials.';
        return;
      }

      window.location.href = 'index.html';
    } catch (err) {
      console.error('[login] unexpected error', err);
      errorEl.textContent = 'Unexpected error. See console for details.';
    }
  });
});
