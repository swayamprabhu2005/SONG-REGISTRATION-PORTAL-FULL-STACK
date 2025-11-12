import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = "https://oqbzbvkbqzpcuivsahkx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xYnpidmticXpwY3VpdnNhaGt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2MDk2MTMsImV4cCI6MjA3NDE4NTYxM30._bAXsOuz-xPbALqK9X0R5QKNZcwSzKCats3vMTfDGWs";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let userEmail = null;

// Authenticate user
(async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    alert("Please login first!");
    window.location.href = "login.html";
  } else {
    userEmail = user.email;
  }
})();

// dynamic input rows
function createInput(container, value = "", readOnly = false) {
  const div = document.createElement("div");
  div.classList.add("dynamic-row");

  const input = document.createElement("input");
  input.type = "text";
  input.value = value;
  input.readOnly = readOnly;
  div.appendChild(input);

  const remove = document.createElement("button");
  remove.type = "button";
  remove.innerText = "✕";
  remove.className = "remove-btn";
  remove.onclick = () => div.remove();
  if (readOnly) remove.style.display = "none";
  div.appendChild(remove);

  container.appendChild(div);
}

// new dynamic input fields
["owner", "artist", "lyricist", "producer"].forEach(type => {
  const btn = document.getElementById(`add${type.charAt(0).toUpperCase() + type.slice(1)}Btn`);
  btn?.addEventListener("click", () => {
    createInput(document.getElementById(`${type}Inputs`));
  });
});

// Verify existing song and load details
document.getElementById("verifyForm").addEventListener("submit", async e => {
  e.preventDefault();
  const songName = document.getElementById("song_name").value.trim();
  if (!songName) return alert("Please enter a song name.");

  const res = await fetch("/upsongs/checkSong", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ song_name: songName, regemail: userEmail })
  });

  const data = await res.json();
  if (!data.allowed) return alert(data.message);

  const detailsRes = await fetch(`/upsongs/getSongDetails/${encodeURIComponent(songName)}`);
  const song = await detailsRes.json();

  console.log("DEBUG: Song details from backend", song);

  document.getElementById("verifySection").style.display = "none";
  document.getElementById("updateSection").style.display = "block";

  document.getElementById("song_name_edit").value = song.song_name || "";
  document.getElementById("genre").value = song.genre || "";
  document.getElementById("type").value = song.source_types?.[0] || "";

  // Universal Duration Handler
  let hr = 0, min = 0, sec = 0;

  try {
    if (Array.isArray(song.duration) && song.duration.length === 3) {
      [hr, min, sec] = song.duration;
    } else if (typeof song.duration === "string") {
      const parsed = JSON.parse(song.duration);
      hr = parsed.hr ?? 0;
      min = parsed.min ?? 0;
      sec = parsed.sec ?? 0;
    } else if (typeof song.duration === "object" && song.duration !== null) {
      hr = song.duration.hr ?? 0;
      min = song.duration.min ?? 0;
      sec = song.duration.sec ?? 0;
    } else if (song.duration_hr !== undefined) {
      hr = song.duration_hr;
      min = song.duration_min;
      sec = song.duration_sec;
    }
  } catch (err) {
    console.error("Duration parsing failed:", err);
  }

  console.log("Parsed duration values:", { hr, min, sec });

  document.getElementById("duration_hr").value = hr;
  document.getElementById("duration_min").value = min;
  document.getElementById("duration_sec").value = sec;

  // Fill dynamic fields
  const fillDynamic = (id, arr) => {
    const container = document.getElementById(id);
    container.innerHTML = "";
    (arr || []).forEach(v => createInput(container, v));
  };

  fillDynamic("ownerInputs", song.owners);
  fillDynamic("lyricistInputs", song.lyricists);
  fillDynamic("producerInputs", song.producers);
  // Artists
  const artistContainer = document.getElementById("artistInputs");
  artistContainer.innerHTML = "";

  if (song.artists && song.artists.length > 0) {
    const mainArtistLabel = document.createElement("div");
    mainArtistLabel.className = "main-artist-label";
    mainArtistLabel.textContent = "MAIN ARTIST";
    artistContainer.appendChild(mainArtistLabel);

    createInput(artistContainer, song.artists[0], true);

    for (let i = 1; i < song.artists.length; i++) {
      createInput(artistContainer, song.artists[i]);
    }
  } else {
    createInput(artistContainer, "", false);
  }
});

// Update song details
document.getElementById("updateForm").addEventListener("submit", async e => {
  e.preventDefault();

  const songName = document.getElementById("song_name_edit").value.trim();
  const genre = document.getElementById("genre").value.trim();
  const type = document.getElementById("type").value.trim();

  const hr = parseInt(document.getElementById("duration_hr").value.trim()) || 0;
  const min = parseInt(document.getElementById("duration_min").value.trim()) || 0;
  const sec = parseInt(document.getElementById("duration_sec").value.trim()) || 0;

  const collectValues = id =>
    Array.from(document.getElementById(id).querySelectorAll("input"))
      .map(i => i.value.trim())
      .filter(v => v);

  const updatedData = {
    genre,
    duration_hr: hr,
    duration_min: min,
    duration_sec: sec,
    duration: [hr, min, sec],
    owners: collectValues("ownerInputs"),
    artists: collectValues("artistInputs"),
    lyricists: collectValues("lyricistInputs"),
    producers: collectValues("producerInputs"),
    type: type || "Primary"
  };

  console.log("Sending updated data:", updatedData);

  const res = await fetch("/upsongs/updateSong", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ song_name: songName, regemail: userEmail, updatedData })
  });

  const data = await res.json();
  if (res.ok) {
  const modal = document.getElementById("modalSuccess");
  const messageBox = document.getElementById("modalMessage");

  messageBox.textContent = `${data.message || "Song updated successfully!"}`;

  modal.style.display = "flex";
  document.body.classList.add("modal-blur");

  setTimeout(() => {
    modal.style.opacity = "0";
    document.body.classList.remove("modal-blur");

    setTimeout(() => {
      modal.style.display = "none";
      window.location.href = "/";
    }, 500);
  }, 5000);
} else {
  alert(data.message || "Error updating song.");
}

});
