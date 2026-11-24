import { Tracker } from "@/components/Tracker";
import { getMetadata } from "@/libs/getMetadata";
import { LoginIndex } from "@/modules/login";

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return getMetadata({
    title: "FlyControl – Sistema de gestión de reservas de vuelos y ticketing aéreo",
    description: "Sistema de gestión de reservas de vuelos y ticketing aéreo. Automatiza confirmaciones, cancelaciones y notificaciones por email. Ideal para agencias y operadores.",
    keywords: [
      "gestión de reservas de vuelos",
      "sistema de ticketing aéreo",
      "código PNR",
      "confirmación de reserva",
      "cancelación de vuelos",
      "notificaciones por email",
      "automatización de reservas",
      "plataforma SaaS para agencias de viajes",
      "control de itinerarios",
      "email marketing para aerolíneas",
      "reservas pendientes",
      "estado de reserva en tiempo real",
      "generador de números de ticket",
      "gestión de pasajeros"
    ]
  });
}

export default async function HomePage({ searchParams }: any) {

  return (
    <>
      <Tracker />
      <LoginIndex />
    </>
  );
}