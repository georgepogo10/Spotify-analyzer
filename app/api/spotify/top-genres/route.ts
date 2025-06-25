// app/api/spotify/top-genres/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  // Get our JWT (with Spotify accessToken) from the cookie
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Pull the time_range query param (default to medium_term)
  const url = new URL(req.url);
  const time_range = url.searchParams.get("time_range") ?? "medium_term";

  // Fetch top artists to derive genres
  const artistRes = await fetch(
    `https://api.spotify.com/v1/me/top/artists?limit=50&time_range=${time_range}`,
    {
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
      },
    }
  );
  if (!artistRes.ok) {
    const err = await artistRes.json().catch(() => ({}));
    return NextResponse.json(
      { error: err.error?.message ?? "Spotify fetch failed" },
      { status: artistRes.status }
    );
  }

  const { items: artists } = await artistRes.json();

  // Tally up genres and capture one example image per genre
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

  // Build top-10 genre list
  const genres = Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([genre]) => ({
      genre,
      imageUrl: images[genre]!,
    }));

  return NextResponse.json(genres);
}
