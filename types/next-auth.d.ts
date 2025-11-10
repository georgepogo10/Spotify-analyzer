// types/next-auth.d.ts
import NextAuth, { DefaultSession } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` etc.
   */
  interface Session extends DefaultSession {
    user: DefaultSession["user"] & {
      /** Spotify access token added in `callbacks.session` */
      accessToken?: string;
    };
    /** Error flag when token refresh fails */
    error?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    /** Spotify access token persisted in `callbacks.jwt` */
    accessToken?: string;
    /** Spotify refresh token used to get new access tokens */
    refreshToken?: string;
    /** Timestamp when the access token expires (in milliseconds) */
    accessTokenExpires?: number;
    /** Error flag when token refresh fails */
    error?: string;
  }
}