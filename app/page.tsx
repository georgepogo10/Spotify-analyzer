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
    throw new Error(
      "Expected JSON from API but got HTML. Check that the API route exists."
    );
  }
  const data = JSON.parse(text);
  if (!res.ok) throw new Error(data.error || "Fetch failed");
  return data;
};

const CATEGORIES = [
  { label: "Top Songs", key: "tracks", header: "Your Top 10 Tracks", icon: "🎵" },
  { label: "Top Artists", key: "artists", header: "Your Top 10 Artists", icon: "🎤" },
  { label: "Top Genres", key: "genres", header: "Your Top 10 Genres", icon: "🎸" },
  { label: "Analyze", key: "analyze", header: "Audio-Feature Correlations", icon: "📊" },
];

const TIME_RANGES = [
  { label: "Last 4 Weeks", value: "short_term", emoji: "🍂" },
  { label: "Last 6 Months", value: "medium_term", emoji: "🍁" },
  { label: "All Time", value: "long_term", emoji: "🎃" },
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

  // Not signed in
  if (!session) {
    return (
      <main style={styles.fallContainer}>
        <div style={styles.fallLeaves}></div>
        <div style={styles.authCard}>
          <div style={styles.pumpkinIcon}>🎃</div>
          <h1 style={styles.fallHeader}>Autumn Spotify Insights</h1>
          <p style={styles.fallSubtitle}>
            Discover your musical journey through the seasons
          </p>
          <button
            style={styles.fallButton}
            onClick={() =>
              signIn("spotify", {
                callbackUrl: window.location.origin + "/",
              })
            }
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 12px 30px rgba(255, 127, 62, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(255, 127, 62, 0.3)';
            }}
          >
            <span style={styles.buttonIcon}>🍂</span>
            Sign in with Spotify
          </button>
        </div>
      </main>
    );
  }

  // Error or loading states
  if (error) {
    return (
      <main style={styles.fallContainer}>
        <div style={styles.errorCard}>
          <p style={styles.fallError}>🍂 Error: {error.message}</p>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main style={styles.fallContainer}>
        <div style={styles.loadingCard}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Loading your autumn playlist...</p>
        </div>
      </main>
    );
  }

  const currentCat = CATEGORIES.find((c) => c.key === category)!;
  const currentTimeLabel = TIME_RANGES.find((t) => t.value === timeRange)!.label;

  return (
    <main style={styles.fallContainer}>
      <div style={styles.fallLeaves}></div>
      
      <div style={styles.dashboardHeader}>
        <h1 style={styles.fallHeaderMain}>
          {currentCat.icon} {currentCat.header}
        </h1>
        <p style={styles.timeRangeLabel}>{currentTimeLabel}</p>
        <button 
          style={styles.signOutButton} 
          onClick={() => signOut()}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 127, 62, 0.2)';
            e.currentTarget.style.borderColor = '#ff7f3e';
            e.currentTarget.style.color = '#ff7f3e';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.color = '#d4a574';
          }}
        >
          Sign out
        </button>
      </div>

      {/* Category tabs */}
      <div style={styles.categoryGrid}>
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            style={{
              ...styles.categoryCard,
              ...(category === c.key ? styles.categoryCardActive : {}),
            }}
            onClick={() => {
              setCategory(c.key);
              setTimeRange("medium_term");
            }}
            onMouseEnter={(e) => {
              if (category !== c.key) {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.borderColor = '#ff7f3e';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 127, 62, 0.3)';
                e.currentTarget.style.background = 'rgba(255, 127, 62, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (category !== c.key) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(255, 127, 62, 0.2)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
                e.currentTarget.style.background = 'rgba(45, 24, 16, 0.85)';
              }
            }}
          >
            <span style={styles.categoryIcon}>{c.icon}</span>
            <span style={styles.categoryLabel}>{c.label}</span>
          </button>
        ))}
      </div>

      {/* Time-range tabs */}
      <div style={styles.timeRangeContainer}>
        {TIME_RANGES.map((t) => (
          <button
            key={t.value}
            style={{
              ...styles.timeRangeButton,
              ...(timeRange === t.value ? styles.timeRangeButtonActive : {}),
            }}
            onClick={() => setTimeRange(t.value)}
            onMouseEnter={(e) => {
              if (timeRange !== t.value) {
                e.currentTarget.style.borderColor = '#ff7f3e';
                e.currentTarget.style.color = '#ff7f3e';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              if (timeRange !== t.value) {
                e.currentTarget.style.borderColor = 'rgba(255, 127, 62, 0.2)';
                e.currentTarget.style.color = '#d4a574';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            <span style={styles.timeEmoji}>{t.emoji}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div style={styles.contentCard}>
        {category === "analyze" ? (
          <>
            <h2 style={styles.analyzeTitle}>Correlation Heatmap</h2>
            <h3 style={styles.analyzeSubtitle}>
              Pearson correlation coefficients between audio features (–1 to +1)
            </h3>
            <div style={styles.heatmapContainer}>
              <table style={styles.heatmapTable}>
                <thead>
                  <tr>
                    <th style={styles.heatmapCorner}></th>
                    {(data.keys as string[]).map((col) => (
                      <th key={col} style={styles.heatmapHeader}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data.keys as string[]).map((rowKey, i) => (
                    <tr key={rowKey}>
                      <th style={styles.heatmapRowHeader}>{rowKey}</th>
                      {(data.matrix as number[][])[i].map((val, j) => {
                        const red = val > 0 ? Math.round(val * 200) + 55 : 55;
                        const green = val > 0 ? Math.round(val * 120) + 35 : 35;
                        const blue = val < 0 ? Math.round(-val * 180) + 75 : 30;
                        const bg = `rgb(${red},${green},${blue})`;
                        const shade = Math.abs(val) > 0.5 ? "#fff" : "#1a1a1a";
                        return (
                          <td
                            key={j}
                            style={{
                              ...styles.heatmapCell,
                              backgroundColor: bg,
                              color: shade,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.15)';
                              e.currentTarget.style.zIndex = '10';
                              e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.5)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.zIndex = '1';
                              e.currentTarget.style.boxShadow = 'none';
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
          <ul style={styles.itemList}>
            {(data as any[]).map((item: any, index: number) => {
              if (category === "tracks") {
                return (
                  <li 
                    key={item.id} 
                    style={styles.itemCard}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 127, 62, 0.1)';
                      e.currentTarget.style.borderColor = '#ff7f3e';
                      e.currentTarget.style.transform = 'translateX(10px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                      e.currentTarget.style.borderColor = 'rgba(255, 127, 62, 0.1)';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <span style={styles.itemRank}>{index + 1}</span>
                    <div style={styles.itemImageWrapper}>
                      <Image
                        src={item.album.images[2]?.url}
                        alt={item.name}
                        width={64}
                        height={64}
                        style={styles.itemImage}
                      />
                    </div>
                    <div style={styles.itemInfo}>
                      <strong style={styles.itemTitle}>{item.name}</strong>
                      <span style={styles.itemSubtitle}>
                        {item.artists.map((a: any) => a.name).join(", ")}
                      </span>
                    </div>
                  </li>
                );
              } else if (category === "artists") {
                return (
                  <li 
                    key={item.id} 
                    style={styles.itemCard}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 127, 62, 0.1)';
                      e.currentTarget.style.borderColor = '#ff7f3e';
                      e.currentTarget.style.transform = 'translateX(10px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                      e.currentTarget.style.borderColor = 'rgba(255, 127, 62, 0.1)';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <span style={styles.itemRank}>{index + 1}</span>
                    <div style={styles.itemImageWrapper}>
                      <Image
                        src={item.images[2]?.url}
                        alt={item.name}
                        width={64}
                        height={64}
                        style={styles.itemImage}
                      />
                    </div>
                    <div style={styles.itemInfo}>
                      <strong style={styles.itemTitle}>{item.name}</strong>
                    </div>
                  </li>
                );
              } else {
                return (
                  <li 
                    key={item.genre} 
                    style={styles.itemCard}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 127, 62, 0.1)';
                      e.currentTarget.style.borderColor = '#ff7f3e';
                      e.currentTarget.style.transform = 'translateX(10px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                      e.currentTarget.style.borderColor = 'rgba(255, 127, 62, 0.1)';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <span style={styles.itemRank}>{index + 1}</span>
                    <div style={styles.itemImageWrapper}>
                      <Image
                        src={item.imageUrl}
                        alt={item.genre}
                        width={64}
                        height={64}
                        style={styles.itemImage}
                      />
                    </div>
                    <div style={styles.itemInfo}>
                      <strong style={styles.itemTitle}>{item.genre}</strong>
                    </div>
                  </li>
                );
              }
            })}
          </ul>
        )}
      </div>
    </main>
  );
}

// Inline styles object
const styles: { [key: string]: React.CSSProperties } = {
  fallContainer: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1a0e0a 0%, #2d1810 50%, #1a0e0a 100%)',
    padding: '2rem',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  fallLeaves: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: 0,
    backgroundImage: `
      radial-gradient(2px 2px at 20% 30%, rgba(255, 127, 62, 0.3), transparent),
      radial-gradient(2px 2px at 60% 70%, rgba(255, 179, 71, 0.3), transparent),
      radial-gradient(1px 1px at 50% 50%, rgba(196, 69, 54, 0.3), transparent),
      radial-gradient(1px 1px at 80% 10%, rgba(255, 153, 102, 0.3), transparent)
    `,
    backgroundSize: '200% 200%, 300% 300%, 250% 250%, 400% 400%',
    opacity: 0.6,
  },
  authCard: {
    position: 'relative',
    zIndex: 1,
    maxWidth: '500px',
    margin: '10rem auto',
    padding: '3rem',
    background: 'rgba(45, 24, 16, 0.85)',
    backdropFilter: 'blur(20px)',
    borderRadius: '24px',
    border: '2px solid rgba(255, 127, 62, 0.2)',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 80px rgba(255, 127, 62, 0.1)',
    textAlign: 'center',
  },
  pumpkinIcon: {
    fontSize: '5rem',
    marginBottom: '1.5rem',
  },
  fallHeader: {
    fontSize: '2.5rem',
    fontWeight: 800,
    color: '#fff8f0',
    marginBottom: '0.5rem',
    background: 'linear-gradient(135deg, #ff7f3e, #ffb347)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  fallSubtitle: {
    color: '#d4a574',
    fontSize: '1.1rem',
    marginBottom: '2rem',
    lineHeight: 1.6,
  },
  fallButton: {
    position: 'relative',
    background: 'linear-gradient(135deg, #ff7f3e, #c44536)',
    color: 'white',
    border: 'none',
    padding: '1rem 2.5rem',
    fontSize: '1.1rem',
    fontWeight: 600,
    borderRadius: '50px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.75rem',
    overflow: 'hidden',
    boxShadow: '0 8px 20px rgba(255, 127, 62, 0.3)',
  },
  buttonIcon: {
    fontSize: '1.3rem',
  },
  dashboardHeader: {
    position: 'relative',
    zIndex: 1,
    textAlign: 'center',
    marginBottom: '3rem',
  },
  fallHeaderMain: {
    fontSize: '2.5rem',
    fontWeight: 800,
    color: '#fff8f0',
    marginBottom: '0.5rem',
    textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
  },
  timeRangeLabel: {
    color: '#d4a574',
    fontSize: '1.2rem',
    marginBottom: '1rem',
  },
  signOutButton: {
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    color: '#d4a574',
    padding: '0.5rem 1.5rem',
    borderRadius: '30px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '0.9rem',
    backdropFilter: 'blur(10px)',
  },
  categoryGrid: {
    position: 'relative',
    zIndex: 1,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1.5rem',
    maxWidth: '1200px',
    margin: '0 auto 2rem',
  },
  categoryCard: {
    background: 'rgba(45, 24, 16, 0.85)',
    backdropFilter: 'blur(20px)',
    border: '2px solid rgba(255, 127, 62, 0.2)',
    borderRadius: '16px',
    padding: '1.5rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
  },
  categoryCardActive: {
    background: 'linear-gradient(135deg, rgba(255, 127, 62, 0.2), rgba(255, 179, 71, 0.2))',
    borderColor: '#ff7f3e',
    boxShadow: '0 8px 25px rgba(255, 127, 62, 0.4)',
  },
  categoryIcon: {
    fontSize: '2.5rem',
  },
  categoryLabel: {
    color: '#fff8f0',
    fontWeight: 600,
    fontSize: '1.1rem',
  },
  timeRangeContainer: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
    marginBottom: '2rem',
    flexWrap: 'wrap',
  },
  timeRangeButton: {
    background: 'rgba(45, 24, 16, 0.85)',
    backdropFilter: 'blur(20px)',
    border: '2px solid rgba(255, 127, 62, 0.2)',
    color: '#d4a574',
    padding: '0.75rem 1.5rem',
    borderRadius: '50px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  timeRangeButtonActive: {
    background: 'linear-gradient(135deg, #ff7f3e, #c44536)',
    color: 'white',
    borderColor: '#ff7f3e',
    boxShadow: '0 6px 20px rgba(255, 127, 62, 0.4)',
  },
  timeEmoji: {
    fontSize: '1.2rem',
  },
  contentCard: {
    position: 'relative',
    zIndex: 1,
    maxWidth: '1200px',
    margin: '0 auto',
    background: 'rgba(45, 24, 16, 0.85)',
    backdropFilter: 'blur(20px)',
    borderRadius: '24px',
    border: '2px solid rgba(255, 127, 62, 0.2)',
    padding: '2rem',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
  },
  itemList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  itemCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    padding: '1rem',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 127, 62, 0.1)',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
  },
  itemRank: {
    fontSize: '1.5rem',
    fontWeight: 800,
    color: '#ff7f3e',
    minWidth: '40px',
    textAlign: 'center',
  },
  itemImageWrapper: {
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
    transition: 'transform 0.3s ease',
  },
  itemImage: {
    display: 'block',
    borderRadius: '12px',
  },
  itemInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    flex: 1,
  },
  itemTitle: {
    color: '#fff8f0',
    fontSize: '1.1rem',
    fontWeight: 600,
  },
  itemSubtitle: {
    color: '#d4a574',
    fontSize: '0.9rem',
  },
  analyzeTitle: {
    color: '#fff8f0',
    fontSize: '1.8rem',
    fontWeight: 700,
    marginBottom: '0.5rem',
    textAlign: 'center',
  },
  analyzeSubtitle: {
    color: '#d4a574',
    fontSize: '1rem',
    marginBottom: '2rem',
    textAlign: 'center',
    lineHeight: 1.6,
  },
  heatmapContainer: {
    overflowX: 'auto',
    padding: '1rem',
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '12px',
  },
  heatmapTable: {
    borderCollapse: 'collapse',
    margin: 'auto',
    borderSpacing: '4px',
  },
  heatmapCorner: {
    padding: '8px',
  },
  heatmapHeader: {
    padding: '8px',
    fontSize: '0.85rem',
    textAlign: 'center',
    color: '#ff7f3e',
    fontWeight: 600,
  },
  heatmapRowHeader: {
    padding: '8px',
    fontSize: '0.85rem',
    textAlign: 'right',
    color: '#ff7f3e',
    fontWeight: 600,
  },
  heatmapCell: {
    width: '50px',
    height: '50px',
    textAlign: 'center',
    fontSize: '0.8rem',
    fontWeight: 600,
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
  },
  loadingCard: {
    position: 'relative',
    zIndex: 1,
    maxWidth: '400px',
    margin: '10rem auto',
    padding: '3rem',
    background: 'rgba(45, 24, 16, 0.85)',
    backdropFilter: 'blur(20px)',
    borderRadius: '24px',
    border: '2px solid rgba(255, 127, 62, 0.2)',
    textAlign: 'center',
  },
  spinner: {
    width: '60px',
    height: '60px',
    border: '4px solid rgba(255, 127, 62, 0.2)',
    borderTopColor: '#ff7f3e',
    borderRadius: '50%',
    margin: '0 auto 1.5rem',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    color: '#d4a574',
    fontSize: '1.1rem',
  },
  errorCard: {
    position: 'relative',
    zIndex: 1,
    maxWidth: '500px',
    margin: '10rem auto',
    padding: '2rem',
    background: 'rgba(45, 24, 16, 0.85)',
    backdropFilter: 'blur(20px)',
    borderRadius: '24px',
    border: '2px solid rgba(196, 69, 54, 0.5)',
    textAlign: 'center',
  },
  fallError: {
    color: '#c44536',
    fontSize: '1.1rem',
  },
};