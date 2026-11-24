import { auth } from "@/auth";
import { prisma } from "@/utils/prisma";
import { UserType } from "@/types/ModelsType";

export const getSession = async (): Promise<{
    user: UserType
}> => {
    // Obtener la sesión del servidor
    const session = await auth();

    // Si no hay sesión, devolvemos un objeto vacío para evitar que la app explote
    if (!session?.user?.id) {
        return { user: {} as UserType };
    }

    // 🔥 Buscamos el usuario en la BD e incluimos su compañía
    const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { company: true }
    });

    return {
        user: (dbUser || {}) as UserType
    }
}