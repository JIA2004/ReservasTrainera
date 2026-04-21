import { Resend } from 'resend';
import { prisma } from './prisma';
import { formatDate } from './utils';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM || 'Trainera <noreply@trainera.com>';
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

  console.log('[EMAIL] Enviando confirmación al cliente:', reserva.email);

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: reserva.email,
      subject: `Tu reserva en Trainera está confirmada 📅`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #333;">¡Hola ${reserva.nombre}!</h1>
          </div>
          
          <div style="background: #f5f5f5; padding: 24px; border-radius: 8px; margin-bottom: 24px;">
            <h2 style="color: #333; margin-top: 0;">Tu reserva ha sido confirmada</h2>
            <p><strong>📅 Fecha:</strong> ${fechaFormateada}</p>
            <p><strong>⏰ Hora:</strong> ${horaFormateada}</p>
            <p><strong>👥 Comensales:</strong> ${reserva.comensales} personas</p>
          </div>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            ¡Muchas gracias por tu reserva! Te comentamos que tenemos una tolerancia de 10 min. 
            al horario de reserva. Te estaremos esperando con gusto!
          </p>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Mientras tanto, podés conocer nuestra carta ingresando a 
            <a href="https://taberna.trainera.com.ar" style="color: #3b82f6;">taberna.trainera.com.ar</a>
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          
          <p style="color: #999; font-size: 12px;">
            Si necesitás cancelar o reprogramar tu reserva, hacé click en los siguientes enlaces:<br/>
            <a href="${APP_URL}/cancelar/${reserva.cancelToken}" style="color: #ef4444;">Cancelar reserva</a> | 
            <a href="${APP_URL}/reprogramar/${reserva.cancelToken}" style="color: #3b82f6;">Reprogramar</a>
          </p>
          
          <p style="color: #666; margin-top: 24px;">
            ¡Te esperamos!<br/>
            <strong>Trainera - Cocina Vasca</strong>
          </p>
        </div>
      `,
    });
    
    console.log('[EMAIL] ✅ Cliente confirmado. Resend response:', JSON.stringify(result));
  } catch (error) {
    console.error('[EMAIL] ❌ Error enviando confirmación:', error);
  }
}

export async function enviarNotificacionDueno(reserva: ReservaInfo): Promise<void> {
  const config = await prisma.configuracion.findFirst();
  const emailDueno = config?.emailDueno || process.env.EMAIL_DUENO;
  
  console.log('[EMAIL] === INICIO NOTIFICACION AL ADMIN ===');
  console.log('[EMAIL] Email配置:', { 
    emailDueno, 
    dbEmail: config?.emailDueno,
    envEmail: !!process.env.EMAIL_DUENO,
    resendKey: !!process.env.RESEND_API_KEY
  });
  
  if (!emailDueno) {
    console.log('[EMAIL] ⚠️ No hay email configurado - abortando');
    return;
  }
  
  const fechaFormateada = formatDate(reserva.fecha, "EEEE d 'de' MMMM");
  const horaFormateada = reserva.hora.substring(0, 5);
  const mesasNombres = getMesasNombres(reserva);
  const fechaAdmin = reserva.fecha.toISOString().split('T')[0];
  const baseAdminUrl = `${APP_URL}/admin`;
  const confirmarUrl = `${baseAdminUrl}/reservas/${fechaAdmin}/confirmar/${reserva.id}`;
  const cancelarUrl = `${baseAdminUrl}/reservas/${fechaAdmin}/cancelar/${reserva.id}`;

  console.log('[EMAIL] Enviando notificación al admin:', emailDueno);
  console.log('[EMAIL] FROM_EMAIL:', FROM_EMAIL);

  try {
    const result: any = await resend.emails.send({
      from: FROM_EMAIL,
      to: emailDueno,
      subject: `🔔 NUEVA RESERVA: ${reserva.nombre} ${reserva.apellido} - ${reserva.comensales}pax`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">🆕 Nueva reserva recibida</h2>
          
          <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p><strong>👤 Cliente:</strong> ${reserva.nombre} ${reserva.apellido}</p>
            <p><strong>📧 Email:</strong> <a href="mailto:${reserva.email}">${reserva.email}</a></p>
            <p><strong>📱 Tel:</strong> <a href="tel:${reserva.telefono}">${reserva.telefono}</a></p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 12px 0;" />
            <p><strong>📅 Fecha:</strong> ${fechaFormateada}</p>
            <p><strong>⏰ Hora:</strong> ${horaFormateada}</p>
            <p><strong>👥 Comensales:</strong> ${reserva.comensales} personas</p>
            <p><strong>🪑 Tipo:</strong> ${mesasNombres}</p>
            <p><strong>📊 Estado:</strong> ${reserva.estado}</p>
          </div>
          
          <div style="margin: 24px 0;">
            <a href="${confirmarUrl}" 
               style="background: #16a34a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; margin-right: 12px;">
              ✅ Confirmar
            </a>
            <a href="${cancelarUrl}" 
               style="background: #dc2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              ❌ Cancelar
            </a>
          </div>
        </div>
      `,
    });
    
    console.log('[EMAIL] 📬 Respuesta completa de Resend:', JSON.stringify(result, null, 2));
    
    // Check for errors in response
    if (result.data?.error) {
      console.error('[EMAIL] ❌ Error de Resend:', result.data.error);
    } else if (result.error) {
      console.error('[EMAIL] ❌ Error de Resend:', result.error);
    } else {
      console.log('[EMAIL] ✅ Email enviado exitosamente!');
      console.log('[EMAIL] ID del email:', result.data?.id);
    }
    
    console.log('[EMAIL] === FIN NOTIFICACION ===');
  } catch (error: any) {
    console.error('[EMAIL] ❌ Error capturado:', error.message || error);
    if (error.response) {
      console.error('[EMAIL] Response:', error.response);
    }
  }
}

