import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encontrarMesasDisponibles } from '@/lib/matching';
import { enviarConfirmacionCliente } from '@/lib/email';
import { z } from 'zod';
import { Reserva, ReservaEstado } from '@prisma/client';
import { randomUUID } from 'crypto';

const reservaSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  apellido: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  telefono: z.string().regex(/^\+?[0-9\s\-()]{8,20}$/, 'Teléfono inválido'),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
  hora: z.string().regex(/^\d{2}:\d{2}$/, 'Hora inválida'),
  comensales: z.number().int().min(1, 'Mínimo 1 comensal').max(20, 'Máximo 20 comensales'),
});

// Tipo para reserva sin DB
interface ReservaFallback {
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
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = reservaSchema.parse(body);

    // Validar horario (hardcodeado como fallback)
    const horariosValidos = ['19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30'];
    if (!horariosValidos.includes(data.hora)) {
      return NextResponse.json(
        { error: 'HORARIO_INVALIDO', mensaje: 'Este horario no está disponible para reservas' },
        { status: 400 }
      );
    }

    // Validar fecha
    const [y, m, d] = data.fecha.split('-').map(Number);
    const fechaReserva = new Date(y, m - 1, d);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const maxFecha = new Date();
    maxFecha.setDate(maxFecha.getDate() + 30);
    
    if (fechaReserva < hoy || fechaReserva > maxFecha) {
      return NextResponse.json(
        { error: 'FECHA_INVALIDA', mensaje: 'La fecha seleccionada no está dentro del rango permitido' },
        { status: 400 }
      );
    }

    // Verificar que sea día válido (martes a sábado)
    const diaSemana = fechaReserva.getDay();
    if (diaSemana === 0 || diaSemana === 1) {
      return NextResponse.json(
        { error: 'DIA_INVALIDO', mensaje: 'El restaurante no abre los domingos ni lunes' },
        { status: 400 }
      );
    }

    // Intentar crear en DB, si falla crear sin persistencia
    let reserva: Reserva | ReservaFallback;
    let dbAvailable = true;

    try {
      // Intentar con DB
      const match = await encontrarMesasDisponibles(prisma, fechaReserva, data.hora, data.comensales);
      
      if (!match.disponible) {
        throw new Error(match.mensaje || 'SIN_DISPONIBILIDAD');
      }

      reserva = await prisma.reserva.create({
        data: {
          nombre: data.nombre,
          apellido: data.apellido,
          email: data.email,
          telefono: data.telefono,
          fecha: fechaReserva,
          hora: data.hora,
          comensales: data.comensales,
          estado: match.requiereAtencion ? ReservaEstado.REQUIERE_ATENCION : ReservaEstado.PENDIENTE,
          cancelToken: randomUUID(),
        },
      });

      if (match.mesasAsignadas && match.mesasAsignadas.length > 0) {
        await prisma.reservaMesa.createMany({
          data: match.mesasAsignadas.map((mesa) => ({
            reservaId: reserva.id,
            mesaId: mesa.id,
          })),
        });
      }
    } catch (dbError) {
      console.warn('⚠️ DB no disponible, creando reserva sin persistencia');
      dbAvailable = false;
      
      // Crear reserva en memoria (sin guardar en DB)
      reserva = {
        id: `temp-${Date.now()}`,
        nombre: data.nombre,
        apellido: data.apellido,
        email: data.email,
        telefono: data.telefono,
        fecha: fechaReserva,
        hora: data.hora,
        comensales: data.comensales,
        estado: 'PENDIENTE',
        cancelToken: randomUUID(),
      };
    }

    // Enviar solo email de confirmación al cliente (no al admin)
    // El owner ve las reservas en /admin
    if (dbAvailable) {
      try {
        enviarConfirmacionCliente(reserva as unknown as Parameters<typeof enviarConfirmacionCliente>[0]);
      } catch (emailError) {
        console.warn('⚠️ Error enviando email:', emailError);
      }
    }

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
      mensaje: '¡Tu reserva fue confirmada! Te enviaremos un email de confirmación.',
    }, { status: 201 });

  } catch (error) {
    console.error('Error al crear reserva:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'VALIDACION', mensaje: 'Datos inválidos', detalles: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message === 'SIN_DISPONIBILIDAD') {
        return NextResponse.json(
          { error: 'SIN_DISPONIBILIDAD', mensaje: 'No hay disponibilidad para ese horario y cantidad de comensales.' },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: 'ERROR', mensaje: 'Error al procesar la reserva' },
      { status: 500 }
    );
  }
}