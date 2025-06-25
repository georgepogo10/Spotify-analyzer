// app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions, Session } from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";
import type { JWT } from "next-auth/jwt";

const authOptions: NextAuthOptions = {
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: {
        params: { scope: "user-top-read user-read-recently-played" },
      },
    }),
  ],
  callbacks: {
    // token is our JWT, account only present on first sign-in
    async jwt({
      token,
      account,
    }: {
      token: JWT;
      account?: { access_token?: string };
    }): Promise<JWT> {
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      return token;
    },

    // session is the returned session, token is our JWT
    async session({
      session,
      token,
    }: {
      session: Session;
      token: JWT & { accessToken?: string };
    }): Promise<Session> {
      session.user.accessToken = token.accessToken;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

// only these two exports are allowed in a Next.js Route Handler
export { handler as GET, handler as POST };
