// components/GlobeMap.tsx
'use client';

import dynamic from 'next/dynamic';
import { useRef } from 'react';
import { primary } from '../ui/Theme/color';

// NOTA: Cree la imagen del mundo aca https://www.worldindots.com/

const Globe = dynamic(() => import('react-globe.gl').then(mod => mod.default), {
    ssr: false,
    loading: () => (
        <div style={{ width: '100%', height: '100%', color: primary[5], backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            Cargando...
        </div>
    ),
});

export const GlobeMap = () => {
    const globeRef = useRef<any>({});

    const onGlobeReady = () => {
        if (globeRef.current) {
            const controls = globeRef.current.controls();
            // Deshabilitar zoom, rotación manual y paneo
            controls.enableZoom = false;
            controls.enableRotate = false;
            controls.enablePan = false;
            // Activar rotación automática
            controls.autoRotate = true;
            controls.autoRotateSpeed = 1.5;

            globeRef.current.pointOfView({ altitude: 1.5 }, 0); // 0 ms de transición
        }
    };

    return (
        <Globe
            ref={globeRef}
            width={600}
            height={600}
            globeImageUrl="/word-dotted.png"
            backgroundColor="rgba(221, 32, 32, 0)"
            showAtmosphere={true}
            atmosphereColor="rgba(255, 251, 238, 0.9)"
            atmosphereAltitude={0.4}
            onGlobeReady={onGlobeReady}
        />
    );
};