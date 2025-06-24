// app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";

//testing 1
console.log("▶️ SPOTIFY_CLIENT_ID:", process.env.SPOTIFY_CLIENT_ID);
console.log("▶️ SPOTIFY_CLIENT_SECRET:", process.env.SPOTIFY_CLIENT_SECRET?.slice(0,4) + "…");
console.log("▶️ NEXTAUTH_URL:", process.env.NEXTAUTH_URL);


export const authOptions: NextAuthOptions = {
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
  callbacks: {
    // When NextAuth calls `jwt()`, it knows `token` is your JWT
    async jwt({ token, account }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      return token;
    },

    // When NextAuth calls `session()`, it knows `session` is a Session
    async session({ session, token }) {
      session.user.accessToken = token.accessToken;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
