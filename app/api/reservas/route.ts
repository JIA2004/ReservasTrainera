import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encontrarMesasDisponibles } from '@/lib/matching';
import { z } from 'zod';
import { ReservaEstado } from '@prisma/client';
import { randomUUID } from 'crypto';
import {
  validateEmail,
  validatePhone,
  validateDate,
  isDayValid,
  isTimeValid,
} from '@/app/lib/validations';

const reservaSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  apellido: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefono: z.string().regex(/^\+?[0-9\s\-()]{8,20}$/, 'Teléfono inválido'),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
  hora: z.string().regex(/^\d{2}:\d{2}$/, 'Hora inválida'),
  comensales: z.number().int().min(1, 'Mínimo 1 comensal').max(20, 'Máximo 20 comensales'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = reservaSchema.parse(body);

    // Cargar configuración desde la DB
    const config = await prisma.configuracion.findUnique({
      where: { id: 'global' },
    });

    if (!config) {
      return NextResponse.json(
        { error: 'CONFIGURACION_FALTANTE', mensaje: 'El sistema no tiene configurada la información necesaria.' },
        { status: 500 }
      );
    }

    const validTimes = config.horariosReservas.split(',');

    // Validar Email y Teléfono usando el módulo de validaciones
    if (data.email && !validateEmail(data.email)) {
      return NextResponse.json({ error: 'EMAIL_INVALIDO', mensaje: 'El email proporcionado no es válido' }, { status: 400 });
    }
    if (!validatePhone(data.telefono)) {
      return NextResponse.json({ error: 'TELEFONO_INVALIDO', mensaje: 'El teléfono proporcionado no es válido' }, { status: 400 });
    }

    // Validar fecha y obtener objeto Date
    const dateValidation = validateDate(data.fecha);
    if (!dateValidation.isValid) {
      return NextResponse.json(
        { error: 'FECHA_INVALIDA', mensaje: dateValidation.error || 'La fecha seleccionada no es válida' },
        { status: 400 }
      );
    }
    const fechaReserva = dateValidation.date!;

    // Verificar que sea día válido
    if (!isDayValid(fechaReserva)) {
      return NextResponse.json(
        { error: 'DIA_INVALIDO', mensaje: 'El restaurante no abre los domingos ni lunes' },
        { status: 400 }
      );
    }

    // Validar horario
    if (!isTimeValid(data.hora, validTimes)) {
      return NextResponse.json(
        { error: 'HORARIO_INVALIDO', mensaje: 'Este horario no está disponible para reservas' },
        { status: 400 }
      );
    }

    // Create reservation with transaction to prevent race conditions
    const reserva = await prisma.$transaction(async (tx) => {
      const match = await encontrarMesasDisponibles(tx, fechaReserva, data.hora, data.comensales);
      
      if (!match.disponible) {
        throw new Error(match.mensaje || 'SIN_DISPONIBILIDAD');
      }

      const created = await tx.reserva.create({
        data: {
          nombre: data.nombre,
          apellido: data.apellido,
          email: data.email || '',
          telefono: data.telefono,
          fecha: fechaReserva,
          hora: data.hora,
          comensales: data.comensales,
          estado: match.requiereAtencion ? ReservaEstado.REQUIERE_ATENCION : ReservaEstado.PENDIENTE,
          cancelToken: randomUUID(),
        },
      });

      if (match.mesasAsignadas && match.mesasAsignadas.length > 0) {
        await tx.reservaMesa.createMany({
          data: match.mesasAsignadas.map((mesa) => ({
            reservaId: created.id,
            mesaId: mesa.id,
          })),
        });
      }

      return created;
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
      { error: 'ERROR', mensaje: 'Error al procesar la reserva. Por favor intentá más tarde.' },
      { status: 500 }
    );
  }
}
