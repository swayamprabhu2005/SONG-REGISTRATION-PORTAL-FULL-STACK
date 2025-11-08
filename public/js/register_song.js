// /js/register_song.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = "https://oqbzbvkbqzpcuivsahkx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xYnpidmticXpwY3VpdnNhaGt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2MDk2MTMsImV4cCI6MjA3NDE4NTYxM30._bAXsOuz-xPbALqK9X0R5QKNZcwSzKCats3vMTfDGWs";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUserEmail = null;

document.addEventListener('DOMContentLoaded', () => {

  // Fetch login email
  (async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) currentUserEmail = user.email;
    } catch (err) {
      console.warn('Supabase getUser error:', err);
    }
  })();

  // Dynamic fields
  function createDynamicFields(count, containerId, fieldArrayName, placeholderText) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";
    count = parseInt(count) || 0;
    if (count <= 0) return;

    for (let i = 0; i < count; i++) {
      const wrapper = document.createElement('div');
      wrapper.className = 'dynamic-row';

      const input = document.createElement('input');
      input.type = 'text';
      input.name = `${fieldArrayName}[]`;
      input.placeholder = `${placeholderText} ${i + 1}`;
      input.required = true;
      wrapper.appendChild(input);

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'remove-btn';
      removeBtn.title = 'Remove';
      removeBtn.innerText = '✕';
      removeBtn.addEventListener('click', () => wrapper.remove());
      wrapper.appendChild(removeBtn);

      container.appendChild(wrapper);
    }
  }

  // --- Field group mappings ---
  const groups = [
    { countId: 'ownerCount', containerId: 'ownerInputs', fieldName: 'owner', label: 'Owner Name' },
    { countId: 'lyricistCount', containerId: 'lyricistInputs', fieldName: 'lyricist_name', label: 'Lyricist Name' },
    { countId: 'producerCount', containerId: 'producerInputs', fieldName: 'producer_name', label: 'Producer Name' },
    { countId: 'contributorCount', containerId: 'contributorInputs', fieldName: 'contributor_name', label: 'Contributor Name' }
  ];

  // creating fields calls
  groups.forEach(g => {
    const numEl = document.getElementById(g.countId);
    if (!numEl) return;
    numEl.addEventListener('input', () => {
      const c = Math.max(0, Math.min(50, parseInt(numEl.value || 0)));
      createDynamicFields(c, g.containerId, g.fieldName, g.label);
    });
  });

  // main artists
  const artistCountInput = document.getElementById('artistCount');
  const artistContainer = document.getElementById('artistInputs');

  function createArtistFields(extraCount = 0) {
    artistContainer.innerHTML = "";

    const mainWrapper = document.createElement('div');
    mainWrapper.className = 'dynamic-row';

    const mainInput = document.createElement('input');
    mainInput.type = 'text';
    mainInput.name = 'artist_name[]';
    mainInput.placeholder = 'Enter main artist name';
    mainInput.required = true;
    mainInput.classList.add('main-artist');
    mainWrapper.appendChild(mainInput);

    artistContainer.appendChild(mainWrapper);

    const note = document.createElement('p');
    note.className = 'note';
    note.innerText = "NOTE: The name entered here will be considered as the main artist name and cannot be changed later.";
    artistContainer.appendChild(note);

    for (let i = 0; i < extraCount; i++) {
      const wrapper = document.createElement('div');
      wrapper.className = 'dynamic-row';

      const input = document.createElement('input');
      input.type = 'text';
      input.name = 'artist_name[]';
      input.placeholder = `Artist name ${i + 2}`;
      wrapper.appendChild(input);

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'remove-btn';
      removeBtn.innerText = '✕';
      removeBtn.addEventListener('click', () => wrapper.remove());
      wrapper.appendChild(removeBtn);

      artistContainer.appendChild(wrapper);
    }
  }

  createArtistFields(0);
  artistCountInput.addEventListener('input', () => {
    const count = Math.max(0, Math.min(49, parseInt(artistCountInput.value || 0)));
    createArtistFields(count);
  });

  // --- Modal Elements ---
  const form = document.getElementById('registerForm');
  const modal = document.getElementById('successModal');
  const modalMessage = document.getElementById('modalMessage');
  const registerAnotherBtn = document.getElementById('registerAnotherBtn');
  const goBackBtn = document.getElementById('goBackBtn');
  const createAlbumBtn = document.getElementById('createAlbumBtn');

  function showModal(message, isSuccess = true, albumAvailable = false, artistName = "") {
    modalMessage.innerHTML = message;
    modalMessage.style.color = isSuccess ? "#2e7d32" : "#c62828";
    modal.style.display = "flex";
    document.body.classList.add("blurred");

    // Show buttons conditionally
    registerAnotherBtn.style.display = isSuccess ? "inline-block" : "none";
    goBackBtn.style.display = "inline-block";
    createAlbumBtn.style.display = albumAvailable ? "inline-block" : "none";

    // Attach album button event
    createAlbumBtn.onclick = () => {
      window.location.href = `/albums_create.html?artist=${encodeURIComponent(artistName)}`;
    };
  }

  function hideModal() {
    modal.style.display = "none";
    document.body.classList.remove("blurred");
  }

  registerAnotherBtn.addEventListener("click", () => {
    hideModal();
    form.reset();
    document.querySelectorAll('.dynamic-container').forEach(c => c.innerHTML = '');
    createArtistFields(0);
  });

  goBackBtn.addEventListener("click", () => {
    window.location.href = "/";
  });

  // --- Form Submission ---
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);

    const hr = parseInt(formData.get('duration_hr')) || 0;
    const min = parseInt(formData.get('duration_min')) || 0;
    const sec = parseInt(formData.get('duration_sec')) || 0;
    const durationArray = [hr, min, sec];

    const payload = {
      type: formData.get('type') || '',
      song_name: formData.get('song_name') || '',
      genre: formData.get('genre') || '',
      duration: durationArray,
      owner: formData.getAll('owner[]'),
      artist_name: formData.getAll('artist_name[]'),
      lyricist_name: formData.getAll('lyricist_name[]'),
      producer_name: formData.getAll('producer_name[]'),
      contributor_name: formData.getAll('contributor_name[]'),
      regemail: currentUserEmail || null
    };

    if (!payload.song_name.trim()) {
      showModal("Song name is required!", false);
      return;
    }

    try {
      const res = await fetch('/rusongs/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      if (res.ok) {
        let msg = ` ${result.message || "Song registered successfully!"}`;
        let albumAvailable = false;

        if (result.createAlbumAvailable) {
          albumAvailable = true;
          msg += `<br><br><b>${result.mainArtistName}</b> has reached 10 songs! You can now create an album for this artist.`;
        }

        showModal(msg, true, albumAvailable, result.mainArtistName);
      } else {
        showModal(result.message || " Error registering song.", false);
      }
    } catch (err) {
      console.error('Network/server error:', err);
      showModal(" Network/server error occurred.", false);
    }
  });
});
