// app/api/spotify/top-tracks/route.ts
//export const runtime = "nodejs";
import { NextResponse } from "next/server";
import SpotifyWebApi from "spotify-web-api-node";
import { getToken } from "next-auth/jwt";

export async function GET(req: Request) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const spotify = new SpotifyWebApi();
  spotify.setAccessToken(token.accessToken as string);

  // pull the time_range query param (default to medium_term)
  const url = new URL(req.url);
  const time_range = url.searchParams.get("time_range") || "medium_term";

  const { body } = await spotify.getMyTopTracks({
    limit: 10,
    time_range: time_range as "short_term" | "medium_term" | "long_term",
  });

  return NextResponse.json(body.items);
}
