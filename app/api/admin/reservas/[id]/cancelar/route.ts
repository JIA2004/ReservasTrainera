import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { enviarCancelacionCliente } from '@/lib/email';

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: Props) {
  // Check auth
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  
  if (!session || session.value !== process.env.ADMIN_SESSION_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const resolvedParams = await params;
    const reservaId = resolvedParams.id;

    const reserva = await prisma.reserva.findUnique({
      where: { id: reservaId },
    });

    if (!reserva) {
      return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
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

    // Redirect to admin reservas page
    const fecha = updated.fecha.toISOString().split('T')[0];
    return NextResponse.redirect(new URL(`/admin/reservas/${fecha}`, request.url));
  } catch (error) {
    console.error('Error cancelling reserva:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}