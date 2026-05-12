import type { Album, Media } from "./data";

export type DayPlan = {
  date: string; // ISO yyyy-mm-dd
  weekday: string;
  items: Media[];
};

const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export type AlbumCount = { albumId: string; count: number };

/**
 * Generates a weekly plan starting from `startDate`.
 * Each day always starts with ONE greeting media (if available),
 * followed by `counts` items drawn randomly without immediate repetition.
 */
export function generateWeek(
  albums: Album[],
  mediaByAlbum: Record<string, Media[]>,
  counts: AlbumCount[],
  days: number,
  startDate: Date
): DayPlan[] {
  const greetingAlbums = albums.filter((a) => a.is_greeting);
  const greetingPool = shuffle(greetingAlbums.flatMap((a) => mediaByAlbum[a.id] ?? []));

  // pools per album (non-greeting), shuffled
  const pools: Record<string, Media[]> = {};
  for (const c of counts) {
    pools[c.albumId] = shuffle(mediaByAlbum[c.albumId] ?? []);
  }

  function take(albumId: string): Media | null {
    const pool = pools[albumId];
    if (!pool || pool.length === 0) {
      // refill (allow repeat across week if exhausted)
      pools[albumId] = shuffle(mediaByAlbum[albumId] ?? []);
      if (pools[albumId].length === 0) return null;
    }
    return pools[albumId].shift() ?? null;
  }

  function takeGreeting(): Media | null {
    if (greetingPool.length === 0) {
      const refill = shuffle(greetingAlbums.flatMap((a) => mediaByAlbum[a.id] ?? []));
      greetingPool.push(...refill);
    }
    return greetingPool.shift() ?? null;
  }

  const plan: DayPlan[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const items: Media[] = [];

    const g = takeGreeting();
    if (g) items.push(g);

    for (const c of counts) {
      for (let n = 0; n < c.count; n++) {
        const m = take(c.albumId);
        if (m) items.push(m);
      }
    }

    plan.push({
      date: d.toISOString().slice(0, 10),
      weekday: WEEKDAYS[d.getDay()],
      items,
    });
  }
  return plan;
}
