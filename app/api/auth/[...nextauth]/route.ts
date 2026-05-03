import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,

  session: {
    strategy: "jwt",
  },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile",
        },
      },
    }),
  ],

  pages: {
    signIn: "/login",
    error: "/login",
  },

  callbacks: {
    async signIn({ account, profile }) {
      const googleProfile = profile as
        | {
            email?: unknown;
          }
        | undefined;

      if (account?.provider !== "google") {
        return false;
      }

      if (typeof googleProfile?.email !== "string") {
        return false;
      }

      return true;
    },

    async jwt({ token, account, profile }) {
      const googleProfile = profile as
        | {
            email?: unknown;
            name?: unknown;
          }
        | undefined;

      if (account?.provider === "google") {
        token.provider = "google";
      }

      if (typeof googleProfile?.email === "string") {
        token.email = googleProfile.email;
      }

      if (typeof googleProfile?.name === "string") {
        token.name = googleProfile.name;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        if (typeof token.email === "string") {
          session.user.email = token.email;
        }

        if (typeof token.name === "string") {
          session.user.name = token.name;
        }
      }

      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url.includes("/api/google-success")) {
        return `${baseUrl}/api/google-success`;
      }

      if (url.includes("/customer/dashboard")) {
        return `${baseUrl}/api/google-success`;
      }

      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }

      if (url.startsWith(baseUrl)) {
        return url;
      }

      return `${baseUrl}/api/google-success`;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };