// auth.config.ts
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    pages: {
        signIn: "/",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const { pathname } = nextUrl;

            const isPublicRoute = 
                pathname === '/' || 
                pathname.startsWith('/api/auth') || 
                pathname.startsWith('/verify') ||
                pathname.startsWith('/_next') ||
                pathname.startsWith('/emails/') ||
                pathname === '/airports.json' ||
                pathname === '/favicon.ico';

            if (isPublicRoute) return true;
            
            // Si no está logueado, false (lo manda al login)
            return isLoggedIn;
        },
    },
    providers: [],
} satisfies NextAuthConfig;