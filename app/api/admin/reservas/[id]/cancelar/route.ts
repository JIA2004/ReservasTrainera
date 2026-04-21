import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { enviarCancelacionCliente } from '@/lib/email';

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: Props) {
  // NOTE: This endpoint is called from admin email links
  // No auth check - relies on the fact that the link is only shown to the admin
  
  try {
    const resolvedParams = await params;
    const reservaId = resolvedParams.id;

    const reserva = await prisma.reserva.findUnique({
      where: { id: reservaId },
    });

    if (!reserva) {
      // Return HTML error page
      return new NextResponse(`
        <html>
          <body style="font-family: sans-serif; padding: 40px; text-align: center;">
            <h1>❌ Error</h1>
            <p>Reserva no encontrada</p>
            <a href="/admin" style="color: #3b82f6;">Ir al admin</a>
          </body>
        </html>
      `, { headers: { 'content-type': 'text/html' } });
    }

    // Delete reserva-mesa associations first
    await prisma.reservaMesa.deleteMany({
      where: { reservaId },
    });

    // Update status to CANCELADA
    const updated = await prisma.reserva.update({
      where: { id: reservaId },
      data: { estado: 'CANCELADA' },
    });

    // Send cancellation email to client
    await enviarCancelacionCliente({
      ...updated,
      cancelToken: updated.cancelToken,
    });

    // Return HTML success page
    return new NextResponse(`
      <html>
        <body style="font-family: sans-serif; padding: 40px; text-align: center;">
          <h1 style="color: #dc2626;">❌ Reserva Cancelada</h1>
          <p><strong>Cliente:</strong> ${updated.nombre} ${updated.apellido}</p>
          <p><strong>Fecha:</strong> ${updated.fecha.toLocaleDateString('es-AR')}</p>
          <p><strong>Hora:</strong> ${updated.hora}</p>
          <br/>
          <a href="/admin" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Ver todas las reservas
          </a>
        </body>
      </html>
    `, { headers: { 'content-type': 'text/html' } });
  } catch (error) {
    console.error('Error cancelling reserva:', error);
    return new NextResponse(`
      <html>
        <body style="font-family: sans-serif; padding: 40px; text-align: center;">
          <h1>❌ Error interno</h1>
          <p>Hubo un problema al cancelar la reserva.</p>
          <a href="/admin" style="color: #3b82f6;">Ir al admin</a>
        </body>
      </html>
    `, { headers: { 'content-type': 'text/html' }, status: 500 });
  }
}