export async function enviarRecordatorio(reserva: ReservaInfo): Promise<void> {
  const fechaFormateada = formatDate(reserva.fecha, "EEEE d 'de' MMMM");
  const horaFormateada = reserva.hora.substring(0, 5);

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: reserva.email,
      subject: `Tu reserva en Trainera es en 2 horas ⏰`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>¡Hola ${reserva.nombre}!</h1>
          <div style="background: #fef3c7; padding: 24px; border-radius: 8px;">
            <h2>⏰ Tu reserva es en 2 horas</h2>
            <p><strong>📅 ${fechaFormateada}</strong></p>
            <p><strong>⏰ ${horaFormateada}</strong></p>
            <p><strong>👥 ${reserva.comensales} comensales</strong></p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error('Error sending reminder:', error);
  }
}

export async function enviarCancelacionCliente(reserva: ReservaInfo): Promise<void> {
  const fechaFormateada = formatDate(reserva.fecha, "EEEE d 'de' MMMM");
  const horaFormateada = reserva.hora.substring(0, 5);

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: reserva.email,
      subject: `Tu reserva en Trainera ha sido cancelada`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>¡Hola ${reserva.nombre}!</h1>
          <div style="background: #fee2e2; padding: 24px; border-radius: 8px;">
            <h2>Tu reserva ha sido cancelada</h2>
            <p>La reserva para el <strong>${fechaFormateada} a las ${horaFormateada}</strong> ha sido cancelada.</p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error('Error sending cancellation:', error);
  }
}

export async function enviarNotificacionCancelacionDueno(reserva: ReservaInfo): Promise<void> {
  const config = await prisma.configuracion.findFirst();
  const emailDueno = config?.emailDueno || process.env.EMAIL_DUENO;
  if (!emailDueno) return;

  const fechaFormateada = formatDate(reserva.fecha, "EEEE d 'de' MMMM");
  const horaFormateada = reserva.hora.substring(0, 5);

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: emailDueno,
      subject: `❌ Reserva cancelada - ${reserva.nombre} ${reserva.apellido}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #991b1b;">Una reserva fue cancelada</h2>
          <div style="background: #fee2e2; padding: 16px; border-radius: 8px;">
            <p><strong>👤 Nombre:</strong> ${reserva.nombre} ${reserva.apellido}</p>
            <p><strong>📧 Email:</strong> ${reserva.email}</p>
            <p><strong>📅 Fecha:</strong> ${fechaFormateada}</p>
            <p><strong>⏰ Hora:</strong> ${horaFormateada}</p>
            <p><strong>👥 Comensales:</strong> ${reserva.comensales} personas</p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error('Error sending cancellation notification:', error);
  }
}