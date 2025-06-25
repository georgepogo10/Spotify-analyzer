// app/api/spotify/top-artists/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {
  // Retrieve the JWT (with our Spotify accessToken) from the request
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Read the time_range query param (default to medium_term)
  const url = new URL(req.url);
  const time_range = url.searchParams.get("time_range") || "medium_term";

  // Call Spotify’s API
  const res = await fetch(
    `https://api.spotify.com/v1/me/top/artists?limit=10&time_range=${time_range}`,
    { headers: { Authorization: `Bearer ${token.accessToken}` } }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json(
      { error: err.error?.message || "Spotify fetch failed" },
      { status: res.status }
    );
  }

  const data = await res.json();
  return NextResponse.json(data.items);
}
