// app/api/auth/[...nextauth]/route.ts

// Run this handler in Node.js (required by next-auth)
export const runtime = "nodejs";

import NextAuth, { NextAuthOptions } from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";

const authOptions: NextAuthOptions = {
  // 1) Register Spotify as a NextAuth provider
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "user-top-read user-read-recently-played",
        },
      },
    }),
  ],

  // 2) Callbacks to persist the Spotify access token and redirect home
  callbacks: {
    // Persist Spotify access_token on first sign-in
    async jwt({ token, account }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      return token;
    },

    // Make the accessToken available in session
    async session({ session, token }) {
      session.user.accessToken = token.accessToken as string;
      return session;
    },

    // After sign-in, always send the user back to the base URL
    async redirect({ url, baseUrl }) {
      return baseUrl;
    },
  },

  // 3) Secret used to encrypt the JWT
  secret: process.env.NEXTAUTH_SECRET,
};

// This creates the actual API route handlers (GET & POST)
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
