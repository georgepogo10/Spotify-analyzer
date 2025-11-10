// app/api/auth/[...nextauth]/route.ts

// Run this handler in Node.js (required by next-auth)
export const runtime = "nodejs";

import NextAuth, { NextAuthOptions } from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";

/**
 * Refreshes an expired Spotify access token using the refresh token
 * @param token - The JWT token containing the refresh token
 * @returns Updated token with new access token and expiry
 */
async function refreshAccessToken(token: any) {
  try {
    const url = "https://accounts.spotify.com/api/token";
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        // Spotify requires Basic Auth with client credentials
        Authorization: `Basic ${Buffer.from(
          `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      // Spotify may return a new refresh token, otherwise keep the old one
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    console.error("Error refreshing access token:", error);
    
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

const authOptions: NextAuthOptions = {
  // 1) Register Spotify as a NextAuth provider
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: {
        // Always prompt the user to choose an account
        params: {
          scope: "user-top-read user-read-recently-played",
          show_dialog: "true",
        },
      },
    }),
  ],

  // 2) Tell NextAuth to use your home page ("/") as the Sign In page
  pages: {
    signIn: "/",
  },

  // 3) Callbacks to persist the Spotify access token and handle redirects
  callbacks: {
    // Persist Spotify access_token and refresh_token on first sign-in
    async jwt({ token, account }) {
      // Initial sign in - save tokens and expiry
      if (account) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          // Spotify tokens expire in 1 hour (3600 seconds)
          accessTokenExpires: account.expires_at 
            ? account.expires_at * 1000 
            : Date.now() + 3600 * 1000,
        };
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      // Access token has expired, try to refresh it
      console.log("Access token expired, refreshing...");
      return refreshAccessToken(token);
    },

    // Make the accessToken available in session
    async session({ session, token }) {
      session.user.accessToken = token.accessToken as string;
      session.error = token.error as string | undefined;
      return session;
    },

    // After sign-in, always send the user back to your base URL
    async redirect({ url, baseUrl }) {
      return baseUrl;
    },
  },

  // 4) Secret used to encrypt the JWT
  secret: process.env.NEXTAUTH_SECRET,
};

// 5) Create and export the actual route handlers
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };