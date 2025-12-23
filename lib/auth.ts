import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { executeQuery } from "@/lib/db";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: { params: { prompt: "select_account" } },
      allowDangerousEmailAccountLinking: true, 
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const users = await executeQuery("SELECT * FROM users WHERE email = $1", [credentials.email]) as any[];
        const user = users[0];
        if (user && user.password && await bcrypt.compare(credentials.password, user.password)) {
          return { id: user.id.toString(), name: user.name, email: user.email, image: user.image };
        }
        return null;
      }
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) (session.user as any).id = token.id;
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        await executeQuery(
          `INSERT INTO users (name, email, image) VALUES ($1, $2, $3) 
           ON CONFLICT (email) DO UPDATE SET name = $1`, 
          [user.name, user.email, user.image]
        );
      }
      return true;
    }
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: { signIn: '/' }
};