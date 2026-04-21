import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { enviarCancelacionCliente, enviarNotificacionCancelacionDueno } from '@/lib/email';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { cancelToken } = body;
    const { id } = await params;
    
    // Obtener la reserva
    const reserva = await prisma.reserva.findUnique({
      where: { id },
      include: {
        mesas: {
          include: { mesa: true },
        },
      },
    });

    if (!reserva) {
      return NextResponse.json(
        { error: 'Reserva no encontrada' },
        { status: 404 }
      );
    }

    // IDOR FIX: Verificar cancelToken antes de permitir cancelación
    if (!cancelToken || reserva.cancelToken !== cancelToken) {
      return NextResponse.json(
        { error: 'Token de cancelación inválido' },
        { status: 401 }
      );
    }

    if (reserva.estado === 'CANCELADA') {
      return NextResponse.json(
        { error: 'La reserva ya está cancelada' },
        { status: 400 }
      );
    }

    // Cancelar la reserva y liberar mesas en transaction
    await prisma.$transaction(async (tx) => {
      // Eliminar asignaciones de mesas
      await tx.reservaMesa.deleteMany({
        where: { reservaId: id },
      });

      // Actualizar estado
      await tx.reserva.update({
        where: { id },
        data: { estado: 'CANCELADA' },
      });
    });

    // Enviar emails (async)
    enviarCancelacionCliente(reserva);
    enviarNotificacionCancelacionDueno(reserva);

    return NextResponse.json({
      success: true,
      mensaje: 'Reserva cancelada correctamente',
    });
  } catch (error) {
    console.error('Error al cancelar reserva:', error);
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    );
  }
}