// app/api/spotify/genre-duration/route.ts
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

  // 1. Fetch your top 50 tracks for that range
  const tracksRes = await fetch(
    `https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=${time_range}`,
    { headers: { Authorization: `Bearer ${token.accessToken}` } }
  );
  if (!tracksRes.ok) {
    const err = await tracksRes.json().catch(() => ({}));
    return NextResponse.json({ error: err.error?.message ?? "Fetch failed" }, { status: tracksRes.status });
  }
  const { items: tracks } = await tracksRes.json();

  // 2. Gather unique artist IDs from those tracks
  const artistIds = Array.from(
    new Set(tracks.flatMap((t: any) => t.artists.map((a: any) => a.id)))
  );
  // Spotify allows up to 50 at once:
  const artistsRes = await fetch(
    `https://api.spotify.com/v1/artists?ids=${artistIds.join(",")}`,
    { headers: { Authorization: `Bearer ${token.accessToken}` } }
  );
  const { artists } = await artistsRes.json();

  // 3. Build a map of genre → total duration (ms)
  const genreDurations: Record<string, number> = {};
  for (const track of tracks) {
    const duration = track.duration_ms;
    // pick the first artist’s genres (you could also split duration across all genres)
    const primaryArtist = artists.find((a: any) => a.id === track.artists[0].id);
    (primaryArtist?.genres || []).forEach((g: string) => {
      genreDurations[g] = (genreDurations[g] || 0) + duration;
    });
  }

  // 4. Convert to an array and sort descending
  const data = Object.entries(genreDurations)
    .map(([genre, ms]) => ({
      genre,
      minutes: Math.round(ms / 1000 / 60), 
    }))
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 10);

  return NextResponse.json(data);
}
