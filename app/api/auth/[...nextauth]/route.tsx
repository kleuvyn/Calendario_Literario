import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import type { NextAuthOptions } from "next-auth"
import { executeQuery } from "@/lib/db"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      try {
        await executeQuery(`
          INSERT INTO users (email, name, picture_url)
          VALUES ($1, $2, $3)
          ON CONFLICT (email) DO UPDATE SET 
          name = EXCLUDED.name, picture_url = EXCLUDED.picture_url
        `, [user.email, user.name ?? '', user.image ?? '']);
        return true;
      } catch (e) {
        return true; 
      }
    }
  },
  pages: {
    signIn: '/', 
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }