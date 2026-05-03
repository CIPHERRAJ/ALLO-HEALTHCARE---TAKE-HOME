import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma as any),
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
          // 1. Fallback: Ensure Admin exists if someone goes straight to login
          if (email === 'admin@allo.com') {
             const adminCheck = await prisma.user.findUnique({ where: { email } });
             if (!adminCheck) {
                console.log("AUTH_EMERGENCY_INIT_ADMIN");
                const adminPassword = await bcrypt.hash('AdminPassword123!', 10);
                await prisma.user.create({
                  data: {
                    name: 'System Administrator',
                    email: 'admin@allo.com',
                    password: adminPassword,
                    role: 'ADMIN',
                  },
                });
             }
          }

          const user = await prisma.user.findUnique({
            where: { email }
          });

          if (!user) {
            console.log("AUTH_USER_NOT_FOUND", { email });
            return null;
          }

          if (!user.password) {
            console.log("AUTH_USER_NO_PASSWORD", { email });
            return null;
          }

          const isPasswordValid = await bcrypt.compare(password, user.password);

          console.log("AUTH_PASSWORD_CHECK", { 
            email, 
            isValid: isPasswordValid,
            hashPrefix: user.password.substring(0, 10) 
          });

          if (!isPasswordValid) {
            return null;
          }

          console.log("AUTH_SUCCESS", { email, role: user.role });
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error: any) {
          console.error("AUTH_ERROR", { 
            email, 
            message: error.message, 
            code: error.code,
            stack: error.stack 
          });
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
