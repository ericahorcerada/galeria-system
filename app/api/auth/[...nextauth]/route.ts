import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getPool } from "@/lib/db";

function splitName(fullName: string | null | undefined) {
  const clean = (fullName || "Google User").trim();
  const parts = clean.split(/\s+/);
  const firstName = parts.shift() || "Google";
  const lastName = parts.join(" ") || "User";
  return { firstName, lastName, fullName: clean };
}

async function getCustomerColumns() {
  const pool = getPool();

  const [rows] = await pool.execute(
    `
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'customers'
    `
  );

  return new Set((rows as Array<{ COLUMN_NAME: string }>).map((row) => row.COLUMN_NAME));
}

async function createOrUpdateGoogleCustomer(user: {
  email?: string | null;
  name?: string | null;
}) {
  if (!user.email) return false;

  const pool = getPool();
  const email = user.email.toLowerCase();
  const { firstName, lastName, fullName } = splitName(user.name);
  const columns = await getCustomerColumns();

  const insertColumns: string[] = [];
  const placeholders: string[] = [];
  const values: string[] = [];
  const updates: string[] = [];

  function addColumn(column: string, value: string, update = true) {
    if (!columns.has(column)) return;

    insertColumns.push(column);
    placeholders.push("?");
    values.push(value);

    if (update) {
      updates.push(`${column} = VALUES(${column})`);
    }
  }

  addColumn("email", email, false);

  if (columns.has("first_name")) addColumn("first_name", firstName);
  if (columns.has("last_name")) addColumn("last_name", lastName);
  if (columns.has("full_name")) addColumn("full_name", fullName);
  if (columns.has("name")) addColumn("name", fullName);
  if (columns.has("customer_name")) addColumn("customer_name", fullName);

  if (columns.has("password_hash")) addColumn("password_hash", "GOOGLE_ACCOUNT", false);
  if (columns.has("password")) addColumn("password", "GOOGLE_ACCOUNT", false);

  if (columns.has("phone")) addColumn("phone", "", false);
  if (columns.has("created_at")) {
    insertColumns.push("created_at");
    placeholders.push("NOW()");
  }
  if (columns.has("updated_at")) {
    insertColumns.push("updated_at");
    placeholders.push("NOW()");
    updates.push("updated_at = NOW()");
  }

  if (!columns.has("email")) {
    throw new Error("customers table must have an email column for Google login");
  }

  const updateSql = updates.length > 0 ? updates.join(", ") : "email = VALUES(email)";

  await pool.execute(
    `
    INSERT INTO customers (${insertColumns.join(", ")})
    VALUES (${placeholders.join(", ")})
    ON DUPLICATE KEY UPDATE ${updateSql}
    `,
    values
  );

  return true;
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
      await createOrUpdateGoogleCustomer(user);
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