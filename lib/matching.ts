import { PrismaClient, Mesa, ReservaEstado } from '@prisma/client';

// Type aliases for Prisma clients (works with both regular client and transaction client)
type PrismaClientOrTransaction = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

interface MesaConDisponibilidad extends Mesa {
  disponible: boolean;
}

interface SlotDisponibilidad {
  hora: string;
  disponibles: number;
  puedeReservar: boolean;
  requiereAtencion: boolean;
}

interface MatchingResult {
  disponible: boolean;
  requiereAtencion: boolean;
  mensaje?: string;
  mesasAsignadas?: Mesa[];
}

/**
 * Obtiene las mesas disponibles para una fecha y hora específica
 */
export async function obtenerMesasDisponibles(
  prisma: PrismaClientOrTransaction,
  fecha: Date,
  hora: string
): Promise<MesaConDisponibilidad[]> {
  // Obtener todas las mesas activas
  const todasMesas = await prisma.mesa.findMany({
    where: { activa: true },
    orderBy: { capacidad: 'desc' },
  });

  // Obtener reservas existentes para fecha+hora
  const reservasExistentes = await prisma.reserva.findMany({
    where: {
      fecha: fecha,
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
  reservasExistentes.forEach((reserva) => {
    reserva.mesas.forEach((rm) => {
      mesasOcupadas.add(rm.mesaId);
    });
  });

  // Marcar disponibilidad
  return todasMesas.map((mesa) => ({
    ...mesa,
    disponible: !mesasOcupadas.has(mesa.id),
  }));
}

/**
 * Obtiene la disponibilidad por slot horario para una fecha
 */
export async function obtenerDisponibilidadPorSlot(
  prisma: PrismaClientOrTransaction,
  fecha: Date,
  horarios: string[]
): Promise<SlotDisponibilidad[]> {
  const resultado: SlotDisponibilidad[] = [];

  for (const hora of horarios) {
    const mesas = await obtenerMesasDisponibles(prisma, fecha, hora);
    const disponibles = mesas.filter((m) => m.disponible);

    // Calcular capacidad total disponible
    const capacidadDisponible = disponibles.reduce(
      (sum, m) => sum + m.capacidad,
      0
    );

    resultado.push({
      hora,
      disponibles: capacidadDisponible,
      puedeReservar: capacidadDisponible > 0,
      requiereAtencion: false, // Se determina al hacer match específico
    });
  }

  return resultado;
}

/**
 * Algoritmo greedy para encontrar la mejor combinación de mesas
 */
function matchingGreedy(
  comensales: number,
  mesas: Mesa[]
): MatchingResult {
  // Caso especial: comensales > 6 requiere atención manual
  if (comensales > 6) {
    return {
      disponible: false,
      requiereAtencion: true,
      mensaje:
        'Para grupos de más de 6 personas, contactá directamente al restaurante.',
    };
  }

  // Intento 1: Mesa individual que alcance o supere por poco (tolerance +2)
  for (const mesa of mesas) {
    if (mesa.capacidad >= comensales && mesa.capacidad <= comensales + 2) {
      return { disponible: true, requiereAtencion: false, mesasAsignadas: [mesa] };
    }
  }

  // Intento 2: Mesa individual que alcance o supere (sin tolerancia)
  for (const mesa of mesas) {
    if (mesa.capacidad >= comensales) {
      return { disponible: true, requiereAtencion: false, mesasAsignadas: [mesa] };
    }
  }

  // Intento 3: Combinación de 2 mesas
  for (let i = 0; i < mesas.length; i++) {
    for (let j = i + 1; j < mesas.length; j++) {
      if (mesas[i].capacidad + mesas[j].capacidad >= comensales) {
        return {
          disponible: true,
          requiereAtencion: false,
          mesasAsignadas: [mesas[i], mesas[j]],
        };
      }
    }
  }

  // No hay combinación posible
  return {
    disponible: false,
    requiereAtencion: false,
    mensaje: 'No hay disponibilidad para esa cantidad de comensales.',
  };
}

/**
 * Encuentra las mejores mesas disponibles para una reserva
 */
export async function encontrarMesasDisponibles(
  prisma: PrismaClientOrTransaction,
  fecha: Date,
  hora: string,
  comensales: number
): Promise<MatchingResult> {
  const mesasDisponibles = await obtenerMesasDisponibles(prisma, fecha, hora);
  const mesasLibres = mesasDisponibles.filter((m) => m.disponible);

  // Si no hay mesas en el sistema, NO permitir reserva
  if (mesasDisponibles.length === 0) {
    return {
      disponible: false,
      requiereAtencion: true,
      mensaje: 'El restaurante no tiene mesas configuradas. Contactá al restaurante.',
      mesasAsignadas: [],
    };
  }

  // Si hay mesas pero ninguna libre, NO permitir reserva
  if (mesasLibres.length === 0) {
    return {
      disponible: false,
      requiereAtencion: true,
      mensaje: 'No hay disponibilidad en este horario. Probá con otro horario.',
      mesasAsignadas: [],
    };
  }

  return matchingGreedy(comensales, mesasLibres);
}

/**
 * Libera las mesas de una reserva (para cancelaciones)
 */
export async function liberarMesasReserva(
  prisma: PrismaClientOrTransaction,
  reservaId: string
): Promise<void> {
  await prisma.reservaMesa.deleteMany({
    where: { reservaId },
  });
}
