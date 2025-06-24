// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";

// Local constant only—do NOT export this
const authOptions = {
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
    async jwt({ token, account }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.accessToken = token.accessToken;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

// Only these two exports are allowed in a Next.js Route Handler
export { handler as GET, handler as POST };
