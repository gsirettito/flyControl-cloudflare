// proxy.ts
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// Inicializamos NextAuth con la configuración ligera (Edge-compatible)
export const { auth } = NextAuth(authConfig);

// Exportamos la función auth como el proxy por defecto
export default auth;

export const config = {
    // Excluimos las rutas de API y archivos estáticos
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};