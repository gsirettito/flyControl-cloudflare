// app/api/flight/route.ts
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const callsign = searchParams.get("callsign");
    
    if (!callsign) return NextResponse.json({ error: "callsign required" }, { status: 400 });

    try {
        // Next.js llama a tu servidor de Python internamente
        const response = await fetch(`http://localhost:8000/api/flight?callsign=${callsign.trim()}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Error al conectar con el servidor de Python");
        }

        // Devolvemos la data al Frontend
        return NextResponse.json(data);
    } catch (err: any) {
        console.error("Error en el proxy de Next.js:", err.message);
        return NextResponse.json({ error: "El servidor de Python no está activo o falló." }, { status: 500 });
    }
}