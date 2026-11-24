// components/ButtonPayment.tsx
import { Button } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useState } from "react";

export const ButtonPayment = ({
    price,
    handleOnTx,
    onSubmitForm
}: {
    price: number;
    handleOnTx: (tx: string, redirectUrl: string) => void;
    onSubmitForm: () => void;
}) => {
    const [loading, setLoading] = useState(false);

    const onCreatePayment = async () => {
        setLoading(true);
        const url = new URL(`/api/system/payment`, window.location.origin);
        try {
            if (price <= 0) {
                notifications.show({
                    title: 'Error',
                    message: `La cantidad de SMS debe ser mayor a 1`,
                    color: 'red',
                });
                return
            }
            const res = await fetch(url.toString(), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ price })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.redirect_url && data.transaction_uuid) {
                    // 1. Llenar el campo TX en el formulario
                    handleOnTx(data.transaction_uuid, data.redirect_url);
                    // 2. Enviar el formulario automáticamente
                    onSubmitForm();
                    /* notifications.show({
                        title: "Éxito",
                        message: "Creando orden y redirigiendo...",
                        color: "green",
                    }); */
                } else {
                    notifications.show({
                        title: "Error",
                        message: "No se encontró la URL de redirección o el UUID",
                        color: "red",
                    });
                }
            } else {
                const errorData = await res.json().catch(() => ({}));
                notifications.show({
                    title: "Error en el pago",
                    message: errorData.message || "Ocurrió un error al crear el pago",
                    color: "red",
                });
            }
        } catch (error) {
            console.error("Error al crear el pago:", error);
            notifications.show({
                title: "Error de conexión",
                message: "No se pudo conectar con el servidor",
                color: "red",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button onClick={onCreatePayment} loading={loading} disabled={loading}>
            Realizar el Pago
        </Button>
    );
};