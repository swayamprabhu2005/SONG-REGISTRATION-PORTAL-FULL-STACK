// /js/songs.js
document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("songsContainer");

  try {
    const res = await fetch("/songs/all");
    const songs = await res.json();

    songs.forEach((song) => {
      const card = document.createElement("div");
      card.className = "song-card";
      card.innerHTML = `
      <h3>${song.song_name}</h3>
      `;

      card.addEventListener("click", () => {
        window.location.href = `/song_view.html?id=${song.song_id}`;
      });
      container.appendChild(card);
    });
  } catch (err) {
    console.error("Error fetching songs:", err);
    container.innerHTML = "<p>Error loading songs.</p>";
  }
});
