import express from "express";
import db from "../databases/db.js";

const router = express.Router();

// Song Ownership
router.post("/checkSong", async (req, res) => {
  try {
    const { song_name, regemail } = req.body;

    if (!song_name || !regemail)
      return res.status(400).json({ allowed: false, message: "Missing song name or user email." });

    const [rows] = await db.query(
      `SELECT s.song_id, so.regemail 
       FROM songs s
       JOIN source so ON s.song_id = so.song_id
       WHERE s.song_name = ?`,
      [song_name]
    );

    if (rows.length === 0)
      return res.json({ allowed: false, message: "Song not found." });

    const isOwner = rows.some(r => r.regemail === regemail);

    if (!isOwner)
      return res.json({ allowed: false, message: "You are not authorized to update this song." });

    res.json({ allowed: true, message: "Verified. You can edit this song." });
  } catch (err) {
    console.error("Error checking song:", err);
    res.status(500).json({ allowed: false, message: "Server error during verification." });
  }
});

// Fetch Song Details
router.get("/getSongDetails/:song_name", async (req, res) => {
  try {
    const { song_name } = req.params;

    // Fetch main song info
    const [songRows] = await db.query(
      "SELECT song_id, song_name, genre, duration FROM songs WHERE song_name = ?",
      [song_name]
    );

    if (songRows.length === 0)
      return res.status(404).json({ error: "Song not found" });

    const song = songRows[0];

    if (song.duration) {
      try {
        const d = JSON.parse(song.duration);
        if (Array.isArray(d)) {
          song.duration_hr = d[0] || 0;
          song.duration_min = d[1] || 0;
          song.duration_sec = d[2] || 0;
        } else {
          song.duration_hr = d.hr || 0;
          song.duration_min = d.min || 0;
          song.duration_sec = d.sec || 0;
        }
      } catch {
        song.duration_hr = 0;
        song.duration_min = 0;
        song.duration_sec = 0;
      }
    } else {
      song.duration_hr = 0;
      song.duration_min = 0;
      song.duration_sec = 0;
    }

    const song_id = song.song_id;

    // Fetch related details
    const [owners] = await db.query(
      "SELECT owner, `type` FROM source WHERE song_id = ?",
      [song_id]
    );

    const [artists] = await db.query(
      "SELECT artist_name FROM artists WHERE song_id = ? ORDER BY artist_id ASC",
      [song_id]
    );

    const [lyricists] = await db.query(
      "SELECT lyricist_name FROM lyricists WHERE song_id = ?",
      [song_id]
    );

    const [producers] = await db.query(
      "SELECT producer_name FROM producers WHERE song_id = ?",
      [song_id]
    );

    // Format arrays
    song.owners = owners.map(o => o.owner);
    song.source_types = owners.map(o => o.type);
    song.artists = artists.map(a => a.artist_name);
    song.lyricists = lyricists.map(l => l.lyricist_name);
    song.producers = producers.map(p => p.producer_name);
    res.json(song);
  } catch (err) {
    console.error("Error fetching song details:", err);
    res.status(500).json({ error: "Server error fetching song details" });
  }
});

// Update Song Details
router.post("/updateSong", async (req, res) => {
  const { song_name, regemail, updatedData } = req.body;

  try {
    const [songRows] = await db.query(
      "SELECT song_id FROM songs WHERE song_name = ?",
      [song_name]
    );
    if (songRows.length === 0)
      return res.status(404).json({ message: "Song not found." });

    const song_id = songRows[0].song_id;

    const durationArray = [
      parseInt(updatedData.duration_hr) || 0,
      parseInt(updatedData.duration_min) || 0,
      parseInt(updatedData.duration_sec) || 0
    ];
    const durationJSON = JSON.stringify(durationArray);

    await db.query(
      "UPDATE songs SET genre = ?, duration = ? WHERE song_id = ?",
      [updatedData.genre, durationJSON, song_id]
    );
    // flush data record from tables
    await db.query("DELETE FROM source WHERE song_id = ?", [song_id]);
    await db.query("DELETE FROM artists WHERE song_id = ?", [song_id]);
    await db.query("DELETE FROM lyricists WHERE song_id = ?", [song_id]);
    await db.query("DELETE FROM producers WHERE song_id = ?", [song_id]);

    // Insert updated owners
    for (const owner of updatedData.owners || []) {
      await db.query(
        "INSERT INTO source (`type`, owner, song_id, regemail) VALUES (?, ?, ?, ?)",
        [updatedData.type || "Primary", owner, song_id, regemail]
      );
    }

    // Insert updated artists
    for (const artist of updatedData.artists || []) {
      await db.query(
        "INSERT INTO artists (artist_name, song_id) VALUES (?, ?)",
        [artist, song_id]
      );
    }

    // Insert updated lyricists
    for (const lyricist of updatedData.lyricists || []) {
      await db.query(
        "INSERT INTO lyricists (lyricist_name, song_id) VALUES (?, ?)",
        [lyricist, song_id]
      );
    }

    // Insert updated producers
    for (const producer of updatedData.producers || []) {
      await db.query(
        "INSERT INTO producers (producer_name, song_id) VALUES (?, ?)",
        [producer, song_id]
      );
    }

    res.json({ message: "Song updated successfully!" });
  } catch (err) {
    console.error("Error updating song:", err);
    res.status(500).json({ message: "Server error updating song." });
  }
});

export default router;
