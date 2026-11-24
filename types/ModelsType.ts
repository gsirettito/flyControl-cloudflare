// ==================== MODELOS ====================
export type UserType = {
    id: string;
    email: string;
    name: string | null;
    isAdmin: boolean;
    isSuperAdmin: boolean;
    isManager: boolean;
    createdAt: Date;
    updatedAt: Date;
    company: CompanyType
    companyId: string
};

export type CompanyType = {
    id: string;
    commercialName: string;
    logoUrl: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
    textColor: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    ticketPrefix: string | null;
    preReservationExpiryHours: number | null;
    createdAt: Date;
    updatedAt: Date;
    notifySmsConfirm?: boolean;
    notifyEmailConfirm?: boolean;
    notifyManagerEmail?: boolean;
    notifyFlightReminders?: boolean;
};

export type AirlineType = {
    id: string;
    iata: string;
    icao: string;
    officialName: string;
    displayName: string;
    logoUrl?: string | null;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
};

export type FlightClass = "ECONOMY" | "BUSINESS" | "FIRST";

export type FlightType = {
    id: string;
    flightNumber: string;
    airlineId: string;
    departureTime: Date | string;
    arrivalTime: Date | string;
    origin: string;
    destination: string;
    originName?: string | null;
    destinationName?: string | null;
    originTimezone?: string | null;
    destinationTimezone?: string | null;
    class: FlightClass;
    availableSeats: number;
    createdAt: Date;
    updatedAt: Date;
    airline?: AirlineType;
    _count?: {
        reservationDepartureFlights: number;
        reservationReturnFlights: number
    }
};

export type ClientTypeType = "INFANT" | "CHILD" | "ADULT";

export type ClientType = {
    id: string;
    fullName: string;
    passportNumber: string;
    email?: string | null;
    phone: string;
    passportIssueDate?: Date | string | null;
    passportExpiryDate: Date | string;
    type: ClientTypeType;
    nationality: string;
    birthDate: Date | string;
    createdAt: Date;
    updatedAt: Date;
};

// Enums
export type TripType = "ONE_WAY" | "ROUND_TRIP";
export type ReservationStatus = "PENDING" | "CONFIRMED" | "REJECTED";

// Tipos para las relaciones intermedias (si necesitas usarlas directamente)
export type ReservationDepartureFlight = {
    reservationId: string;
    flightId: string;
    flight?: FlightType;
};

export type ReservationReturnFlight = {
    reservationId: string;
    flightId: string;
    flight?: FlightType;
};

// Tipo principal de Reserva
export type ReservationType = {
    id: string;
    reservationCode: string;
    tripType: TripType;
    departureFlights?: ReservationDepartureFlight[];
    returnFlights?: ReservationReturnFlight[];
    passengerId: string;
    passenger?: ClientType;          // Cliente que viaja (pasajero)
    createdByUserId: string;
    createdBy?: UserType;             // Gestor o admin que creó la reserva
    companyId?: string;
    company?: CompanyType;
    baggage: string;                  // Puede ser texto libre o JSON string
    invoiceAmount?: number | null;
    invoiceCurrency?: string | null;  // Ej: "USD", "EUR"
    status: ReservationStatus;
    pnr?: string | null;              // Código PNR de la aerolínea
    ticketNumber?: string | null;
    pdfURL?: string;
    createdAt: string | Date;
    updatedAt: string | Date;
};

// Tipo simplificado para listados (sin relaciones anidadas pesadas)
export type ReservationListItem = {
    id: string;
    reservationCode: string;
    tripType: TripType;
    passengerName: string;
    passengerEmail?: string | null;
    createdByUserName?: string;
    status: ReservationStatus;
    createdAt: string | Date;
    updatedAt: string | Date;
};
