import { Resend } from 'resend';
import { prisma } from './prisma';
import { formatDate } from './utils';

const resend = new Resend(process.env.RESEND_API_KEY);

// IMPORTANT: For free tier, you can ONLY send to your registered email (@gmail.com, etc.)
// For production, verify a domain in Resend dashboard
const FROM_EMAIL = process.env.EMAIL_FROM || 'onboarding@resend.dev';
// Hardcoded for production - change here if domain changes
const APP_URL = 'https://trainera-reservas.vercel.app';

interface ReservaInfo {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  fecha: Date;
  hora: string;
  comensales: number;
  estado: string;
  cancelToken: string;
  mesas?: { mesa: { nombre: string; capacidad: number } }[];
}

function getMesasNombres(reserva: ReservaInfo): string {
  if (!reserva.mesas || reserva.mesas.length === 0) return 'Por asignar';
  return reserva.mesas.map((rm) => rm.mesa.nombre).join(', ');
}

export async function enviarConfirmacionCliente(reserva: ReservaInfo): Promise<void> {
  const fechaFormateada = formatDate(reserva.fecha, "EEEE d 'de' MMMM");
  const horaFormateada = reserva.hora.substring(0, 5);

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: reserva.email,
      subject: `Tu reserva en Trainera está confirmada 📅`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px;">
          <h1>¡Hola ${reserva.nombre}!</h1>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
            <h2>Tu reserva ha sido confirmada</h2>
            <p><strong>📅 Fecha:</strong> ${fechaFormateada}</p>
            <p><strong>⏰ Hora:</strong> ${horaFormateada}</p>
            <p><strong>👥 Comensales:</strong> ${reserva.comensales}</p>
          </div>
          <p>¡Te esperamos!</p>
        </div>
      `,
    });
    console.log('[EMAIL] Confirmación cliente result:', result);
  } catch (error) {
    console.error('[EMAIL] Error confirmación:', error);
  }
}

export async function enviarNotificacionDueno(reserva: ReservaInfo): Promise<void> {
  // Get admin email from DB
  const config = await prisma.configuracion.findFirst();
  const adminEmail = config?.emailDueno || process.env.EMAIL_DUENO;
  
  console.log('[EMAIL] ===== NOTIFICACION ADMIN =====');
  console.log('[EMAIL] Admin configurado:', adminEmail);
  console.log('[EMAIL] From que se usa:', FROM_EMAIL);
  console.log('[EMAIL] RESEND_API_KEY existe:', !!process.env.RESEND_API_KEY);
  
  if (!adminEmail) {
    console.log('[EMAIL] ERROR: No hay email de admin configurado');
    return;
  }
  
  const fechaFormateada = formatDate(reserva.fecha, "EEEE d 'de' MMMM");
  const horaFormateada = reserva.hora.substring(0, 5);
  const fechaAdmin = reserva.fecha.toISOString().split('T')[0];
  const baseUrl = `${APP_URL}`;
  
  const confirmarLink = `${baseUrl}/api/admin/reservas/${reserva.id}/confirmar`;
  const cancelarLink = `${baseUrl}/api/admin/reservas/${reserva.id}/cancelar`;

  console.log('[EMAIL] Enviando email...');

  try {
    console.log('[EMAIL] Llamando a resend.emails.send...');
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: adminEmail,
      subject: `🔔 NUEVA RESERVA: ${reserva.nombre} ${reserva.apellido} - ${reserva.comensales}p en Trainera`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Source+Sans+3:wght@300;400;500;600&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; background-color: #fafaf9; font-family: 'Source Sans 3', -apple-system, BlinkMacSystemFont, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafaf9;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <!-- Main Card -->
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1c1917 0%, #292524 100%); padding: 32px; text-align: center;">
              <h1 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 28px; font-weight: 700; color: #fafaf9; letter-spacing: 0.5px;">
                TRAINERA
              </h1>
              <p style="margin: 8px 0 0; font-size: 13px; color: #a8a29e; font-weight: 300; letter-spacing: 2px; text-transform: uppercase;">
                Cocina Vasca
              </p>
            </td>
          </tr>
          
          <!-- Alert Badge -->
          <tr>
            <td style="padding: 24px 32px 0; text-align: center;">
              <span style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: #ffffff; padding: 8px 20px; border-radius: 20px; font-size: 13px; font-weight: 600; letter-spacing: 0.5px;">
                🆕 NUEVA RESERVA
              </span>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 28px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <!-- Client Info -->
                <tr>
                  <td style="padding: 20px; background: #fef2f2; border-radius: 12px; border-left: 4px solid #dc2626;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-bottom: 8px;">
                          <span style="font-size: 11px; color: #9ca3af; font-weight: 500; letter-spacing: 1px; text-transform: uppercase;">Cliente</span>
                          <h3 style="margin: 4px 0 0; font-size: 18px; font-weight: 600; color: #1c1917;">${reserva.nombre} ${reserva.apellido}</h3>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 12px;">
                          <span style="font-size: 11px; color: #9ca3af; font-weight: 500; letter-spacing: 1px; text-transform: uppercase;">Contacto</span>
                          <p style="margin: 4px 0 0; font-size: 14px; color: #44403c;">
                            📧 ${reserva.email} &nbsp;•&nbsp; 📱 ${reserva.telefono}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Reservation Details -->
                <tr>
                  <td style="padding-top: 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: #fafaf9; border-radius: 12px;">
                      <tr>
                        <td style="padding: 16px 20px; border-bottom: 1px solid #e7e5e4;">
                          <span style="font-size: 11px; color: #9ca3af; font-weight: 500; letter-spacing: 1px; text-transform: uppercase;">Fecha</span>
                          <p style="margin: 4px 0 0; font-size: 16px; font-weight: 600; color: #1c1917;">${fechaFormateada}</p>
                        </td>
                        <td style="padding: 16px 20px; border-bottom: 1px solid #e7e5e4; border-left: 1px solid #e7e5e4;">
                          <span style="font-size: 11px; color: #9ca3af; font-weight: 500; letter-spacing: 1px; text-transform: uppercase;">Hora</span>
                          <p style="margin: 4px 0 0; font-size: 16px; font-weight: 600; color: #1c1917;">${horaFormateada}</p>
                        </td>
                        <td style="padding: 16px 20px; border-bottom: 1px solid #e7e5e4; border-left: 1px solid #e7e5e4;">
                          <span style="font-size: 11px; color: #9ca3af; font-weight: 500; letter-spacing: 1px; text-transform: uppercase;">Comensales</span>
                          <p style="margin: 4px 0 0; font-size: 16px; font-weight: 600; color: #1c1917;">${reserva.comensales} personas</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Status -->
                <tr>
                  <td style="padding-top: 16px; text-align: center;">
                    <span style="display: inline-block; background: #fef3c7; color: #92400e; padding: 6px 16px; border-radius: 6px; font-size: 12px; font-weight: 500;">
                      Estado: ${reserva.estado}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Action Buttons -->
          <tr>
            <td style="padding: 24px 32px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${confirmarLink}" 
                       style="display: inline-block; background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-size: 15px; font-weight: 600; box-shadow: 0 4px 12px rgba(22,163,74,0.3);">
                      ✅ Confirmar Reserva
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 12px;">
                    <a href="${cancelarLink}" 
                       style="display: inline-block; background: #ffffff; color: #dc2626; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-size: 15px; font-weight: 500; border: 2px solid #fecaca;">
                      ❌ Cancelar Reserva
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: #fafaf9; padding: 24px 32px; text-align: center; border-top: 1px solid #e7e5e4;">
              <p style="margin: 0; font-size: 12px; color: #78716c;">
                © 2026 Trainera · Cocina Vasca<br>
                <a href="${baseUrl}/admin" style="color: #dc2626;">Panel de Admin</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    });

    console.log('[EMAIL] 📬 Resultado recibido:', JSON.stringify(result));
    console.log('[EMAIL] data:', result.data);
    console.log('[EMAIL] error:', result.error);
    
    if (result.error) {
      console.error('[EMAIL] ERROR en respuesta:', result.error);
      return;
    }
    
    console.log('[EMAIL] ✅ SUCCESS! Email enviado');
    console.log('[EMAIL] Email ID:', result.data?.id);
    
  } catch (error: any) {
    console.error('[EMAIL] ERROR catch:', error);
  }
  
  console.log('[EMAIL] ===== FIN =====');
}

export async function enviarCancelacionCliente(reserva: ReservaInfo): Promise<void> {
  const fechaFormateada = formatDate(reserva.fecha, "EEEE d 'de' MMMM");

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: reserva.email,
      subject: 'Tu reserva ha sido cancelada',
      html: `<p>Hola ${reserva.nombre}, tu reserva fue cancelada.</p>`,
    });
  } catch (error) {
    console.error('Error sending cancellation:', error);
  }
}

export async function enviarNotificacionCancelacionDueno(reserva: ReservaInfo): Promise<void> {
  const config = await prisma.configuracion.findFirst();
  const adminEmail = config?.emailDueno || process.env.EMAIL_DUENO;
  if (!adminEmail) return;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: adminEmail,
      subject: `❌ Reserva cancelada: ${reserva.nombre}`,
      html: `<p>${reserva.nombre} ${reserva.apellido} canceló su reserva.</p>`,
    });
  } catch (error) {
    console.error('Errornotification:', error);
  }
}

// Re-export for backward compatibility
export async function enviarRecordatorio(reserva: ReservaInfo): Promise<void> {
  const fechaFormateada = formatDate(reserva.fecha, "EEEE d 'de' MMMM");
  const horaFormateada = reserva.hora.substring(0, 5);

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: reserva.email,
      subject: `Tu reserva en Trainera es en 2 horas ⏰`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px;">
          <h1>¡Hola ${reserva.nombre}!</h1>
          <div style="background: #fef3c7; padding: 20px; border-radius: 8px;">
            <h2>⏰ Tu reserva es en 2 horas</h2>
            <p><strong>📅:</strong> ${fechaFormateada}</p>
            <p><strong>⏰:</strong> ${horaFormateada}</p>
            <p><strong>👥:</strong> ${reserva.comensales}</p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error('Error sending reminder:', error);
  }
}