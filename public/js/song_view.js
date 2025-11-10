document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) {
    console.error("No song ID provided in URL.");
    return;
  }

  try {
    const res = await fetch(`/songs/${id}`);
    const data = await res.json();

    if (!res.ok)
      throw new Error(data.message || "Failed to fetch song details");

    const {
      song,
      artists,
      lyricists,
      producers,
      sources,
      moreSongs,
    } = data;

    if (!song) {
      console.error("No song data received");
      return;
    }

    // Clicked song
    document.getElementById("songName").textContent =
      song.song_name || "Unknown";
    document.getElementById("genre").textContent = song.genre || "N/A";
    document.getElementById("album").textContent = song.album_name || "Single";

    // Duration parsing
    let durationText = "N/A";
    if (song.duration) {
      try {
        let hr, min, sec;
        if (Array.isArray(song.duration)) 
        {
          [hr, min, sec] = song.duration;
        } 
        else if (typeof song.duration === "string")
        {
          if (song.duration.trim().startsWith("[")) 
          { [hr, min, sec] = JSON.parse(song.duration); } 
          else { [hr, min, sec] = song.duration.split(",").map(Number); }
        }
        durationText = `${hr} hrs ${min} mins ${sec} secs`;
      } catch {
        const [hr, min, sec] = song.duration.split(",").map(Number);
        durationText = `${hr} hrs ${min} mins ${sec} secs`;
      }
    }
    document.getElementById("duration").textContent = durationText;

    document.getElementById("type").textContent = sources?.[0]?.type || "N/A";
    document.getElementById("artists").textContent =
      artists && artists.length > 0
        ? artists.map((a) => a.artist_name).join(", ")
        : "N/A";
    document.getElementById("lyricists").textContent =
      lyricists && lyricists.length > 0
        ? lyricists.map((l) => l.lyricist_name).join(", ")
        : "N/A";
    document.getElementById("producers").textContent =
      producers && producers.length > 0
        ? producers.map((p) => p.producer_name).join(", ")
        : "N/A";
    document.getElementById("owners").textContent =
      sources && sources.length > 0
        ? sources.map((s) => `${s.owner || "Unknown"}`).join(", ")
        : "N/A";

    // More like this albums songs
    const relatedBox = document.getElementById("relatedSongs");
    relatedBox.innerHTML = "";

    if (!moreSongs || moreSongs.length === 0) {
      relatedBox.innerHTML = "<p>No other songs in this album.</p>";
    } else {
      moreSongs.forEach((s) => {
        const div = document.createElement("div");
        div.className = "related-song";
        div.textContent = s.song_name;
        div.addEventListener("click", () => {
          window.location.href = `/song_view.html?id=${s.song_id}`;
        });
        relatedBox.appendChild(div);
      });
    }
  } catch (err) {
    console.error("Error loading song:", err);
    alert("Failed to load song details. Check console for more info.");
  }
});
