/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import Image from "next/image";
import useSWR from "swr";
import { useSession, signIn, signOut } from "next-auth/react";
import styles from "./page.module.css";
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

  // If we got back HTML (e.g. a 404 page), bail out with a clear error
  if (text.trim().startsWith("<!DOCTYPE")) {
    throw new Error(
      "Expected JSON from API but got HTML. Check that the API route exists."
    );
  }

  const data = JSON.parse(text);
  if (!res.ok) throw new Error(data.error || "Fetch failed");
  return data;
};

const CATEGORIES = [
  { label: "Top Songs",   key: "tracks",  header: "Your Top 10 Tracks" },
  { label: "Top Artists", key: "artists", header: "Your Top 10 Artists" },
  { label: "Top Genres",  key: "genres",  header: "Your Top 10 Genres" },
  { label: "Analyze",     key: "analyze", header: "Audio-Feature Correlations" },
];

const TIME_RANGES = [
  { label: "Last 4 Weeks",  value: "short_term"  },
  { label: "Last 6 Months", value: "medium_term" },
  { label: "All Time",      value: "long_term"   },
];

export default function Home() {
  const { data: session } = useSession();
  const [category, setCategory]   = useState("tracks");
  const [timeRange, setTimeRange] = useState("medium_term");

  // Choose endpoint based on category
  const endpoint = session
    ? category === "analyze"
      ? `/api/spotify/feature-correlation?time_range=${timeRange}`
      : `/api/spotify/top-${category}?time_range=${timeRange}`
    : null;

  const { data, error } = useSWR(endpoint, fetcher);

  // 1) Not signed in
  if (!session) {
    return (
      <main className={styles.container}>
        <h1 className={styles.header}>Spotify Music Top Lists</h1>
        <button
          className={styles.button}
          onClick={() =>
            signIn("spotify", { callbackUrl: window.location.origin + "/" })
          }
        >
          Sign in with Spotify
        </button>
      </main>
    );
  }

  // 2) Error or loading states
  if (error) {
    return (
      <main className={styles.container}>
        <p className={styles.error}>Error: {error.message}</p>
      </main>
    );
  }
  if (!data) {
    return (
      <main className={styles.container}>
        <p>Loading…</p>
      </main>
    );
  }

  const currentCat       = CATEGORIES.find(c => c.key === category)!;
  const currentTimeLabel = TIME_RANGES.find(t => t.value === timeRange)!.label;

  return (
    <main className={styles.container}>
      {/* Title with time-range */}
      <h1 className={styles.header}>
        {currentCat.header} ({currentTimeLabel})
      </h1>

      {/* Category tabs */}
      <div className={styles.categoryTabContainer}>
        {CATEGORIES.map(c => (
          <button
            key={c.key}
            className={`${styles.categoryTabButton} ${
              category === c.key ? styles.categoryTabButtonActive : ""
            }`}
            onClick={() => {
              setCategory(c.key);
              setTimeRange("medium_term");
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Time-range tabs */}
      <div className={styles.tabContainer}>
        {TIME_RANGES.map(t => (
          <button
            key={t.value}
            className={`${styles.tabButton} ${
              timeRange === t.value ? styles.tabButtonActive : ""
            }`}
            onClick={() => setTimeRange(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Sign-out */}
      <button className={styles.button} onClick={() => signOut()}>
        Sign out
      </button>

      {/* Main content */}
      {category === "analyze" ? (
        <>
          <h2 style={{ fontSize: "1.25rem", margin: "1rem 0" }}>
            Correlation Heatmap
          </h2>
          <h3 style={{ fontSize: "1rem", marginBottom: "1.5rem", color: "#555" }}>
            Displays Pearson correlation coefficients between audio features
            (–1 to +1) for your top tracks over the selected period.
          </h3>
          {/* Heatmap table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", margin: "auto" }}>
              <thead>
                <tr>
                  <th style={{ padding: 4 }}></th>
                  {(data.keys as string[]).map((col) => (
                    <th
                      key={col}
                      style={{
                        padding: 4,
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
                        padding: 4,
                        fontSize: "0.8rem",
                        textAlign: "right",
                      }}
                    >
                      {rowKey}
                    </th>
                    {(data.matrix as number[][])[i].map((val, j) => {
                      const red = val > 0 ? Math.round(val * 255) : 0;
                      const blue = val < 0 ? Math.round(-val * 255) : 0;
                      const bg = `rgb(${red},0,${blue})`;
                      const shade = val > 0.5 ? "#fff" : "#000";
                      return (
                        <td
                          key={j}
                          style={{
                            width: 40,
                            height: 40,
                            backgroundColor: bg,
                            color: shade,
                            textAlign: "center",
                            fontSize: "0.75rem",
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
        /* Top lists */
        <ul className={styles.trackList}>
          {(data as any[]).map((item: any) => {
            if (category === "tracks") {
              return (
                <li key={item.id} className={styles.trackItem}>
                  <Image
                    src={item.album.images[2]?.url}
                    alt={item.name}
                    width={48}
                    height={48}
                    className={styles.trackImage}
                  />
                  <div className={styles.trackInfo}>
                    <strong>{item.name}</strong>
                    <br />
                    {item.artists.map((a: any) => a.name).join(", ")}
                  </div>
                </li>
              );
            } else if (category === "artists") {
              return (
                <li key={item.id} className={styles.trackItem}>
                  <Image
                    src={item.images[2]?.url}
                    alt={item.name}
                    width={48}
                    height={48}
                    className={styles.trackImage}
                  />
                  <div className={styles.trackInfo}>
                    <strong>{item.name}</strong>
                  </div>
                </li>
              );
            } else {
              // genres
              return (
                <li key={item.genre} className={styles.trackItem}>
                  <Image
                    src={item.imageUrl}
                    alt={item.genre}
                    width={48}
                    height={48}
                    className={styles.trackImage}
                  />
                  <div className={styles.trackInfo}>
                    <strong>{item.genre}</strong>
                  </div>
                </li>
              );
            }
          })}
        </ul>
      )}
    </main>
  );
}
