/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import Image from "next/image";
import { useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import useSWR from "swr";
import styles from "./page.module.css";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Fetch failed");
  return data;
};

const CATEGORIES = [
  { label: "Top Songs", key: "tracks", header: "Your Top 10 Most-Played Tracks" },
  { label: "Top Artists", key: "artists", header: "Your Top 10 Artists" },
  { label: "Top Genres", key: "genres", header: "Your Top 10 Genres" },
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
    ? `/api/spotify/top-${category}?time_range=${timeRange}`
    : null;

  const { data, error } = useSWR(endpoint, fetcher);

  if (!session) {
    return (
      <main className={styles.container}>
        <h1 className={styles.header}>☀️ Summer Vibes</h1>
        <button className={styles.button} onClick={() => signIn("spotify")}>Sign in with Spotify</button>
      </main>
    );
  }

  const currentCat = CATEGORIES.find((c) => c.key === category)!;
  const currentTimeLabel = TIME_RANGES.find((t) => t.value === timeRange)!.label;

  return (
    <main className={styles.container}>
      <h1 className={styles.header}>{currentCat.header} ({currentTimeLabel})</h1>

      {/* Main category tabs */}
      <div className={styles.categoryTabContainer}>
        {CATEGORIES.map((c) => (
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

      {/* Time-range sub-tabs */}
      <div className={styles.tabContainer}>
        {TIME_RANGES.map((t) => (
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

      <button className={styles.button} onClick={() => signOut()}>Sign out</button>

      {error && <p className={styles.error}>Error: {error.message}</p>}
      {!data && !error && <p>Loading…</p>}

      {data && (
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
                    <strong>{item.name}</strong><br />
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
              // genres: show the genre’s image from Spotify
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
