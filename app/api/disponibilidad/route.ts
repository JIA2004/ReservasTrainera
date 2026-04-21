import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ReservaEstado } from '@prisma/client';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fecha = searchParams.get('fecha');

  if (!fecha) {
    return NextResponse.json(
      { error: 'Fecha requerida' },
      { status: 400 }
    );
  }

  // Validar formato YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return NextResponse.json(
      { error: 'Fecha inválida. Formato esperado: YYYY-MM-DD' },
      { status: 400 }
    );
  }

  // Validar rango de fecha (hoy hasta 1 año)
  const [year, month, day] = fecha.split('-').map(Number);
  const fechaDate = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 1);
  
  if (fechaDate < today || fechaDate > maxDate) {
    return NextResponse.json(
      { error: 'La fecha debe estar entre hoy y un año adelante' },
      { status: 400 }
    );
  }

  try {
    // Obtener configuración
    let config;
    try {
      config = await prisma.configuracion.findFirst();
    } catch (dbError) {
      console.warn('⚠️ DB no disponible, usando configuración por defecto');
    }

    const horariosDefault = ['19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30'];
    const horarios = config?.horariosReservas 
      ? config.horariosReservas.split(',').map(h => h.trim()) 
      : horariosDefault;

    // Para cada horario, calcular disponibilidad
    const disponibilidad = [];

    for (const hora of horarios) {
      const horaTrimmed = hora.trim();
      
      // Obtener mesas disponibles para este horario
      let resultado;
      try {
        resultado = await obtenerCapacidadDisponible(fecha, horaTrimmed);
      } catch (err) {
        console.warn(`⚠️ Error obteniendo disponibilidad para ${horaTrimmed}:`, err);
        // Si falla la DB, permitir reservas
        resultado = { capacidad: 20, tieneMesas: false };
      }
      
      disponibilidad.push({
        hora: horaTrimmed,
        disponibles: resultado.capacidad,
        puedeReservar: resultado.capacidad > 0,
        requiereAtencion: false,
        mesas: [],
      });
    }

    return NextResponse.json({
      fecha,
      disponibilidad,
      config: {
        toleranciaMinutos: config?.toleranciaMinutos ?? 10,
        diasAntelacionMax: config?.diasAntelacionMax ?? 30,
      },
    });
  } catch (error) {
    console.error('Error en disponibilidad:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor', 
        // Devolver disponibilidad por defecto para que funcione sin DB
        disponibilidad: [
          { hora: '19:00', disponibles: 20, puedeReservar: true },
          { hora: '19:30', disponibles: 20, puedeReservar: true },
          { hora: '20:00', disponibles: 20, puedeReservar: true },
          { hora: '20:30', disponibles: 20, puedeReservar: true },
          { hora: '21:00', disponibles: 20, puedeReservar: true },
          { hora: '21:30', disponibles: 20, puedeReservar: true },
          { hora: '22:00', disponibles: 20, puedeReservar: true },
          { hora: '22:30', disponibles: 20, puedeReservar: true },
        ]
      },
      { status: 200 } // Devolver 200 con fallback
    );
  }
}

async function obtenerCapacidadDisponible(fechaStr: string, hora: string) {
  // Obtener todas las mesas activas
  const todasMesas = await prisma.mesa.findMany({
    where: { activa: true },
  });

  // Si no hay mesas configuradas, NO hay disponibilidad
  if (todasMesas.length === 0) {
    return { 
      capacidad: 0,
      tieneMesas: false,
    };
  }

  // Obtener reservas para esta fecha y hora
  const reservas = await prisma.reserva.findMany({
    where: {
      fecha: {
        equals: new Date(fechaStr),
      },
      hora: hora,
      estado: { notIn: [ReservaEstado.CANCELADA] },
    },
    include: {
      mesas: {
        include: { mesa: true },
      },
    },
  });

  // Calcular mesas ocupadas
  const mesasOcupadas = new Set<string>();
  reservas.forEach((reserva) => {
    reserva.mesas.forEach((rm) => {
      mesasOcupadas.add(rm.mesaId);
    });
  });

  // Filtrar mesas libres
  const mesasLibres = todasMesas.filter((m) => !mesasOcupadas.has(m.id));
  
  // Si no hay mesas libres, NO hay disponibilidad
  if (mesasLibres.length === 0) {
    return { 
      capacidad: 0,
      tieneMesas: true,
    };
  }

  // Calcular capacidad total disponible (sin Math.max falsificador)
  const capacidad = mesasLibres.reduce((sum, m) => sum + m.capacidad, 0);

  return { 
    capacidad,
    tieneMesas: true, 
  };
}
