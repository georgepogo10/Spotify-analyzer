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

  // 1. Fetch top tracks
  const topRes = await fetch(
    `https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=${time_range}`,
    { headers: { Authorization: `Bearer ${token.accessToken}` } }
  );
  if (!topRes.ok) {
    const text = await topRes.text();
    console.error("Top tracks fetch failed:", topRes.status, text);
    return NextResponse.json(
      { error: "Failed to fetch top tracks", details: text },
      { status: topRes.status }
    );
  }
  const { items: tracks } = await topRes.json();

  if (!tracks || tracks.length === 0) {
    return NextResponse.json(
      { error: "No top tracks found to analyze" },
      { status: 400 }
    );
  }

  // 2. Fetch audio features
  const ids = tracks.map((t: any) => t.id).join(",");
  const featRes = await fetch(
    `https://api.spotify.com/v1/audio-features?ids=${ids}`,
    { headers: { Authorization: `Bearer ${token.accessToken}` } }
  );
  if (!featRes.ok) {
    const text = await featRes.text();
    console.error("Audio feature fetch failed:", featRes.status, text);
    return NextResponse.json(
      { error: "Failed to fetch audio features", details: text },
      { status: featRes.status }
    );
  }

  const { audio_features: feats } = await featRes.json();
  const validFeats = feats.filter((f: any) => f !== null);

  if (validFeats.length === 0) {
    return NextResponse.json(
      { error: "No valid audio features found" },
      { status: 400 }
    );
  }

  // 3. Calculate correlations
  const keys = [
    "danceability",
    "energy",
    "valence",
    "tempo",
    "acousticness",
    "speechiness",
    "liveness",
  ];

  const mean: Record<string, number> = {};
  for (const k of keys) {
    mean[k] =
      validFeats.reduce((sum: number, f: any) => sum + (f[k] || 0), 0) /
      (validFeats.length || 1);
  }

  const matrix = keys.map((xi) =>
    keys.map((xj) => {
      let cov = 0,
        varx = 0,
        vary = 0;
      for (const f of validFeats) {
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

  return NextResponse.json({ keys, matrix });
}
