export // Datos mock (el JSON proporcionado)
    const mockReservationsData = {
        "data": [
            {
                "id": "cmq9rnbf70000igjotewv6ec7",
                "reservationCode": "FLA000005",
                "tripType": "ONE_WAY",
                "passengerId": "cmq83sqx3000100joehsmm6gc",
                "passenger": {
                    "fullName": "Juliana Garcia Fonseca",
                    "email": "juliana@yandex.com",
                    "passportNumber": "R297879"
                },
                "createdByUserId": "cmq5fd7zx000030jogy9ynzqm",
                "createdBy": {
                    "name": "Josue Cb",
                    "email": "josueenigma3@gmail.com"
                },
                "departureFlights": [
                    {
                        "flight": {
                            "flightNumber": "CM795",
                            "origin": "PTY",
                            "originName": "Panama City Tocumen International Airport",
                            "destination": "UIO",
                            "destinationName": "Quito Mariscal Sucre International Airport",
                            "departureTime": "2026-06-12T14:25:00.000Z"
                        }
                    }
                ],
                "baggage": "2_MALETAS_DOC",
                "invoiceAmount": null,
                "invoiceCurrency": null,
                "status": "PENDING",
                "pnr": null,
                "ticketNumber": null,
                "pdfURL": "https://minio-api.noxcreation.dev/flycontrol/invoices/invoice_FLA000005.pdf",
                "createdAt": "2026-06-11T17:23:03.955Z",
                "updatedAt": "2026-06-11T17:23:06.608Z"
            },
            {
                "id": "cmq83trxf000200johcijn3vr",
                "reservationCode": "FLA000004",
                "tripType": "ONE_WAY",
                "passengerId": "cmq83sqx3000100joehsmm6gc",
                "passenger": {
                    "fullName": "Juliana Garcia Fonseca",
                    "email": "juliana@yandex.com",
                    "passportNumber": "R297879"
                },
                "createdByUserId": "cmq5fd7zx000030jogy9ynzqm",
                "createdBy": {
                    "name": "Josue Cb",
                    "email": "josueenigma3@gmail.com"
                },
                "departureFlights": [
                    {
                        "flight": {
                            "flightNumber": "CM125",
                            "origin": "PTY",
                            "originName": "Tocumen",
                            "destination": "MVD",
                            "destinationName": "Montevideo General C L Berisso",
                            "departureTime": "2026-06-09T17:35:00.000Z"
                        }
                    }
                ],
                "baggage": "SOLO_EQUIPAJE_MANO",
                "invoiceAmount": null,
                "invoiceCurrency": null,
                "status": "CONFIRMED",
                "pnr": "PNR452564",
                "ticketNumber": "TK56416514",
                "pdfURL": null,
                "createdAt": "2026-06-10T13:28:28.323Z",
                "updatedAt": "2026-06-10T13:29:04.008Z"
            },
            {
                "id": "cmq5tu2u80000owjobrugy6jo",
                "reservationCode": "FLA000003",
                "tripType": "ONE_WAY",
                "passengerId": "cmq5tctoe0000xcjo8zxwmmbg",
                "passenger": {
                    "fullName": "Juan Perez Perez",
                    "email": "josuecb@yandex.com",
                    "passportNumber": "R297875"
                },
                "createdByUserId": "cmq5fd7zx000030jogy9ynzqm",
                "createdBy": {
                    "name": "Josue Cb",
                    "email": "josueenigma3@gmail.com"
                },
                "departureFlights": [
                    {
                        "flight": {
                            "flightNumber": "CM125",
                            "origin": "PTY",
                            "originName": "Tocumen",
                            "destination": "MVD",
                            "destinationName": "Montevideo General C L Berisso",
                            "departureTime": "2026-06-09T17:35:00.000Z"
                        }
                    }
                ],
                "baggage": "SOLO_EQUIPAJE_MANO",
                "invoiceAmount": null,
                "invoiceCurrency": null,
                "status": "REJECTED",
                "pnr": null,
                "ticketNumber": null,
                "pdfURL": "https://minio-api.noxcreation.dev/flycontrol/invoices/invoice_FLA000003.pdf",
                "createdAt": "2026-06-08T23:13:13.952Z",
                "updatedAt": "2026-06-08T23:13:56.177Z"
            },
            {
                "id": "cmq5tov3q0000p4jo0ldcriro",
                "reservationCode": "FLA000002",
                "tripType": "ONE_WAY",
                "passengerId": "cmq5tctoe0000xcjo8zxwmmbg",
                "passenger": {
                    "fullName": "Juan Perez Perez",
                    "email": "josuecb@yandex.com",
                    "passportNumber": "R297875"
                },
                "createdByUserId": "cmq5fd7zx000030jogy9ynzqm",
                "createdBy": {
                    "name": "Josue Cb",
                    "email": "josueenigma3@gmail.com"
                },
                "departureFlights": [
                    {
                        "flight": {
                            "flightNumber": "CM125",
                            "origin": "PTY",
                            "originName": "Tocumen",
                            "destination": "MVD",
                            "destinationName": "Montevideo General C L Berisso",
                            "departureTime": "2026-06-09T17:35:00.000Z"
                        }
                    }
                ],
                "baggage": "SOLO_EQUIPAJE_MANO",
                "invoiceAmount": null,
                "invoiceCurrency": null,
                "status": "REJECTED",
                "pnr": null,
                "ticketNumber": null,
                "pdfURL": "https://minio-api.noxcreation.dev/flycontrol/invoices/invoice_FLA000002.pdf",
                "createdAt": "2026-06-08T23:09:10.646Z",
                "updatedAt": "2026-06-08T23:09:51.632Z"
            },
            {
                "id": "cmq5tda2f0001xcjo37zwz5l3",
                "reservationCode": "FLA000001",
                "tripType": "ONE_WAY",
                "passengerId": "cmq5tctoe0000xcjo8zxwmmbg",
                "passenger": {
                    "fullName": "Juan Perez Perez",
                    "email": "josuecb@yandex.com",
                    "passportNumber": "R297875"
                },
                "createdByUserId": "cmq5fd7zx000030jogy9ynzqm",
                "createdBy": {
                    "name": "Josue Cb",
                    "email": "josueenigma3@gmail.com"
                },
                "departureFlights": [
                    {
                        "flight": {
                            "flightNumber": "CM125",
                            "origin": "PTY",
                            "originName": "Tocumen",
                            "destination": "MVD",
                            "destinationName": "Montevideo General C L Berisso",
                            "departureTime": "2026-06-09T17:35:00.000Z"
                        }
                    }
                ],
                "baggage": "SOLO_EQUIPAJE_MANO",
                "invoiceAmount": null,
                "invoiceCurrency": null,
                "status": "CONFIRMED",
                "pnr": "PN5456",
                "ticketNumber": "TK65216",
                "pdfURL": "https://minio-api.noxcreation.dev/flycontrol/invoices/invoice_FLA000001.pdf",
                "createdAt": "2026-06-08T23:00:10.167Z",
                "updatedAt": "2026-06-08T23:01:16.546Z"
            }
        ],
        "pagination": {
            "page": 1,
            "limit": 100,
            "total": 5,
            "totalPages": 1
        }
    }