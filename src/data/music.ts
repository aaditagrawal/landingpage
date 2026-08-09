export type Track = {
  title: string;
  artist: string;
  album?: string;
};

export type MusicSection = {
  label: string;
  tracks: Track[];
};

export type TrackGroup =
  | { kind: "album"; album: string; tracks: Track[] }
  | { kind: "track"; track: Track };

/** Group tracks that share an album; singles stay as standalone cards. */
export function groupTracks(tracks: Track[]): TrackGroup[] {
  const albumMap = new Map<string, Track[]>();

  for (const track of tracks) {
    if (!track.album) continue;
    const list = albumMap.get(track.album) ?? [];
    list.push(track);
    albumMap.set(track.album, list);
  }

  const groups: TrackGroup[] = [];
  const emittedAlbums = new Set<string>();

  for (const track of tracks) {
    if (!track.album) {
      groups.push({ kind: "track", track });
      continue;
    }

    if (emittedAlbums.has(track.album)) continue;
    emittedAlbums.add(track.album);

    const batch = albumMap.get(track.album)!;
    if (batch.length >= 2) {
      groups.push({ kind: "album", album: track.album, tracks: batch });
    } else {
      groups.push({ kind: "track", track: batch[0] });
    }
  }

  return groups;
}

export const musicSections: MusicSection[] = [
  {
    label: "Instrumental",
    tracks: [
      { title: "Flight", artist: "Hans Zimmer", album: "Man of Steel" },
      { title: "Can You Hear The Music", artist: "Ludwig Goransson", album: "Oppenheimer" },
      { title: "God - Senna Theme", artist: "Antonio Pinto", album: "Senna" },
      { title: "Going The Distance", artist: "Bill Conti", album: "Rocky" },
      { title: "Lost but Won", artist: "Hans Zimmer", album: "Rush" },
      { title: "Le Mans 66", artist: "Marco Beltrami", album: "Ford v Ferrari" },
      {
        title: "Across the Spider-Verse (Intro)",
        artist: "Daniel Pemberton",
        album: "Spider-Man: Across the Spider-Verse",
      },
      { title: "Your New Home", artist: "Gooseworx", album: "The Amazing Digital Circus" },
      { title: "Spring 1", artist: "Max Richter", album: "Vivaldi" },
      { title: "MIA23 (1:2)", artist: "Charles Leclerc", album: "Accelerando" },
      { title: "In the Hall Of The Mountain King", artist: "Edvard Grieg" },
      { title: "Mission: Impossible Theme", artist: "Michael Giacchino" },
      { title: "Purpose Is Glorious", artist: "Natalie Holt", album: "Loki: Season 2" },
      { title: "History Is Now", artist: "Natalie Holt", album: "Loki: Season 2" },
      { title: "Who You Really Are", artist: "David Arnold", album: "Sherlock" },
      { title: "Brother Mine", artist: "David Arnold", album: "Sherlock" },
      { title: "Darkstar", artist: "Harold Faltermeyer", album: "Top Gun: Maverick" },
      {
        title: "Main Titles (You've Been Called Back to Top Gun)",
        artist: "Harold Faltermeyer",
        album: "Top Gun: Maverick",
      },
      { title: "Special Ops Main Theme", artist: "Advait Nemlekar", album: "Special Ops" },
    ],
  },
  {
    label: "English",
    tracks: [{ title: "Lonely Together", artist: "Avicii, Rita Ora" }],
  },
  {
    label: "Hindi",
    tracks: [
      { title: "Banda", artist: "Shankar-Ehsaan-Loy", album: "Sam Bahadur" },
      { title: "Itni Si Baat", artist: "Shankar-Ehsaan-Loy", album: "Sam Bahadur" },
      { title: "Mamta Se Bhari", artist: "Bombay Jayashri", album: "Baahubali: The Beginning" },
      {
        title: "Jiyo Re Bahubali",
        artist: "Daler Mehndi, Ramya Behra, Sanjeev Chimmalgi",
        album: "Baahubali: The Conclusion",
      },
      { title: "Besabriyaan", artist: "Armaan Malik", album: "M.S. Dhoni" },
      { title: "Kaun Tujhe", artist: "Palak Muchhal", album: "M.S. Dhoni" },
      { title: "Scam 1992 Theme", artist: "Achint", album: "Scam 1992" },
      { title: "Bolo Na", artist: "Shaan", album: "12th Fail" },
      { title: "Bhaag Milkha Bhaag", artist: "Shankar Ehsaan Loy", album: "Bhaag Milkha Bhaag" },
    ],
  },
];
