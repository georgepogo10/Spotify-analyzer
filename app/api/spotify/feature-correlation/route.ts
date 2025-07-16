// app/api/spotify/feature-correlation/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  // 1) Authenticate the request
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // 2) Read the time_range query parameter (default to medium_term)
  const url = new URL(req.url);
  const time_range = url.searchParams.get("time_range") ?? "medium_term";

  // 3) Fetch the user's top 50 tracks for that period
  const topRes = await fetch(
    `https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=${time_range}`,
    { headers: { Authorization: `Bearer ${token.accessToken}` } }
  );
  if (!topRes.ok) {
    return NextResponse.json(
      { error: "Failed to fetch top tracks" },
      { status: topRes.status }
    );
  }
  const { items: tracks } = await topRes.json();

  // 4) Fetch audio features for those tracks in bulk
  const ids = tracks.map((t: any) => t.id).join(",");
  const featRes = await fetch(
    `https://api.spotify.com/v1/audio-features?ids=${ids}`,
    { headers: { Authorization: `Bearer ${token.accessToken}` } }
  );
  if (!featRes.ok) {
    return NextResponse.json(
      { error: "Failed to fetch audio features" },
      { status: featRes.status }
    );
  }
  const { audio_features: feats } = await featRes.json();

  // 5) Define the list of numeric features to correlate
  const keys = [
    "danceability",
    "energy",
    "valence",
    "tempo",
    "acousticness",
    "speechiness",
    "liveness",
  ];

  // 6) Compute the mean for each feature
  const mean: Record<string, number> = {};
  for (const k of keys) {
    mean[k] = feats.reduce((sum: number, f: any) => sum + (f[k] || 0), 0) / feats.length;
  }

  // 7) Build the Pearson correlation matrix
  const matrix = keys.map((xi) =>
    keys.map((xj) => {
      let cov = 0,
        varx = 0,
        vary = 0;
      for (const f of feats) {
        const dx = (f[xi] || 0) - mean[xi];
        const dy = (f[xj] || 0) - mean[xj];
        cov += dx * dy;
        varx += dx * dx;
        vary += dy * dy;
      }
      const corr = varx && vary ? cov / Math.sqrt(varx * vary) : 0;
      return parseFloat(corr.toFixed(2));
    })
  );

  // 8) Return the feature keys and correlation matrix
  return NextResponse.json({ keys, matrix });
}
