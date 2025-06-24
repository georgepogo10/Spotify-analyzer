// app/api/spotify/top-genres/route.ts
export const runtime = "edge";

import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function GET(req: Request) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // choose your time_range
  const url = new URL(req.url);
  const time_range = url.searchParams.get("time_range") || "medium_term";

  // fetch your top artists
  const resp = await fetch(
    `https://api.spotify.com/v1/me/top/artists?limit=50&time_range=${time_range}`,
    { headers: { Authorization: `Bearer ${token.accessToken}` } }
  );
  if (!resp.ok) {
    const e = await resp.json().catch(() => ({}));
    return NextResponse.json({ error: e.error?.message || "Fetch failed" }, { status: resp.status });
  }
  const { items: artists } = await resp.json();

  // tally genres and remember first-seen artist image
  const counts: Record<string, number> = {};
  const images: Record<string,string> = {};
  for (const artist of artists) {
    for (const g of artist.genres) {
      counts[g] = (counts[g] || 0) + 1;
      if (!images[g] && artist.images[2]?.url) {
        images[g] = artist.images[2].url;
      }
    }
  }

  // pick top 10 genres
  const genres = Object.entries(counts)
    .sort(([,a],[,b]) => b - a)
    .slice(0, 10)
    .map(([genre]) => ({
      genre,
      imageUrl: images[genre]!,
    }));

  return NextResponse.json(genres);
}
