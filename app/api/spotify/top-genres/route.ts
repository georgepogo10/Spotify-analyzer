// app/api/spotify/top-genres/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const url = new URL(req.url);
  const time_range = url.searchParams.get("time_range") ?? "medium_term";

  // fetch top artists (to derive genres)
  const resp = await fetch(
    `https://api.spotify.com/v1/me/top/artists?limit=50&time_range=${time_range}`,
    { headers: { Authorization: `Bearer ${token.accessToken}` } }
  );
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    return NextResponse.json(
      { error: err.error?.message ?? "Spotify fetch failed" },
      { status: resp.status }
    );
  }

  const { items: artists } = await resp.json();
  const counts: Record<string, number> = {};
  const images: Record<string, string> = {};
  for (const artist of artists) {
    for (const g of artist.genres) {
      counts[g] = (counts[g] || 0) + 1;
      if (!images[g] && artist.images[2]?.url) {
        images[g] = artist.images[2].url;
      }
    }
  }

  const genres = Object.entries(counts)
    .sort(([,a],[,b]) => b - a)
    .slice(0, 10)
    .map(([genre]) => ({ genre, imageUrl: images[genre]! }));

  return NextResponse.json(genres);
}
