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

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Fetch failed");
  return data;
};

const CATEGORIES = [
  { label: "Top Songs",   key: "tracks",  header: "Your Top 10 Most-Played Tracks" },
  { label: "Top Artists", key: "artists", header: "Your Top 10 Artists"            },
  { label: "Top Genres",  key: "genres",  header: "Your Top 10 Genres"             },
  { label: "Analyze",     key: "analyze", header: "Listening Time by Genre"         },
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

  const endpoint = session
    ? category === "analyze"
      ? `/api/spotify/genre-duration?time_range=${timeRange}`
      : `/api/spotify/top-${category}?time_range=${timeRange}`
    : null;

  const { data, error } = useSWR(endpoint, fetcher);

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
      <h1 className={styles.header}>
        {currentCat.header}{category !== "analyze" && ` (${currentTimeLabel})`}
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

      {/* Time-range tabs (hide on Analyze) */}
      {category !== "analyze" && (
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
      )}

      <button className={styles.button} onClick={() => signOut()}>
        Sign out
      </button>

      {/* Main content */}
      {category === "analyze" ? (
        <>
          <h2 style={{ fontSize: '1.5rem', margin: '1rem 0' }}>
            Listening Time by Genre
          </h2>
          <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: '#555' }}>
            Shows total minutes you’ve spent listening to each genre over the {currentTimeLabel.toLowerCase()} period.
          </h3>
          <div style={{ width: '100%', height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 20, right: 30, left: 150, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  label={{ value: "Minutes Listened", position: "bottom" }}
                />
                <YAxis
                  dataKey="genre"
                  type="category"
                  width={150}
                  tick={{ fontSize: 12, width: 150, wordWrap: 'break-word' }}
                />
                <Tooltip formatter={(val: number) => `${val} min`} />
                <Bar dataKey="minutes" fill="#9333EA" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <ul className={styles.trackList}>
          {data.map((item: any) => {
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
                    <strong>{item.name}</strong><br/>
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
            } else /* genres */ {
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
