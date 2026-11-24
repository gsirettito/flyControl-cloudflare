// components/Sidebar.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Title, Tooltip, UnstyledButton, Image, Avatar, useMantineColorScheme, ActionIcon } from '@mantine/core';
import classes from './Sidebar.module.css';
import { MenuItem, menuItems, SubMenuItem } from '@/constants/menu';
import { UserType } from '@/types/ModelsType';
import { useSession } from 'next-auth/react';
import { FiSun, FiMoon } from 'react-icons/fi';
import { primary, secondary } from '../Theme/color';

export function Sidebar({ user, opened }: { user: UserType, opened: boolean }) {
    const { data: session } = useSession();
    const pathname = usePathname();

    const { colorScheme, toggleColorScheme } = useMantineColorScheme();
    const isDark = colorScheme === 'dark';

    const userName = session?.user?.name || 'Usuario';
    const userImage = session?.user?.image || null;
    const userEmail = session?.user?.email || '';

    const [activeMain, setActiveMain] = useState<string>('');
    const [activeSubPath, setActiveSubPath] = useState<string>('');

    // Determina si un ítem principal debe mostrarse según el rol del usuario
    const shouldShowMenuItem = (item: MenuItem): boolean => {
        if (user.isSuperAdmin) return true;
        if (user.isAdmin) return !item.isSuperAdmin;
        return !item.isAdmin && !item.isSuperAdmin;
    };

    // Filtra los subítems de un ítem principal según el rol
    const getVisibleSubItems = (item: MenuItem): SubMenuItem[] => {
        if (user.isSuperAdmin) return item.subItems;
        if (user.isAdmin) return item.subItems; // Admin ve todos los subítems (aunque tengan isAdmin: true)
        // Manager: solo ve subítems con isAdmin === false
        return item.subItems.filter(sub => !sub.isAdmin);
    };

    // Construimos la lista filtrada de ítems principales con sus subítems visibles
    const filteredMenuItems = useMemo(() => {
        return menuItems
            .filter(shouldShowMenuItem)
            .map(item => ({
                ...item,
                subItems: getVisibleSubItems(item)
            }))
            .filter(item => item.subItems.length > 0); // opcional: ocultar menú si no tiene subítems visibles
    }, [user]);

    // Efecto para sincronizar estado activo con la ruta actual (solo sobre subítems visibles)
    useEffect(() => {
        for (const item of filteredMenuItems) {
            const foundSub = item.subItems.find(sub => {
                if (pathname === sub.path) return true;
                if (pathname.startsWith(sub.path + '/')) return true;
                return false;
            });
            if (foundSub) {
                setActiveMain(item.label);
                setActiveSubPath(foundSub.path);
                return;
            }
        }
        // Si no se encuentra ningún subítem, probar con basePath (solo si coincide exactamente)
        const mainMatch = filteredMenuItems.find(item => pathname === item.basePath);
        if (mainMatch && mainMatch.subItems.length > 0) {
            setActiveMain(mainMatch.label);
            setActiveSubPath(mainMatch.subItems[0].path);
        } else if (filteredMenuItems.length > 0) {
            const first = filteredMenuItems[0];
            setActiveMain(first.label);
            setActiveSubPath(first.subItems[0]?.path || '');
        }
    }, [pathname, filteredMenuItems]);

    // Obtiene el enlace del primer subítem visible (para el ícono lateral)
    const getMainLinkHref = (item: MenuItem): string => {
        if (item.subItems.length > 0) return item.subItems[0].path;
        if (item.basePath) return item.basePath;
        return '/';
    };

    // Componente para el ícono del menú lateral
    const ItemLink = ({ item }: { item: MenuItem }) => {
        const href = getMainLinkHref(item);
        return (
            <Tooltip label={item.label} position="right" withArrow key={item.label}>
                <Link href={href} className={classes.mainLink}>
                    <UnstyledButton
                        className={classes.mainLink}
                        data-active={item.label === activeMain || undefined}
                        component="div"
                    >
                        <item.icon size="14px" />
                    </UnstyledButton>
                </Link>
            </Tooltip>
        );
    };

    // Íconos del menú lateral (ya filtrados)
    const mainLinks = filteredMenuItems.map((item) => (
        <ItemLink item={item} key={item.basePath} />
    ));

    // Ítem actual (el que tiene el label activo)
    const currentItem = filteredMenuItems.find((item) => item.label === activeMain);
    const currentSubItems = currentItem?.subItems || [];

    // Enlaces secundarios (submenú) usando los subítems visibles
    const subLinks = currentSubItems.length > 0 ? (
        currentSubItems.map((sub) => (
            <Link
                key={sub.path}
                href={sub.path}
                className={classes.link}
                data-active={activeSubPath === sub.path || undefined}
            >
                {sub.label}
            </Link>
        ))
    ) : (
        <div className={classes.noSubItems}>No hay opciones</div>
    );

    return (
        <nav className={classes.navbar}>
            <div className={classes.wrapper}>
                <div className={classes.aside}>
                    <Link href={'/'}>
                        <div className={classes.logo}>
                            <Image src={'/favicon.png'} />
                        </div>
                    </Link>
                    {mainLinks}
                    <div style={{ height: '100%' }} />
                    <div style={{ paddingBottom: '20px' }}>
                        <ActionIcon style={{color: "var(--mantine-color-white)"}} visibleFrom='sm' onClick={() => toggleColorScheme()} title="Cambiar tema" variant='transparent'>
                            {isDark ? <FiSun size={18} /> : <FiMoon size={18} />}
                        </ActionIcon>
                    </div>
                    <div style={{ paddingBottom: '20px' }}>
                        <Avatar src={userImage} alt="" radius="xl" size={26} color="primary">
                            {!userImage && userName.charAt(0).toUpperCase()}
                        </Avatar>
                    </div>
                </div>
                {opened && (
                    <div className={classes.main}>
                        <Title order={4} className={classes.title}>
                            {activeMain}
                        </Title>
                        {subLinks}
                    </div>
                )}
            </div>
        </nav>
    );
}