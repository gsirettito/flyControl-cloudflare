"use client";

import { useEffect, useRef, useState } from "react";
import { TextInput, Button, Paper, Group, Text, Notification } from "@mantine/core";
import dynamic from "next/dynamic"; 

// Cargamos el Globo dinámicamente, desactivando el Server-Side Rendering
const Globe = dynamic(() => import("react-globe.gl"), { 
    ssr: false,
    loading: () => <p>Cargando globo 3D...</p> 
});

// Tipos
interface FlightData {
    icao24: string;
    callsign: string;
    origin_country: string;
    longitude: number;
    latitude: number;
    altitude: number;
    velocity: number;
}

export default function FlightGlobe() {
    const globeRef = useRef<any>(null);
    const [searchValue, setSearchValue] = useState("CM454"); // Valor por defecto
    const [flightData, setFlightData] = useState<FlightData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [flightPath, setFlightPath] = useState<[number, number][]>([]);
    const [planePosition, setPlanePosition] = useState<[number, number] | null>(null);

    // Configuración inicial del globo
    useEffect(() => {
        if (globeRef.current) {
            globeRef.current.pointOfView({ lat: 10, lng: -70 }, 0);
        }
    }, []);

    // Función para buscar el vuelo (llama a Next.js)
    const fetchFlight = async (callsign: string) => {
        setLoading(true);
        setError(null);
        setFlightPath([]); // Reiniciar ruta
        setPlanePosition(null);

        try {
            // Llamamos a nuestro propio endpoint de Next.js
            const response = await fetch(`/api/flight?callsign=${callsign.trim()}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Error al conectar con el servidor");
            }

            if (data.states && data.states.length > 0) {
                // Leemos el objeto que devuelve la API
                const s = data.states[0];
                const newFlight: FlightData = {
                    icao24: s.icao24,
                    callsign: s.callsign,
                    origin_country: s.origin_country,
                    longitude: s.longitude,
                    latitude: s.latitude,
                    altitude: s.altitude || 0,
                    velocity: s.velocity || 0,
                };

                setFlightData(newFlight);
                setPlanePosition([newFlight.latitude, newFlight.longitude]);
                setFlightPath([[newFlight.latitude, newFlight.longitude]]);

                // Mover la cámara hacia el avión
                globeRef.current.pointOfView({ lat: newFlight.latitude, lng: newFlight.longitude, altitude: 2 }, 2000);
            } else {
                setError(`No se encontró el vuelo ${callsign} en tiempo real.`);
            }
        } catch (err: any) {
            setError(err.message || "Hubo un problema al obtener los datos.");
        } finally {
            setLoading(false);
        }
    };

    // Polling: Actualizar la posición del vuelo cada 30 segundos
    useEffect(() => {
        if (!flightData) return;

        const interval = setInterval(async () => {
            try {
                // Llamada al endpoint de Next.js para actualizar posición
                const response = await fetch(`/api/flight?callsign=${flightData.callsign}`);
                const data = await response.json();

                if (data.states && data.states.length > 0) {
                    const s = data.states[0];
                    const newLat = s.latitude;
                    const newLng = s.longitude;

                    if (newLat && newLng) {
                        setPlanePosition([newLat, newLng]);
                        setFlightPath((prev) => [...prev, [newLat, newLng]]);
                    }
                }
            } catch (e) {
                console.error("Error actualizando posición", e);
            }
        }, 30000); // 30 segundos

        return () => clearInterval(interval);
    }, [flightData]);

    return (
        <div style={{ position: "relative", height: "100vh", width: "100%" }}>
            {/* Globo 3D */}
            <Globe
                ref={globeRef}
                globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
                bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"

                // Dibujar la ruta del avión (Arco)
                pathsData={flightPath.length > 1 ? [{ path: flightPath }] : []}
                pathColor={() => "rgba(255, 165, 0, 0.8)"}
                pathStroke={2}

                // Punto del avión
                pointsData={planePosition ? [{ lat: planePosition[0], lng: planePosition[1] }] : []}
                pointColor={() => "#ff0000"}
                pointAltitude={0.01}
                pointRadius={0.5}

                // Marcador HTML personalizado para el avión
                htmlElementsData={planePosition ? [{ lat: planePosition[0], lng: planePosition[1] }] : []}
                htmlElement={() => {
                    const el = document.createElement("div");
                    el.innerHTML = "✈️";
                    el.style.fontSize = "24px";
                    el.style.transform = "translate(-50%, -50%)";
                    return el;
                }}
            />

            {/* UI superpuesta con Mantine */}
            <Paper
                shadow="xl"
                p="md"
                style={{ position: "absolute", top: 20, left: 20, zIndex: 1000, width: 350, background: "rgba(255,255,255,0.95)" }}
            >
                <Text size="lg" w={700} mb="sm">Rastreador de Vuelos 3D</Text>
                <Group>
                    <TextInput
                        placeholder="Ej: CM454"
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.currentTarget.value.toUpperCase())}
                        style={{ flex: 1 }}
                    />
                    <Button onClick={() => fetchFlight(searchValue)} loading={loading}>
                        Buscar
                    </Button>
                </Group>

                {error && (
                    <Notification color="red" mt="sm" onClose={() => setError(null)}>
                        {error}
                    </Notification>
                )}

                {flightData && (
                    <div style={{ marginTop: 15 }}>
                        <Text size="sm"><b>Vuelo:</b> {flightData.callsign}</Text>
                        <Text size="sm"><b>País:</b> {flightData.origin_country}</Text>
                        <Text size="sm"><b>Altitud:</b> {flightData.altitude ? flightData.altitude.toFixed(0) : "N/A"} pies</Text>
                        <Text size="sm"><b>Velocidad:</b> {flightData.velocity ? flightData.velocity.toFixed(0) : "N/A"} nudos</Text>
                    </div>
                )}
            </Paper>
        </div>
    );
}