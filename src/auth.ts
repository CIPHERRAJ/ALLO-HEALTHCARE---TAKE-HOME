import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Removed PrismaAdapter to save database connections. 
  // We use JWT strategy, so we don't need a DB-backed session.
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const email = (credentials?.email as string)?.toLowerCase()?.trim();
        const password = credentials?.password as string;
        
        if (!email || !password) return null;

        try {
          // Check specifically for Admin
          const user = await prisma.user.findUnique({
            where: { email }
          });

          if (!user || !user.password) {
            console.log("AUTH_FAILED: User not found or no password", { email });
            return null;
          }

          const isPasswordValid = await bcrypt.compare(password, user.password);

          if (!isPasswordValid) {
            console.log("AUTH_FAILED: Wrong password", { email });
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error: any) {
          console.error("AUTH_CONNECTION_ERROR", error.message);
          // Distinguish between invalid credentials and database errors
          if (error.message.includes('max clients reached') || error.message.includes('connection')) {
            throw new Error("DATABASE_CONNECTION_ERROR");
          }
          return null;
        }
      }
    }),
  ],
  session: {
    strategy: "jwt",
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "fallback-secret-for-dev-only",
  trustHost: true,
  pages: {
    signIn: '/login',
  },
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.id as string,
        role: token.role as string,
      },
    }),
  },
});
