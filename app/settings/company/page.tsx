import { DashboardLayout } from '@/components/DashboardLayout';
import { CompanySettings } from '@/modules/settings/company';
import { CompanyType } from '@/types/ModelsType';
import { prisma } from '@/utils/prisma';
import { getSession } from '@/utils/server/getSession';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function CompanySettingsPage() {
    const { user } = await getSession();
    const _user = await prisma.user.findUnique({ where: { id: user.id }, select: { companyId: true } });
    if (!_user?.companyId) return redirect("/home");

    const _company = await prisma.company.findUnique({ where: { id: _user.companyId } }) as CompanyType;

    return (
        <DashboardLayout user={user}>
            <CompanySettings company={_company} />
        </DashboardLayout>
    );
}