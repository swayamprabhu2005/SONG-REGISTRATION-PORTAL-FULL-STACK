document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("songsContainer");
  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("searchBtn");

  let allSongs = [];

  async function fetchSongs() {
    try {
      const res = await fetch("/songs/all");
      allSongs = await res.json();
      displaySongs(allSongs);
    } catch (err) {
      console.error("Error fetching songs:", err);
      container.innerHTML = "<p>Error loading songs.</p>";
    }
  }

  function displaySongs(songs) {
    container.innerHTML = "";
    if (songs.length === 0) {
      container.innerHTML = "<p>No songs found.</p>";
      return;
    }

    songs.forEach((song) => {
      const card = document.createElement("div");
      card.className = "song-card";
      card.innerHTML = `
        <h3>${song.song_name}</h3>     `;
      card.addEventListener("click", () => {
        window.location.href = `/song_view.html?id=${song.song_id}`;
      });
      container.appendChild(card);
    });
  }

  async function searchSongs() {
    const query = searchInput.value.trim();
    if (!query) {
      // show all if search empty
      displaySongs(allSongs);
      return;
    }

    try {
      const res = await fetch(`/songs/search?name=${encodeURIComponent(query)}`);
      const filtered = await res.json();
      displaySongs(filtered);
    } catch (err) {
      console.error("Error searching songs:", err);
      container.innerHTML = "<p>Error searching songs.</p>";
    }
  }

  // Event listeners
  searchBtn.addEventListener("click", searchSongs);
  searchInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") searchSongs();
  });

  // Initial load
  fetchSongs();
});

