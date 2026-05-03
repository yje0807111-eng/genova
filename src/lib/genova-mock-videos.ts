import type { MainGenreKey } from "@/lib/constants/genres";
import { FEED_GENRE_KEYS } from "@/lib/constants/genres";
import type { Video } from "@/lib/types";

const MOCK_TITLES = [
  "Neon Drift",
  "Glass Garden",
  "Echo Chamber",
  "Midnight Signal",
  "Paper Moons",
  "Velvet Circuit",
  "Salt & Static",
  "Bloom / Fade",
  "Last Train Home",
  "Soft Machines",
  "Parallel Bloom",
  "Cold Open",
  "Afterglow Protocol",
  "Tiny Revolutions",
  "River of Light",
  "Second Sun",
  "Quiet Storm",
  "Frame Zero",
  "Atlas Dreams",
  "Silver Thread",
];

type MockExtra = {
  title: string;
  creator: string;
  genreKey: string;
  thumbnail: string;
  duration: string;
  views: number;
};

const EXTRA_MOCKS: MockExtra[] = [
  {
    title: "Midnight in Tokyo",
    creator: "Yuki Tanaka",
    genreKey: "feed_cyberpunk",
    thumbnail: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&h=450&fit=crop",
    duration: "5:22",
    views: 28_400,
  },
  {
    title: "Desert Wind",
    creator: "Ahmed Hassan",
    genreKey: "feed_landscape_nature",
    thumbnail: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&h=450&fit=crop",
    duration: "3:15",
    views: 14_200,
  },
  {
    title: "The Lost City",
    creator: "Marco Rossi",
    genreKey: "feed_fantasy",
    thumbnail: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&h=450&fit=crop",
    duration: "7:45",
    views: 41_800,
  },
  {
    title: "Quantum Dreams",
    creator: "Lisa Park",
    genreKey: "feed_sci_fi",
    thumbnail: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800&h=450&fit=crop",
    duration: "6:30",
    views: 33_500,
  },
  {
    title: "Street Stories",
    creator: "Carlos Mendez",
    genreKey: "documentary",
    thumbnail: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&h=450&fit=crop",
    duration: "14:20",
    views: 9700,
  },
  {
    title: "Neon Warrior",
    creator: "Jin Ho Lee",
    genreKey: "feed_action",
    thumbnail: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&h=450&fit=crop",
    duration: "4:55",
    views: 52_300,
  },
  {
    title: "Ocean Depths",
    creator: "Marina Blue",
    genreKey: "experimental_art",
    thumbnail: "https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=800&h=450&fit=crop",
    duration: "8:10",
    views: 17_600,
  },
  {
    title: "Cherry Blossom",
    creator: "Sakura Films",
    genreKey: "feed_romance",
    thumbnail: "https://images.unsplash.com/photo-1522383225653-ed111181a951?w=800&h=450&fit=crop",
    duration: "5:48",
    views: 38_900,
  },
  {
    title: "Digital Warrior",
    creator: "Tech Arts",
    genreKey: "animation",
    thumbnail: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=450&fit=crop",
    duration: "3:33",
    views: 25_100,
  },
  {
    title: "Mountain Spirit",
    creator: "Alpine Vision",
    genreKey: "feed_landscape_nature",
    thumbnail: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=450&fit=crop",
    duration: "4:12",
    views: 19_300,
  },
  {
    title: "Shadows of Fear",
    creator: "Dark Cinema",
    genreKey: "feed_horror",
    thumbnail: "https://images.unsplash.com/photo-1509248961895-40aa218e90b5?w=800&h=450&fit=crop",
    duration: "11:25",
    views: 22_700,
  },
  {
    title: "Future Beats",
    creator: "SoundWave",
    genreKey: "mv",
    thumbnail: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=450&fit=crop",
    duration: "3:58",
    views: 44_600,
  },
  {
    title: "City Pulse",
    creator: "Urban Eye",
    genreKey: "feed_daily_life",
    thumbnail: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&h=450&fit=crop",
    duration: "6:15",
    views: 11_800,
  },
  {
    title: "Taste of Tokyo",
    creator: "Food Cinema",
    genreKey: "feed_food",
    thumbnail: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&h=450&fit=crop",
    duration: "2:45",
    views: 31_200,
  },
  {
    title: "AI Awakening",
    creator: "Neural Films",
    genreKey: "experimental_art",
    thumbnail: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&h=450&fit=crop",
    duration: "9:20",
    views: 16_400,
  },
  {
    title: "Arctic Journey",
    creator: "Ice Vision",
    genreKey: "feed_travel",
    thumbnail: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&h=450&fit=crop",
    duration: "7:33",
    views: 28_900,
  },
  {
    title: "Speed Demons",
    creator: "Fast Lane",
    genreKey: "feed_sports",
    thumbnail: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=450&fit=crop",
    duration: "4:44",
    views: 35_700,
  },
  {
    title: "How I Made This",
    creator: "AI Academy",
    genreKey: "feed_tutorial",
    thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=450&fit=crop",
    duration: "18:30",
    views: 8300,
  },
  {
    title: "Galactic Odyssey",
    creator: "Cosmos Films",
    genreKey: "feed_sci_fi",
    thumbnail: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&h=450&fit=crop",
    duration: "12:15",
    views: 47_200,
  },
  {
    title: "Electric Soul",
    creator: "Volt Studio",
    genreKey: "short_film",
    thumbnail: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=450&fit=crop",
    duration: "5:05",
    views: 23_800,
  },
  {
    title: "Silent Circuit",
    creator: "Mina Cho",
    genreKey: "film",
    thumbnail: "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=800&q=80",
    duration: "6:11",
    views: 130,
  },
  {
    title: "Neon Ghosts",
    creator: "Ari Park",
    genreKey: "short_film",
    thumbnail: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80",
    duration: "8:02",
    views: 4820,
  },
  {
    title: "Velvet Street",
    creator: "June Han",
    genreKey: "film",
    thumbnail: "https://images.unsplash.com/photo-1524712245354-2c4e5e7121c0?w=800&q=80",
    duration: "4:48",
    views: 12900,
  },
  {
    title: "After Midnight",
    creator: "Noah Lim",
    genreKey: "film",
    thumbnail: "https://images.unsplash.com/photo-1501426026826-31c667bdf23d?w=800&q=80",
    duration: "10:19",
    views: 26700,
  },
  {
    title: "Ember Quest",
    creator: "Rin Studio",
    genreKey: "short_film",
    thumbnail: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&q=80",
    duration: "7:44",
    views: 31900,
  },
  {
    title: "Paper City",
    creator: "Lumi Works",
    genreKey: "film",
    thumbnail: "https://images.unsplash.com/photo-1505628346881-b72b27e84530?w=800&q=80",
    duration: "5:36",
    views: 870,
  },
  {
    title: "Broken Skyline",
    creator: "Kai Moon",
    genreKey: "film",
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
    duration: "9:27",
    views: 44120,
  },
  {
    title: "Second Frame",
    creator: "Nora Lee",
    genreKey: "short_film",
    thumbnail: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&q=80",
    duration: "3:42",
    views: 15400,
  },
  {
    title: "Ocean Memory",
    creator: "Blue Archive",
    genreKey: "film",
    thumbnail: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&q=80",
    duration: "11:08",
    views: 5020,
  },
  {
    title: "Last Projection",
    creator: "Soma Kim",
    genreKey: "film",
    thumbnail: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800&q=80",
    duration: "6:58",
    views: 49880,
  },
];

