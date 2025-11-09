import express from "express";
import db from "../databases/db.js";

const router = express.Router();

router.post("/deleteSong", async (req, res) => {
  const { song_name, regemail } = req.body;
  if (!song_name || !regemail) {
    return res.status(400).json({ error: "Missing song name or user email." });
  }

  try {
    // finding song
    const [songRows] = await db.query(
      `SELECT song_id, album_id FROM songs WHERE song_name = ?`,
      [song_name]
    );
    if (songRows.length === 0) return res.status(404).json({ error: "Song not found." });
    const song = songRows[0];

    //Verify ownership
    const [srcRows] = await db.query("SELECT regemail FROM source WHERE song_id = ?", [song.song_id]);
    if (!srcRows.length || srcRows[0].regemail !== regemail) {
      return res.status(403).json({ error: "You are not authorized to delete this song." });
    }

    //Find main artist id before deleting
    let mainArtistIdToDecrement = null;

    if (!song.album_id) {
      // non-album song: find main artist by lowest artist_id for this song
      const [artistRows] = await db.query(
        `
        SELECT a.artist_name
        FROM artists a
        WHERE a.song_id = ?
          AND a.artist_id = (
            SELECT MIN(a2.artist_id) FROM artists a2 WHERE a2.song_id = a.song_id
          )
        LIMIT 1
        `,
        [song.song_id]
      );

      if (artistRows.length > 0) {
        const mainArtistName = artistRows[0].artist_name;
        const [mainArtistRows] = await db.query(
          `SELECT main_artist_id FROM main_artists WHERE LOWER(main_artist_name)=LOWER(?) LIMIT 1`,
          [mainArtistName]
        );
        if (mainArtistRows.length > 0) mainArtistIdToDecrement = mainArtistRows[0].main_artist_id;
      } else {
        console.log("No artist rows found for song before delete:", song.song_id);
      }
    } else {
      // album song: find album's main artist
      const [albumArtistRows] = await db.query(
        `
        SELECT a.artist_name
        FROM artists a
        JOIN songs s ON a.song_id = s.song_id
        WHERE s.album_id = ?
          AND a.artist_id = (
            SELECT MIN(a2.artist_id)
            FROM artists a2
            JOIN songs s2 ON a2.song_id = s2.song_id
            WHERE s2.album_id = s.album_id
          )
        LIMIT 1
        `,
        [song.album_id]
      );

      if (albumArtistRows.length > 0) {
        const albumMainArtistName = albumArtistRows[0].artist_name;
        const [mainArtistRows] = await db.query(
          `SELECT main_artist_id FROM main_artists WHERE LOWER(main_artist_name)=LOWER(?) LIMIT 1`,
          [albumMainArtistName]
        );
        if (mainArtistRows.length > 0) mainArtistIdToDecrement = mainArtistRows[0].main_artist_id;
      } else {
        console.log("No album artist found for album_id:", song.album_id);
      }
    }

    // Delete requested song with ON DELETE CASCADE
    await db.query("DELETE FROM songs WHERE song_id = ?", [song.song_id]);

    if (song.album_id) {
      //album_id= Null of remaining songs in this album
      await db.query("UPDATE songs SET album_id = NULL WHERE album_id = ? AND song_id != ?", [
        song.album_id,
        song.song_id,
      ]);
      await db.query("DELETE FROM albums WHERE album_id = ?", [song.album_id]);
    }

    // Decrement main artist's no_of_songs by 1
    if (mainArtistIdToDecrement) {
      await db.query(`UPDATE main_artists SET no_of_songs = GREATEST(no_of_songs - 1, 0) WHERE main_artist_id = ?`,
        [mainArtistIdToDecrement]
      );
    }
    return res.json({ message: `Song '${song_name}' deleted successfully.` });
  } catch (err) {
    console.error("Error deleting song:", err);
    return res.status(500).json({ error: "Failed to delete song." });
  }
});

export default router;
