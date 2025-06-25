// app/api/spotify/top-artists/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  // Grab our JWT (with the Spotify accessToken) from the cookie
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Pull the time_range query param (defaults to medium_term)
  const url = new URL(req.url);
  const time_range = url.searchParams.get("time_range") ?? "medium_term";

  // Fetch the user's top 10 artists from Spotify
  const response = await fetch(
    `https://api.spotify.com/v1/me/top/artists?limit=10&time_range=${time_range}`,
    {
      headers: { Authorization: `Bearer ${token.accessToken}` },
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    return NextResponse.json(
      { error: err.error?.message ?? "Spotify fetch failed" },
      { status: response.status }
    );
  }

  const data = await response.json();
  return NextResponse.json(data.items);
}