function baseVideoFields(i: number, title: string, genre: string, thumb: string, runtime: string, views: number, creator: string): Video {
  const daysAgo = (i * 47) % 365;
  const createdAt = new Date();
  createdAt.setDate(createdAt.getDate() - daysAgo);

  return {
    id: `mock-genova-${i}`,
    title,
    thumbnailUrl: thumb,
    vimeoId: "",
    genre,
    subGenre: null,
    purpose: "personal",
    creatorId: null,
    isOriginal: i % 5 === 0,
    isFinalist: i % 7 === 0,
    award: null,
    runtime,
    createdAt: createdAt.toISOString(),
    visibility: "public",
    description: "",
    aiTools: [],
    tags: [],
    seriesName: null,
    episodeNumber: null,
    uploadedBy: null,
    creatorName: creator,
    creatorAvatarUrl: `https://picsum.photos/seed/genova-avatar-${i}/64/64`,
    viewCount: views,
    likeCount: 800 - (i % 20) * 20,
  };
}

const PROCEDURAL_TITLE_LEAD = [
  "Chromatic Drift",
  "Velvet Horizon",
  "Signal Bloom",
  "Glass Meridian",
  "Nocturne Lane",
  "Prism Circuit",
  "Silver Flux",
  "Echo Atlas",
  "Lumen Field",
  "Obsidian Tide",
  "Aurora Index",
  "Static Bloom",
  "Neon Ledger",
  "Paper Orbit",
  "Quiet Voltage",
];

/** Curated + Unsplash + procedural — fallback when Supabase has no public rows. */
export function createGenovaMockVideos(): Video[] {
  const first20: Video[] = MOCK_TITLES.map((title, i) => {
    const idx = i + 1;
    return baseVideoFields(
      idx,
      title,
      FEED_GENRE_KEYS[i % FEED_GENRE_KEYS.length],
      `https://picsum.photos/seed/genova${idx}/640/360`,
      "3:24",
      120_000 - i * 4200,
      `Creator ${(i % 6) + 1}`,
    );
  });

  const second20: Video[] = EXTRA_MOCKS.map((m, i) =>
    baseVideoFields(21 + i, m.title, m.genreKey, m.thumbnail, m.duration, m.views, m.creator),
  );

  const PROCEDURAL_COUNT = 80;
  const proceduralStartIndex = 21 + EXTRA_MOCKS.length;
  const procedural: Video[] = [];
  for (let n = 0; n < PROCEDURAL_COUNT; n += 1) {
    const i = proceduralStartIndex + n;
    const lead = PROCEDURAL_TITLE_LEAD[n % PROCEDURAL_TITLE_LEAD.length];
    const title = `${lead} ${100 + n}`;
    const genre = FEED_GENRE_KEYS[(i - 1) % FEED_GENRE_KEYS.length];
    const minutes = 2 + (n % 14);
    const seconds = (n * 11) % 60;
    const runtime = `${minutes}:${seconds.toString().padStart(2, "0")}`;
    const views = 4000 + ((n * 791) % 195_000);
    const creator = `Studio ${(n % 12) + 1}`;
    procedural.push(
      baseVideoFields(i, title, genre, `https://picsum.photos/seed/gnv${i}/640/360`, runtime, views, creator),
    );
  }

  return [...first20, ...second20, ...procedural];
}
