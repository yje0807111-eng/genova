import {
  FILMS_GENRE_KEYS,
  FILMS_GENRE_LABELS,
  normalizeMainGenreKey,
  type FilmsGenreKey,
} from "@/lib/constants/genres";
import type { Video } from "@/lib/types";

export type GenreSpotlightRow = {
  genreKey: FilmsGenreKey;
  label: string;
  picks: Video[];
};

function sortByRecent(a: Video, b: Video): number {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

const MOCK_THUMBNAILS = [
  "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&q=80",
  "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=600&q=80",
  "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=600&q=80",
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&q=80",
  "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=600&q=80",
  "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600&q=80",
  "https://images.unsplash.com/photo-1512070679279-8988d32161be?w=600&q=80",
  "https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?w=600&q=80",
  "https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=600&q=80",
  "https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?w=600&q=80",
  "https://images.unsplash.com/photo-1551817958-20204d6ab212?w=600&q=80",
  "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=600&q=80",
];

const GENRE_MOCK_DATA: Record<string, { titles: string[]; creators: string[] }> = {
  short_film: {
    titles: ["The Last Signal", "Echoes of Tomorrow", "Silent Horizon", "Neon Ghosts", "The Forgotten Shore", "Parallel Lives", "Beyond the Veil", "Carbon Dreams", "The Other Side", "Phantom Light", "Lost in Transit", "Digital Souls"],
    creators: ["Alex Chen", "Maya Studio", "Nova Films", "Pixel Dreams", "Arc Studio", "Void Cinema"],
  },
  mv: {
    titles: ["Frequency", "Pulse", "Neon Heart", "Electric Soul", "Chromatic Drift", "Signal Bloom", "Velvet Horizon", "Static Love", "Resonance", "Echo Chamber", "Synthetic Moon", "Glass Heart"],
    creators: ["Volt Studio", "Beat Lab", "Sonic Arc", "Rhythm House", "Melody AI", "Wave Studio"],
  },
  animation: {
    titles: ["The Crystal Forest", "Starbound", "Ocean's Dream", "Sky Wanderer", "The Last Garden", "Ember Quest", "Shadow Dancer", "Light Weaver", "Storm Chaser", "The Iron Bird", "Moon Walker", "Sun Chaser"],
    creators: ["Spark Studio", "Dream Lab", "Arc Animation", "Nova Toons", "Pixel Magic", "Frame Works"],
  },
  documentary: {
    titles: ["The AI Revolution", "Beyond Human", "Digital Frontier", "The New Creators", "Machine Dreams", "Code & Canvas", "The Neural Age", "Silicon Minds", "Future Makers", "The Algorithm", "Data Dreams", "Electric Lives"],
    creators: ["Truth Lab", "Doc Studio", "Reality Arc", "Signal Films", "Frame Truth", "Nova Docs"],
  },
  feed_horror: {
    titles: ["The Dark Signal", "Void Walker", "Crimson Static", "The Haunted Code", "Night Protocol", "Digital Decay", "The Last Byte", "Shadow Protocol", "Error 404", "Dead Signal", "The Corrupted", "Null Space"],
    creators: ["Dark Lab", "Horror Arc", "Void Studio", "Fear Films", "Dread Works", "Shadow House"],
  },
  feed_sci_fi: {
    titles: ["Orbital Decay", "The Void Between", "Neon Exodus", "Synthetic Dawn", "Last Colony", "Star Protocol", "Quantum Drift", "Nova Station", "The Final Frontier", "Deep Signal", "Binary Stars", "Chrome Future"],
    creators: ["Cosmos Lab", "Sci Arc", "Nova Films", "Future House", "Orbit Studio", "Star Works"],
  },
  feed_action: {
    titles: ["Iron Protocol", "Neon Strike", "The Last Operative", "Shadow Run", "Code Breaker", "Night Rider", "Steel Pulse", "Dark Horse", "The Hunter", "Last Stand", "Full Throttle", "Edge Runner"],
    creators: ["Action Lab", "Strike Studio", "Force Films", "Impact House", "Rush Works", "Speed Arc"],
  },
  feed_drama: {
    titles: ["Broken Signals", "The Quiet Storm", "Last Words", "Before Sunrise", "Paper Hearts", "The Long Way", "Empty Rooms", "Still Water", "Fading Light", "The Distance", "One More Day", "Silence"],
    creators: ["Drama Lab", "Heart Studio", "Soul Films", "Depth House", "Still Works", "Quiet Arc"],
  },
  feed_fantasy: {
    titles: ["The Crystal Mage", "Dragon's Breath", "The Enchanted", "World's End", "The Last Spell", "Ancient Runes", "The Oracle", "Shadow Realm", "The Chosen", "Magic Hour", "The Portal", "Mystic Path"],
    creators: ["Fantasy Lab", "Magic Studio", "Realm Films", "Spell House", "Arc Magic", "Nova Fantasy"],
  },
  feed_romance: {
    titles: ["First Light", "The Space Between", "Summer's End", "Parallel Hearts", "Two Worlds", "Across the Stars", "The Meeting", "Last Dance", "Sweet Nothing", "Until Now", "Forever Maybe", "Almost"],
    creators: ["Romance Lab", "Heart Arc", "Love Studio", "Soft Films", "Dream House", "Tender Works"],
  },
  feed_comedy: {
    titles: ["Glitch Mode", "AI Gone Wrong", "The Robot Next Door", "Digital Oops", "Code Chaos", "The Funny Algorithm", "Error Mode", "Laugh Protocol", "Bug Life", "The Broken Bot", "Silly Signal", "LOL.exe"],
    creators: ["Comedy Lab", "Laugh Studio", "Fun Arc", "Joke House", "Silly Works", "Gag Films"],
  },
  feed_cinematic_emotional: {
    titles: ["The Last Goodbye", "Echoes", "Fading", "The Weight", "Carry On", "Drift", "The Long Road", "Resolve", "Aftermath", "The Quiet", "Searching", "Found"],
    creators: ["Emotion Lab", "Soul Arc", "Deep Studio", "Feel Films", "Heart House", "Tender Arc"],
  },
};

function createMockVideo(
  genreKey: string,
  index: number,
  titles: string[],
  creators: string[],
): Video {
  const daysAgo = index * 3 + Math.floor(Math.random() * 5);
  return {
    id: "mock-films-" + genreKey + "-" + index,
    title: titles[index % titles.length] ?? "Untitled",
    thumbnailUrl: MOCK_THUMBNAILS[index % MOCK_THUMBNAILS.length] ?? null,
    vimeoId: "",
    genre: genreKey,
    subGenre: null,
    purpose: "personal",
    creatorId: null,
    creatorName: creators[index % creators.length] ?? "Creator",
    uploaderDisplayName: null,
    uploaderAvatarUrl: null,
    isOriginal: false,
    isFinalist: false,
    award: null,
    runtime: (1 + (index % 5)) + ":" + String(index % 60).padStart(2, "0"),
    createdAt: new Date(Date.now() - daysAgo * 86400000).toISOString(),
    visibility: "public",
    description: "",
    aiTools: [],
    tags: [],
    seriesName: null,
    episodeNumber: null,
    uploadedBy: null,
    viewCount: 500 + index * 200,
    likeCount: 0,
    likedByMe: false,
  };
}

export function buildFilmsPageData(videos: Video[]) {
  const originals = videos.filter((v) => v.isOriginal).sort(sortByRecent);
  const awardWinners = videos
    .filter((v) => v.award != null && String(v.award).trim() !== "")
    .sort(sortByRecent);
  const editorsPicks = videos.filter((v) => v.isFinalist).sort(sortByRecent);

  const byGenre = new Map<FilmsGenreKey, Video[]>();
  for (const k of FILMS_GENRE_KEYS) {
    byGenre.set(k, []);
  }
  for (const v of videos) {
    const k = normalizeMainGenreKey(v.genre);
    if (!k || !(FILMS_GENRE_KEYS as readonly string[]).includes(k)) continue;
    const fk = k as FilmsGenreKey;
    byGenre.get(fk)?.push(v);
  }

  const genreSpotlight: GenreSpotlightRow[] = FILMS_GENRE_KEYS.map((genreKey) => {
    const realVideos = (byGenre.get(genreKey) ?? []).slice().sort(sortByRecent);
    const mockData = GENRE_MOCK_DATA[genreKey];
    
    const mockVideos = mockData
      ? Array.from({ length: 12 }, (_, i) =>
          createMockVideo(genreKey, i, mockData.titles, mockData.creators)
        )
      : [];

    const combined = [...realVideos, ...mockVideos].slice(0, 12);

    return {
      genreKey,
      label: FILMS_GENRE_LABELS[genreKey],
      picks: combined,
    };
  });

  return { originals, awardWinners, editorsPicks, genreSpotlight };
}
