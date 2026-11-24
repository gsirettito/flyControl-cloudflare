export const emailTemplateHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Código de verificación OTP</title>
  <style>
    /* Reset básico para clientes modernos */
    body, table, td, a {
      margin: 0;
      padding: 0;
      border: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    .ExternalClass, .ReadMsgBody {
      width: 100%;
      background-color: #f4f7fb;
    }
    body {
      background-color: #f4f7fb;
    }
    /* Ocultar elementos de Outlook */
    .yshortcuts a {
      border-bottom: none !important;
    }
    @media only screen and (max-width: 600px) {
      .responsive-table {
        width: 100% !important;
      }
      .inner-padding {
        padding: 20px !important;
      }
      .otp-code {
        font-size: 32px !important;
        letter-spacing: 6px !important;
      }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#f4f7fb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <center style="width:100%; table-layout:fixed;">
    <table align="center" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:600px; background-color:#f4f7fb;">
      <tr>
        <td align="center" style="padding: 40px 20px;">
          <!-- Tarjeta principal -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff; border-radius: 24px; box-shadow: 0 8px 20px rgba(0,0,0,0.05); overflow: hidden;">
            <!-- Encabezado (opcional con logo) -->
            <tr>
              <td align="center" style="padding: 32px 32px 0 32px;">
                <h1 style="font-size: 28px; font-weight: 700; color: #1a2c3e; margin: 24px 0 8px 0;">Código de verificación</h1>
                <p style="font-size: 16px; color: #5a6e7c; line-height: 1.5; margin: 0;">Usa este código para completar tu acción</p>
              </td>
            </tr>
            <!-- Código OTP -->
            <tr>
              <td align="center" style="padding: 24px 32px;">
                <div style="background-color: #f0f4fa; border-radius: 20px; padding: 24px 16px;">
                  <span class="otp-code" style="font-size: 40px; font-weight: 800; letter-spacing: 8px; color: #0c35d9; font-family: monospace;">[OTP]</span>
                </div>
              </td>
            </tr>
            <!-- Mensaje de instrucciones -->
            <tr>
              <td align="center" style="padding: 0 32px 24px 32px;">
                <p style="font-size: 14px; color: #5a6e7c; line-height: 1.5; margin: 0 0 16px 0;">
                  Este código es válido por <strong>[TIME] minutos</strong>. No lo compartas con nadie.
                </p>
                <p style="font-size: 13px; color: #8a9aa8; margin: 0;">
                  Si no solicitaste este código, puedes ignorar este mensaje.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </center>
</body>
</html>
`