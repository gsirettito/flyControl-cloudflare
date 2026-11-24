// auth.ts
import NextAuth, { DefaultSession, CredentialsSignin } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./utils/prisma";
import { sendEmail } from "./utils/email";
import bcrypt from "bcryptjs";

// 🔧 Extiende los tipos por defecto de NextAuth
declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            isAdmin: boolean;
            isSuperAdmin: boolean;
            companyId?: string | null;
        } & DefaultSession["user"];
    }
    interface JWT {
        id: string;
        isAdmin: boolean;
        isSuperAdmin: boolean;
        companyId?: string | null;
    }
}

class EmailNotVerified extends CredentialsSignin { code = "email_not_verified"; }

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID || process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || process.env.AUTH_GOOGLE_SECRET,
            checks: ["pkce", "state"],
        }),
        // 👇 NUEVO PROVEEDOR
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    // throw new Error("Faltan credenciales");
                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: { email: String(credentials.email).trim().toLowerCase() },
                });

                // Si no existe el usuario o no tiene contraseña (ej. se creó con Google)
                if (!user || !user.password) {
                    // throw new Error("Credenciales inválidas");
                    return null;
                }

                const isValid = await bcrypt.compare(credentials.password as string, user.password);
                if (!isValid) {
                    // throw new Error("Credenciales inválidas");
                    return null;
                }

                // 👇 VALIDACIÓN DE CORREO
                if (!user.emailVerified) {
                    throw new EmailNotVerified();
                }

                return user;
            },
        }),
    ],
    pages: {
        signIn: '/home',
        signOut: '/',
    },
    session: { strategy: "jwt" },
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            // 1. Si es un login inicial
            if (user) {
                token.id = user.id;
            }

            // Si el cliente nos pasa el companyId manualmente desde el Wizard
            if (trigger === "update" && session?.companyId) {
                token.companyId = session.companyId;
            }

            // 2. Si se fuerza una actualización (desde el Wizard) o es el login inicial
            if (user || trigger === "update") {
                const dbUser = await prisma.user.findUnique({
                    where: { id: token.id as string },
                    select: { isAdmin: true, isSuperAdmin: true, companyId: true },
                });
                token.isAdmin = dbUser?.isAdmin ?? false;
                token.isSuperAdmin = dbUser?.isSuperAdmin ?? false;
                token.companyId = dbUser?.companyId ?? null;
            }

            return token;
        },
        async session({ session, token }) {
            // Transferimos la información del token a la sesión
            if (token) {
                session.user.id = token.id as string;
                session.user.isAdmin = token.isAdmin as boolean;
                session.user.isSuperAdmin = token.isSuperAdmin as boolean;
                session.user.companyId = token.companyId as string | null;
            }
            return session;
        },
        // Autenticacion por google
        async signIn({ user, account, profile }) {
            // Solo procesamos si es un proveedor OAuth (Google) y tenemos email
            if (account?.provider === "google" && user?.email) {
                if (profile?.email_verified !== true) return false;
                // Buscar si ya existe un usuario con ese email en la base de datos
                const existingUser = await prisma.user.findUnique({
                    where: { email: user.email },
                    include: { accounts: true }, // para verificar si ya tiene cuenta de Google vinculada
                });

                if (existingUser) {
                    // No verificar una contraseña creada por un tercero mediante Google.
                    if (existingUser.password && !existingUser.emailVerified) return false;
                    // Verificar si ya tiene una cuenta de Google vinculada
                    const hasGoogleAccount = existingUser.accounts.some(
                        (acc) => acc.provider === "google"
                    );

                    if (!hasGoogleAccount) {
                        // No tiene cuenta de Google vinculada → la vinculamos manualmente
                        await prisma.account.create({
                            data: {
                                userId: existingUser.id,
                                type: account.type,
                                provider: account.provider,
                                providerAccountId: account.providerAccountId,
                                access_token: account.access_token,
                                refresh_token: account.refresh_token,
                                expires_at: account.expires_at,
                                token_type: account.token_type,
                                scope: account.scope,
                                id_token: account.id_token,
                                session_state: account.session_state as any,
                            },
                        });

                        // Opcional: actualizar nombre y avatar del usuario existente
                        await prisma.user.update({
                            where: { id: existingUser.id },
                            data: {
                                name: user.name ?? existingUser.name,
                                image: user.image ?? existingUser.image,
                                emailVerified: existingUser.emailVerified ?? new Date(),
                            },
                        });

                        // Retornamos `true` para permitir el inicio de sesión
                        return true;
                    }
                }
            }
            // Para cualquier otro caso, permitir el flujo normal
            return true;
        },
        async redirect({ url, baseUrl }) {
            if (url.startsWith("/")) return `${baseUrl}${url}`;
            if (new URL(url).origin === baseUrl) return `${baseUrl}/home`;
            return `${baseUrl}/home`;
        },
    },
    events: {
        async createUser({ user }) {
            // Para usuarios nuevos, genera tokenSecret
            // if (user.id) {
            //     await prisma.user.update({
            //         where: { id: user.id },
            //         data: { isAdmin: true },
            //     });
            // }

            // Me informa que entro un nuevo user
            if (!process.env.REGISTRATION_ALERT_EMAIL) return;
            const emailSent = await sendEmail({
                to: process.env.REGISTRATION_ALERT_EMAIL,
                subject: `⚠️ (FlyControl) Alerta: Nuevo Registro`,
                html: `
                    <h2>Nuevo Usuario Registrado</h2>
                    <p>${user.name || '-'} | ${user.email || '-'}</p>
                `,
            });

            // if (!emailSent) {
            //     console.warn(`No se pudo enviar el email de notificacion`);
            // }
        },
    },
    debug: process.env.NODE_ENV === "development",
});