/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import Image from "next/image";
import useSWR from "swr";
import { useSession, signIn, signOut } from "next-auth/react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

// Fetch helper
const fetcher = async (url: string) => {
  const res = await fetch(url);
  const text = await res.text();
  if (text.trim().startsWith("<!DOCTYPE")) {
    throw new Error("Expected JSON from API but got HTML. Check API route.");
  }
  const data = JSON.parse(text);
  if (!res.ok) throw new Error(data.error || "Fetch failed");
  return data;
};

const CATEGORIES = [
  { label: "Top Songs", key: "tracks", header: "Your Top 10 Tracks" },
  { label: "Top Artists", key: "artists", header: "Your Top 10 Artists" },
  { label: "Top Genres", key: "genres", header: "Your Top 10 Genres" },
  { label: "Analyze", key: "analyze", header: "Audio-Feature Correlations" },
];

const TIME_RANGES = [
  { label: "Last 4 Weeks", value: "short_term" },
  { label: "Last 6 Months", value: "medium_term" },
  { label: "All Time", value: "long_term" },
];

export default function Home() {
  const { data: session } = useSession();
  const [category, setCategory] = useState("tracks");
  const [timeRange, setTimeRange] = useState("medium_term");

  const endpoint = session
    ? category === "analyze"
      ? `/api/spotify/feature-correlation?time_range=${timeRange}`
      : `/api/spotify/top-${category}?time_range=${timeRange}`
    : null;

  const { data, error } = useSWR(endpoint, fetcher);

  // FALL THEME COLORS
  const fallGradient =
    "linear-gradient(135deg, #FFB347 0%, #FF7E5F 40%, #B34700 100%)";
  const fallAccent = "#FF9F55";
  const deepBrown = "#3B1C0A";
  const softCream = "#FFF8F1";
  const warmText = "#5C3D2E";

  // Not signed in
  if (!session) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: fallGradient,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          color: softCream,
          fontFamily: "Inter, sans-serif",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <h1 style={{ fontSize: "2.2rem", fontWeight: 700, marginBottom: "1rem" }}>
          🍂 Spotify Autumn Analyzer 🍁
        </h1>
        <p style={{ fontSize: "1.1rem", marginBottom: "1.5rem", maxWidth: 500 }}>
          Discover your top tracks and artists this season in warm autumn style.
        </p>
        <button
          style={{
            backgroundColor: softCream,
            color: deepBrown,
            border: "none",
            borderRadius: 12,
            padding: "0.75rem 1.5rem",
            fontSize: "1rem",
            fontWeight: 600,
            cursor: "pointer",
            transition: "transform 0.2s ease",
          }}
          onClick={() =>
            signIn("spotify", { callbackUrl: window.location.origin + "/" })
          }
          onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
          onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          Sign in with Spotify
        </button>
      </main>
    );
  }

  // Error / Loading states
  if (error)
    return (
      <main
        style={{
          background: softCream,
          color: deepBrown,
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "1.1rem",
        }}
      >
        Error: {error.message}
      </main>
    );

  if (!data)
    return (
      <main
        style={{
          background: softCream,
          color: deepBrown,
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "1.1rem",
        }}
      >
        Loading your fall vibes…
      </main>
    );

  const currentCat = CATEGORIES.find((c) => c.key === category)!;
  const currentTimeLabel = TIME_RANGES.find((t) => t.value === timeRange)!.label;

  return (
    <main
      style={{
        background: `linear-gradient(to bottom right, #FFF8F1, #FFD6A5)`,
        minHeight: "100vh",
        fontFamily: "Inter, sans-serif",
        color: warmText,
        padding: "2rem",
      }}
    >
      {/* Header */}
      <header
        style={{
          textAlign: "center",
          marginBottom: "2rem",
        }}
      >
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: 700,
            background: fallGradient,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: "0.5rem",
          }}
        >
          {currentCat.header}
        </h1>
        <h2 style={{ fontSize: "1rem", color: "#7A4B2E" }}>
          ({currentTimeLabel})
        </h2>
      </header>

      {/* Category Tabs */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "1rem",
          flexWrap: "wrap",
          marginBottom: "1.5rem",
        }}
      >
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            style={{
              background:
                category === c.key ? fallGradient : "rgba(255,255,255,0.6)",
              color: category === c.key ? softCream : deepBrown,
              border: "none",
              borderRadius: 20,
              padding: "0.5rem 1rem",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow:
                category === c.key
                  ? "0 4px 12px rgba(179, 71, 0, 0.3)"
                  : "0 2px 6px rgba(0,0,0,0.1)",
              transition: "all 0.2s ease",
            }}
            onClick={() => setCategory(c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Time Range Tabs */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        {TIME_RANGES.map((t) => (
          <button
            key={t.value}
            style={{
              background:
                timeRange === t.value ? fallAccent : "rgba(255,255,255,0.7)",
              color: timeRange === t.value ? deepBrown : warmText,
              border: "none",
              borderRadius: 16,
              padding: "0.4rem 0.9rem",
              cursor: "pointer",
              fontWeight: 600,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              transition: "all 0.2s ease",
            }}
            onClick={() => setTimeRange(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Sign-out */}
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <button
          style={{
            backgroundColor: "#7A4B2E",
            color: "white",
            border: "none",
            borderRadius: 12,
            padding: "0.5rem 1rem",
            fontSize: "0.9rem",
            cursor: "pointer",
          }}
          onClick={() => signOut()}
        >
          Sign Out
        </button>
      </div>

      {/* Main Content */}
      {category === "analyze" ? (
        <>
          <h2 style={{ textAlign: "center", fontSize: "1.3rem", marginBottom: "1rem" }}>
            🍁 Correlation Heatmap
          </h2>
          <p
            style={{
              textAlign: "center",
              fontSize: "0.95rem",
              marginBottom: "1.5rem",
              color: "#7A4B2E",
            }}
          >
            See how your top tracks’ audio features correlate over time.
          </p>
          <div
            style={{
              overflowX: "auto",
              background: "rgba(255,255,255,0.9)",
              borderRadius: 12,
              padding: "1rem",
              boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
            }}
          >
            <table style={{ borderCollapse: "collapse", margin: "auto" }}>
              <thead>
                <tr>
                  <th style={{ padding: 6 }}></th>
                  {(data.keys as string[]).map((col) => (
                    <th
                      key={col}
                      style={{
                        padding: 6,
                        fontSize: "0.8rem",
                        textAlign: "center",
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data.keys as string[]).map((rowKey, i) => (
                  <tr key={rowKey}>
                    <th
                      style={{
                        padding: 6,
                        fontSize: "0.8rem",
                        textAlign: "right",
                      }}
                    >
                      {rowKey}
                    </th>
                    {(data.matrix as number[][])[i].map((val, j) => {
                      const red = val > 0 ? Math.round(val * 200) : 50;
                      const green = 80;
                      const blue = val < 0 ? Math.round(-val * 200) : 50;
                      const bg = `rgb(${red},${green},${blue})`;
                      const color = Math.abs(val) > 0.5 ? "#fff" : "#000";
                      return (
                        <td
                          key={j}
                          style={{
                            width: 40,
                            height: 40,
                            backgroundColor: bg,
                            color,
                            textAlign: "center",
                            fontSize: "0.75rem",
                            borderRadius: 4,
                          }}
                        >
                          {val.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            display: "grid",
            gap: "1rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          }}
        >
          {(data as any[]).map((item: any, idx) => {
            const image =
              category === "tracks"
                ? item.album.images[2]?.url
                : category === "artists"
                ? item.images[2]?.url
                : item.imageUrl;
            const label =
              category === "tracks"
                ? `${item.name} — ${item.artists
                    .map((a: any) => a.name)
                    .join(", ")}`
                : category === "artists"
                ? item.name
                : item.genre;

            return (
              <li
                key={item.id || item.genre}
                style={{
                  background:
                    idx % 2 === 0
                      ? "rgba(255,255,255,0.9)"
                      : "rgba(255, 238, 220, 0.9)",
                  borderRadius: 16,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  padding: "1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  transition: "transform 0.2s ease",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.transform = "scale(1.03)")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.transform = "scale(1)")
                }
              >
                {image && (
                  <Image
                    src={image}
                    alt={label}
                    width={60}
                    height={60}
                    style={{
                      borderRadius: 12,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    }}
                  />
                )}
                <div>
                  <strong style={{ fontSize: "1rem" }}>{label}</strong>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
