import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { query } from "@/lib/db";

function splitName(fullName: string | null | undefined) {
  const clean = (fullName || "Google User").trim();
  const parts = clean.split(/\s+/);
  const firstName = parts.shift() || "Google";
  const lastName = parts.join(" ") || "User";
  return { firstName, lastName };
}

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],

  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      const email = user.email.toLowerCase();
      const { firstName, lastName } = splitName(user.name);

      await query(
        `INSERT INTO customers (first_name, last_name, email, password_hash, phone, created_at)
         VALUES (?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE
           first_name = VALUES(first_name),
           last_name = VALUES(last_name)`,
        [firstName, lastName, email, "GOOGLE_ACCOUNT", ""]
      );

      return true;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (url.startsWith(baseUrl)) return url;
      return `${baseUrl}/shop`;
    },

    async session({ session }) {
      if (session.user?.email) {
        session.user.email = session.user.email.toLowerCase();
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET || process.env.SESSION_SECRET,
});

export { handler as GET, handler as POST };