import GoogleProvider from "next-auth/providers/google";

type RedirectParams = {
  url: string;
  baseUrl: string;
};

type SessionParams = {
  session: {
    user?: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    expires?: string;
  };
};

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],

  pages: {
    signIn: "/login",
  },

  callbacks: {
    async redirect({ url, baseUrl }: RedirectParams) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (url.startsWith(baseUrl)) return url;
      return `${baseUrl}/shop`;
    },

    async session({ session }: SessionParams) {
      if (session.user?.email) {
        session.user.email = session.user.email.toLowerCase();
      }

      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET || process.env.SESSION_SECRET,
};