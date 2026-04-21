import { Resend } from 'resend';
import { prisma } from './prisma';
import { formatDate } from './utils';

const resend = new Resend(process.env.RESEND_API_KEY);

// IMPORTANT: For free tier, you can ONLY send to your registered email (@gmail.com, etc.)
// For production, verify a domain in Resend dashboard
const FROM_EMAIL = process.env.EMAIL_FROM || 'onboarding@resend.dev';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

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
  
  const confirmarLink = `${baseUrl}/admin/reservas/${fechaAdmin}/confirmar/${reserva.id}`;
  const cancelarLink = `${baseUrl}/admin/reservas/${fechaAdmin}/cancelar/${reserva.id}`;

  console.log('[EMAIL] Enviando email...');

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: adminEmail,
      subject: `🔔 NUEVA RESERVA: ${reserva.nombre} ${reserva.apellido} - ${reserva.comensales}p`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px;">
          <h2 style="color: #16a34a;">🆕 Nueva reserva</h2>
          
          <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p><strong>👤:</strong> ${reserva.nombre} ${reserva.apellido}</p>
            <p><strong>📧:</strong> ${reserva.email}</p>
            <p><strong>📱:</strong> ${reserva.telefono}</p>
            <hr/>
            <p><strong>📅:</strong> ${fechaFormateada}</p>
            <p><strong>⏰:</strong> ${horaFormateada}</p>
            <p><strong>👥:</strong> ${reserva.comensales} personas</p>
            <p><strong>📊:</strong> ${reserva.estado}</p>
          </div>
          
          <div style="margin: 24px 0;">
            <a href="${confirmarLink}" 
               style="background: #16a34a; color: white; padding: 14px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              ✅ Confirmar
            </a>
            <a href="${cancelarLink}" 
               style="background: #dc2626; color: white; padding: 14px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-left: 12px;">
              ❌ Cancelar
            </a>
          </div>
        </div>
      `,
    });

    console.log('[EMAIL] Resultado RAW:', JSON.stringify(result));
    
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