import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials"; 
import { executeQuery } from "@/lib/db";
import bcrypt from "bcrypt";

if (!process.env.NEXTAUTH_SECRET) {
  console.warn("⚠️ NEXTAUTH_SECRET não está definida. NextAuth pode não funcionar corretamente.");
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
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
        try {
          if (!credentials?.email || !credentials?.password) return null;
          const users = await executeQuery("SELECT * FROM users WHERE email = $1", [credentials.email]) as any[];
          const user = users[0];
          if (user && user.password && await bcrypt.compare(credentials.password, user.password)) {
            return { id: user.id.toString(), name: user.name, email: user.email, image: user.image };
          }
          return null;
        } catch (error) {
          console.error("Erro na autenticação:", error);
          return null;
        }
      }
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      try {
        if (user) {
          token.id = user.id;
          token.email = user.email;
          token.name = user.name;
          token.image = user.image ?? token.image;
          token.picture = user.image ?? token.picture;
        }
        return token;
      } catch (error) {
        console.error("Erro no callback jwt:", error);
        return token;
      }
    },
    async session({ session, token }) {
      try {
        if (session.user) {
          (session.user as any).id = token.id;
          session.user.email = token.email as string;
          session.user.name = (token.name as string) ?? session.user.name;
          session.user.image = (token.image as string) ?? (token.picture as string) ?? session.user.image;
        }
        return session;
      } catch (error) {
        console.error("Erro no callback session:", error);
        return session;
      }
    },
    async signIn({ user, account }) {
      try {
        if (account?.provider === "google") {
          await executeQuery(
            `INSERT INTO users (name, email, image) VALUES ($1, $2, $3) 
             ON CONFLICT (email) DO UPDATE SET name = COALESCE($1, name), image = COALESCE($3, image)`, 
            [user.name || "", user.email || "", user.image || ""]
          );
        }
        return true;
      } catch (error) {
        console.error("Erro no callback signIn:", error);
        return true;
      }
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  events: {
    async signIn({ user }: { user: any }) {
      console.log(`✓ Usuário ${user?.email} fez login`);
    },
    async signOut() {
      console.log(`✓ Usuário fez logout`);
    },
    // next-auth EventCallbacks does not include error, use fallback with any if needed
  } as any,
  session: { 
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: { signIn: "/" },
  debug: process.env.NODE_ENV === "development",
};