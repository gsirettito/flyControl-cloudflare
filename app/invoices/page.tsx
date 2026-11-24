// app/invoices/page.tsx
import { InvoicesIndex } from "@/modules/invoices";
import { getSession } from "@/utils/server/getSession";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout"; // 🔥 FIX: Importamos el Layout

export const dynamic = 'force-dynamic';

export default async function InvoicesPage() {
    const session = await getSession();
    if (!session?.user?.id) redirect('/');

    // 🔥 FIX: Envolvemos el componente en el Layout y le pasamos el usuario
    return (
        <DashboardLayout user={session.user}>
            <InvoicesIndex />
        </DashboardLayout>
    );
}