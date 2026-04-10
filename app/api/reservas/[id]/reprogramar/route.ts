import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encontrarMesasDisponibles } from '@/lib/matching';
import { ReservaEstado } from '@prisma/client';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { fecha, hora } = body;
    const { id } = await params;

    // Obtener la reserva actual
    const reservaActual = await prisma.reserva.findUnique({
      where: { id },
      include: {
        mesas: {
          include: { mesa: true },
        },
      },
    });

    if (!reservaActual) {
      return NextResponse.json(
        { error: 'Reserva no encontrada' },
        { status: 404 }
      );
    }

    if (reservaActual.estado === 'CANCELADA') {
      return NextResponse.json(
        { error: 'No se puede reprogramar una reserva cancelada' },
        { status: 400 }
      );
    }

    // Validaciones
    const config = await prisma.configuracion.findFirst();
    
    // Usar horarios por defecto si no hay config
    const horariosDefault = ['19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30'];
    const horariosValidos = config?.horariosReservas 
      ? config.horariosReservas.split(',').map(h => h.trim()) 
      : horariosDefault;
    if (!horariosValidos.includes(hora)) {
      return NextResponse.json(
        { error: 'Horario no válido' },
        { status: 400 }
      );
    }

    const fechaDate = new Date(fecha);
    const diaSemana = fechaDate.getDay();
    if (diaSemana === 0 || diaSemana === 1) {
      return NextResponse.json(
        { error: 'El restaurante no abre los domingos ni lunes' },
        { status: 400 }
      );
    }

    // Buscar disponibilidad de mesas (excluyendo la reserva actual)
    const match = await encontrarMesasDisponibles(
      prisma,
      fechaDate,
      hora,
      reservaActual.comensales
    );

    if (!match.disponible) {
      return NextResponse.json(
        { 
          error: 'SIN_DISPONIBILIDAD', 
          mensaje: match.mensaje || 'No hay disponibilidad para ese horario' 
        },
        { status: 409 }
      );
    }

    // Reprogramar en transaction
    const reserva = await prisma.$transaction(async (tx) => {
      // Liberar mesas actuales
      await tx.reservaMesa.deleteMany({
        where: { reservaId: id },
      });

      // Actualizar reserva con nuevo horario
      const updated = await tx.reserva.update({
        where: { id },
        data: {
          fecha: fechaDate,
          hora,
          estado: match.requiereAtencion ? ReservaEstado.REQUIERE_ATENCION : ReservaEstado.PENDIENTE,
          cancelToken: crypto.randomUUID(), // Nuevo token
        },
        include: {
          mesas: {
            include: { mesa: true },
          },
        },
      });

      // Asignar nuevas mesas
      if (match.mesasAsignadas && match.mesasAsignadas.length > 0) {
        await tx.reservaMesa.createMany({
          data: match.mesasAsignadas.map((mesa) => ({
            reservaId: id,
            mesaId: mesa.id,
          })),
        });
      }

      return updated;
    });

    return NextResponse.json({
      success: true,
      reserva: {
        id: reserva.id,
        nombre: reserva.nombre,
        apellido: reserva.apellido,
        fecha: reserva.fecha,
        hora: reserva.hora,
        comensales: reserva.comensales,
        estado: reserva.estado,
      },
      mensaje: 'Reserva reprogramada correctamente',
    });
  } catch (error) {
    console.error('Error al reprogramar reserva:', error);
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    );
  }
}